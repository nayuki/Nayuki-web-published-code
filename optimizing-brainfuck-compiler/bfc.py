# 
# Optimizing brainfuck compiler
# 
# This script translates brainfuck source code into C/Java/Python source code.
# Usage: python bfc.py BrainfuckFile OutputFile.c/java/py
# 
# Copyright (c) 2024 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/optimizing-brainfuck-compiler
# 

from __future__ import annotations
import dataclasses, pathlib, re, sys
from typing import Callable, Dict, Iterator, List, Optional, Sequence, Set


# ---- Main ----

def main(args: Sequence[str]) -> Optional[str]:
	# Handle command-line arguments
	if len(args) != 2:
		return "Usage: python bfc.py BrainfuckFile OutputFile.c/java/py"
	
	inpath: pathlib.Path = pathlib.Path(args[0])
	if not inpath.is_file():
		return f"{inpath}: Not a file"
	
	outpath: pathlib.Path = pathlib.Path(args[1])
	outfunc: Callable[[List[Command],str,bool,int], str]
	if   outpath.suffix == ".c"   :  outfunc = commands_to_c
	elif outpath.suffix == ".java":  outfunc = commands_to_java
	elif outpath.suffix == ".py"  :  outfunc = commands_to_python
	else:  return f"{outpath}: Unknown output type"
	
	# Read input
	with inpath.open("rt") as fin:
		incode = fin.read()
	
	# Parse and optimize Brainfuck code
	commands: List[Command] = parse(incode)
	commands = optimize(commands)
	commands = optimize(commands)
	commands = optimize(commands)
	
	# Write output
	outcode: str = outfunc(commands, outpath.stem)
	with outpath.open("wt") as fout:
		fout.write(outcode)
	return None


# ---- Parser ----

# Parses the given raw code string, returning a list of Command objects.
def parse(codestr: str) -> List[Command]:
	codestr = re.sub(r"[^+\-<>.,\[\]]", "", codestr)  # Keep only the 8 Brainfuck characters
	return _parse(iter(codestr), True)


def _parse(chargen: Iterator[str], maincall: bool) -> List[Command]:
	result: List[Command] = []
	for c in chargen:
		item: Command
		if   c == "+": item = Add(0, +1)
		elif c == "-": item = Add(0, -1)
		elif c == "<": item = Right(-1)
		elif c == ">": item = Right(+1)
		elif c == ",": item = Input (0)
		elif c == ".": item = Output(0)
		elif c == "[": item = Loop(_parse(chargen, False))
		elif c == "]":
			if maincall:
				raise ValueError("Extra loop closing")
			else:
				return result
		else:
			raise AssertionError("Illegal code character")
		result.append(item)
	
	if maincall:
		return result
	else:
		raise ValueError("Unclosed loop")


# ---- Optimizers ----

# Optimizes the given list of Commands, returning a new list of Commands.
def optimize(commands: List[Command]) -> List[Command]:
	result: List[Command] = []
	offset: int = 0  # How much the memory pointer has moved without being updated
	off: int
	prev: Optional[Command]
	for cmd in commands:
		if isinstance(cmd, Assign):
			# Try to fuse into previous command
			off = cmd.offset + offset
			prev = result[-1] if len(result) >= 1 else None
			if isinstance(prev, (Add,Assign)) and prev.offset == off \
					or isinstance(prev, (MultAdd,MultAssign)) and prev.destOff == off:
				del result[-1]
			result.append(Assign(off, cmd.value))
		elif isinstance(cmd, MultAssign):
			result.append(MultAssign(cmd.srcOff + offset, cmd.destOff + offset, cmd.value))
		elif isinstance(cmd, Add):
			# Try to fuse into previous command
			off = cmd.offset + offset
			prev = result[-1] if len(result) >= 1 else None
			if isinstance(prev, Add) and prev.offset == off:
				prev.value = (prev.value + cmd.value) & 0xFF
			elif isinstance(prev, Assign) and prev.offset == off:
				prev.value = (prev.value + cmd.value) & 0xFF
			else:
				result.append(Add(off, cmd.value))
		elif isinstance(cmd, MultAdd):
			# Try to fuse into previous command
			off = cmd.destOff + offset
			prev = result[-1] if len(result) >= 1 else None
			if isinstance(prev, Assign) and prev.offset == off and prev.value == 0:
				result[-1] = MultAssign(cmd.srcOff + offset, off, cmd.value)
			else:
				result.append(MultAdd(cmd.srcOff + offset, off, cmd.value))
		elif isinstance(cmd, Right):
			offset += cmd.offset
		elif isinstance(cmd, Input):
			result.append(Input(cmd.offset + offset))
		elif isinstance(cmd, Output):
			result.append(Output(cmd.offset + offset))
		else:
			# Commit the pointer movement before starting a loop/if
			if offset != 0:
				result.append(Right(offset))
				offset = 0
			
			if isinstance(cmd, Loop):
				temp0: Optional[List[Command]] = optimize_simple_loop(cmd.commands)
				if temp0 is not None:
					result.extend(temp0)
				else:
					temp1: Optional[If] = optimize_complex_loop(cmd.commands)
					if temp1 is not None:
						result.append(temp1)
					else:
						result.append(Loop(optimize(cmd.commands)))
			elif isinstance(cmd, If):
				result.append(If(optimize(cmd.commands)))
			else:
				raise AssertionError("Unknown command")
	
	# Commit the pointer movement before exiting this block
	if offset != 0:
		result.append(Right(offset))
	return result


# Tries to optimize the given list of looped commands into a list that would be executed without looping. Returns None if not possible.
def optimize_simple_loop(commands: List[Command]) -> Optional[List[Command]]:
	deltas: Dict[int,int] = {}  # delta[i] = v means that in each loop iteration, mem[p + i] is added by the amount v
	offset: int = 0
	for cmd in commands:
		# This implementation can only optimize loops that consist of only Add and Right
		if isinstance(cmd, Add):
			off = cmd.offset + offset
			deltas[off] = deltas.get(off, 0) + cmd.value
		elif isinstance(cmd, Right):
			offset += cmd.offset
		else:
			return None
	# Can't optimize if a loop iteration has a net pointer movement, or if the cell being tested isn't decremented by 1
	if offset != 0 or deltas.get(0, 0) != -1:
		return None
	
	# Convert the loop into a list of multiply-add commands that source from the cell being tested
	del deltas[0]
	result: List[Command] = []
	for off in sorted(deltas.keys()):
		result.append(MultAdd(0, off, deltas[off]))
	result.append(Assign(0, 0))
	return result


# Attempts to convert the body of a while-loop into an if-statement. This is possible if roughly all these conditions are met:
# - There are no commands other than Add/Assign/MultAdd/MultAssign (in particular, no net movement, I/O, or embedded loops)
# - The value at offset 0 is decremented by 1
# - All MultAdd and MultAssign commands read from {an offset other than 0 whose value is cleared before the end in the loop}
def optimize_complex_loop(commands: List[Command]) -> Optional[If]:
	result: List[Command] = []
	origindelta: int = 0
	clears: Set[int] = {0}
	for cmd in commands:
		if isinstance(cmd, Add):
			if cmd.offset == 0:
				origindelta += cmd.value
			else:
				clears.discard(cmd.offset)
				result.append(MultAdd(0, cmd.offset, cmd.value))
		elif isinstance(cmd, (MultAdd,MultAssign)):
			if cmd.destOff == 0:
				return None
			clears.discard(cmd.destOff)
			result.append(cmd)
		elif isinstance(cmd, Assign):
			if cmd.offset == 0:
				return None
			else:
				if cmd.value == 0:
					clears.add(cmd.offset)
				else:
					clears.discard(cmd.offset)
				result.append(cmd)
		else:
			return None
	
	if origindelta != -1:
		return None
	for cmd in result:
		if isinstance(cmd, (MultAdd,MultAssign)) and cmd.srcOff not in clears:
			return None
	
	result.append(Assign(0, 0))
	return If(result)


# ---- Output formatters ----

def commands_to_c(commands: List[Command], name: str, maincall: bool = True, indentlevel: int = 1) -> str:
	def indent(line: str, level: int = indentlevel) -> str:
		return "\t" * level + line + "\n"
	
	result: str = ""
	if maincall:
		result += indent("#include <stdint.h>", 0)
		result += indent("#include <stdio.h>", 0)
		result += indent("#include <stdlib.h>", 0)
		result += indent("", 0)
		result += indent("static uint8_t read() {", 0)
		result += indent("int temp = getchar();", 1)
		result += indent("return (uint8_t)(temp != EOF ? temp : 0);", 1)
		result += indent("}", 0)
		result += indent("", 0)
		result += indent("int main(void) {", 0)
		result += indent("uint8_t mem[1000000] = {0};")
		result += indent("uint8_t *p = &mem[1000];")
		result += indent("")
	
	for cmd in commands:
		if isinstance(cmd, Assign):
			result += indent(f"p[{cmd.offset}] = {cmd.value};")
		elif isinstance(cmd, Add):
			s: str = f"p[{cmd.offset}]"
			if cmd.value == 1:
				s += "++;"
			elif cmd.value == -1:
				s += "--;"
			else:
				s += f" {plusminus(cmd.value)}= {abs(cmd.value)};"
			result += indent(s)
		elif isinstance(cmd, MultAssign):
			if cmd.value == 1:
				result += indent(f"p[{cmd.destOff}] = p[{cmd.srcOff}];")
			else:
				result += indent(f"p[{cmd.destOff}] = p[{cmd.srcOff}] * {cmd.value};")
		elif isinstance(cmd, MultAdd):
			if abs(cmd.value) == 1:
				result += indent(f"p[{cmd.destOff}] {plusminus(cmd.value)}= p[{cmd.srcOff}];")
			else:
				result += indent(f"p[{cmd.destOff}] {plusminus(cmd.value)}= p[{cmd.srcOff}] * {abs(cmd.value)};")
		elif isinstance(cmd, Right):
			if cmd.offset == 1:
				result += indent("p++;")
			elif cmd.offset == -1:
				result += indent("p--;")
			else:
				result += indent(f"p {plusminus(cmd.offset)}= {abs(cmd.offset)};")
		elif isinstance(cmd, Input):
			result += indent(f"p[{cmd.offset}] = read();")
		elif isinstance(cmd, Output):
			result += indent(f"putchar(p[{cmd.offset}]);")
		elif isinstance(cmd, If):
			result += indent("if (*p != 0) {")
			result += commands_to_c(cmd.commands, name, False, indentlevel + 1)
			result += indent("}")
		elif isinstance(cmd, Loop):
			result += indent("while (*p != 0) {")
			result += commands_to_c(cmd.commands, name, False, indentlevel + 1)
			result += indent("}")
		else:
			raise AssertionError("Unknown command")
	
	if maincall:
		result += indent("")
		result += indent("return EXIT_SUCCESS;")
		result += indent("}", 0)
	return result


def commands_to_java(commands: List[Command], name: str, maincall: bool = True, indentlevel: int = 2) -> str:
	def indent(line: str, level: int = indentlevel) -> str:
		return "\t" * level + line + "\n"
	
	result: str = ""
	if maincall:
		result += indent("import java.io.IOException;", 0)
		result += indent("", 0)
		result += indent("public class " + name + " {", 0)
		result += indent("public static void main(String[] args) throws IOException {", 1)
		result += indent("byte[] mem = new byte[1000000];")
		result += indent("int i = 1000;")
		result += indent("")
	
	def format_memory(off: int) -> str:
		if off == 0:
			return "mem[i]"
		else:
			return f"mem[i {plusminus(off)} {abs(off)}]"
	
	for cmd in commands:
		if isinstance(cmd, Assign):
			result += indent(f"{format_memory(cmd.offset)} = {(cmd.value & 0xFF) - ((cmd.value & 0x80) << 1)};")
		elif isinstance(cmd, Add):
			if cmd.value == 1:
				result += indent(f"{format_memory(cmd.offset)}++;")
			elif cmd.value == -1:
				result += indent(f"{format_memory(cmd.offset)}--;")
			else:
				result += indent(f"{format_memory(cmd.offset)} {plusminus(cmd.value)}= {abs(cmd.value)};")
		elif isinstance(cmd, MultAssign):
			if cmd.value == 1:
				result += indent(f"{format_memory(cmd.destOff)} = {format_memory(cmd.srcOff)};")
			else:
				result += indent(f"{format_memory(cmd.destOff)} = (byte)({format_memory(cmd.srcOff)} * {cmd.value});")
		elif isinstance(cmd, MultAdd):
			if abs(cmd.value) == 1:
				result += indent(f"{format_memory(cmd.destOff)} {plusminus(cmd.value)}= {format_memory(cmd.srcOff)};")
			else:
				result += indent(f"{format_memory(cmd.destOff)} {plusminus(cmd.value)}= {format_memory(cmd.srcOff)} * {abs(cmd.value)};")
		elif isinstance(cmd, Right):
			if cmd.offset == 1:
				result += indent("i++;")
			elif cmd.offset == -1:
				result += indent("i--;")
			else:
				result += indent(f"i {plusminus(cmd.offset)}= {abs(cmd.offset)};")
		elif isinstance(cmd, Input):
			result += indent(f"{format_memory(cmd.offset)} = (byte)Math.max(System.in.read(), 0);")
		elif isinstance(cmd, Output):
			result += indent(f"System.out.write({format_memory(cmd.offset)});") + indent("System.out.flush();")
		elif isinstance(cmd, If):
			result += indent("if (mem[i] != 0) {")
			result += commands_to_java(cmd.commands, name, False, indentlevel + 1)
			result += indent("}")
		elif isinstance(cmd, Loop):
			result += indent("while (mem[i] != 0) {")
			result += commands_to_java(cmd.commands, name, False, indentlevel + 1)
			result += indent("}")
		else:
			raise AssertionError("Unknown command")
	
	if maincall:
		result += indent("}", 1)
		result += indent("}", 0)
	return result


def commands_to_python(commands: List[Command], name: str, maincall: bool = True, indentlevel: int = 0) -> str:
	def indent(line: str, level: int = indentlevel) -> str:
		return "\t" * level + line + "\n"
	
	result: str = ""
	if maincall:
		result += indent("import sys")
		result += indent("")
		result += indent("mem = [0] * 1000000")
		result += indent("i = 1000")
		result += indent("")
	
	def format_memory(off: int) -> str:
		if off == 0:
			return "mem[i]"
		else:
			return f"mem[i {plusminus(off)} {abs(off)}]"
	
	for cmd in commands:
		if isinstance(cmd, Assign):
			result += indent(f"{format_memory(cmd.offset)} = {cmd.value}")
		elif isinstance(cmd, Add):
			result += indent(f"{format_memory(cmd.offset)} = ({format_memory(cmd.offset)} {plusminus(cmd.value)} {abs(cmd.value)}) & 0xFF")
		elif isinstance(cmd, MultAssign):
			if cmd.value == 1:
				result += indent(f"{format_memory(cmd.destOff)} = {format_memory(cmd.srcOff)}")
			else:
				result += indent(f"{format_memory(cmd.destOff)} = ({format_memory(cmd.srcOff)} * {cmd.value}) & 0xFF")
		elif isinstance(cmd, MultAdd):
			result += indent(f"{format_memory(cmd.destOff)} = ({format_memory(cmd.destOff)} + {format_memory(cmd.srcOff)} * {cmd.value}) & 0xFF")
		elif isinstance(cmd, Right):
			result += indent(f"i {plusminus(cmd.offset)}= {abs(cmd.offset)}")
		elif isinstance(cmd, Input):
			result += indent(f"{format_memory(cmd.offset)} = ord((sys.stdin.read(1) + chr(0))[0])")
		elif isinstance(cmd, Output):
			result += indent(f"sys.stdout.write(chr({format_memory(cmd.offset)}))")
		elif isinstance(cmd, If):
			result += indent("if mem[i] != 0:")
			result += commands_to_python(cmd.commands, name, False, indentlevel + 1)
		elif isinstance(cmd, Loop):
			result += indent("while mem[i] != 0:")
			result += commands_to_python(cmd.commands, name, False, indentlevel + 1)
		else:
			raise AssertionError("Unknown command")
	return result


def plusminus(val: int) -> str:
	if val >= 0:
		return "+"
	else:
		return "-"


# ---- Intermediate representation (IR) ----

class Command:  # Common superclass
	pass

@dataclasses.dataclass
class Assign(Command):
	offset: int
	value: int

@dataclasses.dataclass
class Add(Command):
	offset: int
	value: int

@dataclasses.dataclass
class MultAssign(Command):
	srcOff: int
	destOff: int
	value: int

@dataclasses.dataclass
class MultAdd(Command):
	srcOff: int
	destOff: int
	value: int

@dataclasses.dataclass
class Right(Command):
	offset: int

@dataclasses.dataclass
class Input(Command):
	offset: int

@dataclasses.dataclass
class Output(Command):
	offset: int

@dataclasses.dataclass
class If(Command):
	commands: List[Command]

@dataclasses.dataclass
class Loop(Command):
	commands: List[Command]


# ---- Miscellaneous ----

if __name__ == "__main__":
	errmsg: Optional[str] = main(sys.argv[1 : ])
	if errmsg is not None:
		sys.exit(errmsg)
