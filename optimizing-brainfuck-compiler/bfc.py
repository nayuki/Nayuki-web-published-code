# 
# Optimizing brainfuck compiler
# Copyright (c) 2013 Nayuki Minase
# 
# http://nayuki.eigenstate.org/page/optimizing-brainfuck-compiler
# 
# This script translates brainfuck source code into C/Java/Python source code.
# Usage: python bfc.py BrainfuckFile OutputFile.c/java/py
# 

import os, re, sys


# ---- Main ----

def main(args):
	# Handle command-line arguments
	if len(args) != 2:
		return "Usage: python bfc.py BrainfuckFile OutputFile.c/java/py"
	
	inname = args[0]
	if not os.path.exists(inname):
		return inname + ": File does not exist"
	if not os.path.isfile(inname):
		return inname + ": Not a file"
	
	outname = args[1]
	if   outname.endswith(".c"   ): outfunc = commands_to_c
	elif outname.endswith(".java"): outfunc = commands_to_java
	elif outname.endswith(".py"  ): outfunc = commands_to_python
	else: return outname + ": Unknown output type"
	
	# Read input
	with open(inname, "r") as fin:
		incode = fin.read()
	
	# Parse and optimize Brainfuck code
	commands = parse(incode)
	commands = optimize(commands)
	commands = optimize(commands)
	commands = optimize(commands)
	
	# Write output
	tempname = os.path.basename(outname)
	outcode = outfunc(commands, tempname[ : tempname.index(".")])
	with open(outname, "w") as fout:
		fout.write(outcode)


# ---- Parser ----

# Parses the given raw code string, returning a list of Command objects.
def parse(codestr):
	codestr = re.sub(r"[^+\-<>.,\[\]]", "", codestr)  # Keep only the 8 Brainfuck characters
	def chargen():
		for c in codestr:
			yield c
		while True:  # At end of stream
			yield ""
	return _parse(chargen(), True)


def _parse(chargen, maincall):
	result = []
	for c in chargen:
		if   c == "+": result.append(Add(0, +1))
		elif c == "-": result.append(Add(0, -1))
		elif c == "<": result.append(Right(-1))
		elif c == ">": result.append(Right(+1))
		elif c == ",": result.append(Input (0))
		elif c == ".": result.append(Output(0))
		elif c == "[": result.append(Loop(_parse(chargen, False)))
		elif c == "]":
			if maincall: raise ValueError("Extra loop closing")
			else: return result
		elif c == "":
			if maincall: return result
			else: raise ValueError("Unclosed loop")
		else:
			raise AssertionError("Illegal code character")


# ---- Optimizers ----

# Optimizes the given list of Commands, returning a new list of Commands.
def optimize(commands):
	result = []
	offset = 0  # How much the memory pointer has moved without being updated
	for cmd in commands:
		if isinstance(cmd, Assign):
			result.append(Assign(cmd.offset + offset, cmd.value))
		elif isinstance(cmd, MultAssign):
			result.append(MultAssign(cmd.srcOff + offset, cmd.destOff + offset, cmd.value))
		elif isinstance(cmd, Add):
			# Try to fuse into previous command
			prev = result[-1] if len(result) >= 1 else None
			if isinstance(prev, Add) and prev.offset == cmd.offset + offset:
				prev.value = (prev.value + cmd.value) & 0xFF
			elif isinstance(prev, Assign) and prev.offset == cmd.offset + offset:
				prev.value = (prev.value + cmd.value) & 0xFF
			else:
				result.append(Add(cmd.offset + offset, cmd.value))
		elif isinstance(cmd, MultAdd):
			# Try to fuse into previous command
			prev = result[-1] if len(result) >= 1 else None
			if isinstance(prev, Assign) and prev.offset == cmd.destOff + offset and prev.value == 0:
				result[-1] = MultAssign(cmd.srcOff + offset, cmd.destOff + offset, cmd.value)
			else:
				result.append(MultAdd(cmd.srcOff + offset, cmd.destOff + offset, cmd.value))
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
				temp = optimize_simple_loop(cmd.commands)
				if temp is not None:
					result.extend(temp)
				else:
					temp = optimize_complex_loop(cmd.commands)
					if temp is not None:
						result.append(temp)
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
def optimize_simple_loop(commands):
	deltas = {}  # delta[i] = v means that in each loop iteration, mem[p + i] is added by the amount v
	offset = 0
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
	result = []
	del deltas[0]
	offsets = deltas.keys()
	offsets.sort()
	for off in offsets:
		result.append(MultAdd(0, off, deltas[off]))
	result.append(Assign(0, 0))
	return result


def optimize_complex_loop(commands):
	otherresult = []
	deltas = {}
	clears = set()
	nonclears = set()
	for cmd in commands:
		if isinstance(cmd, Add):
			deltas[cmd.offset] = deltas.get(cmd.offset, 0) + cmd.value
			nonclears.add(cmd.offset)
		elif isinstance(cmd, MultAdd):
			nonclears.add(cmd.destOff)
			otherresult.append(MultAdd(cmd.srcOff, cmd.destOff, cmd.value))
		elif isinstance(cmd, MultAssign):
			nonclears.add(cmd.destOff)
			otherresult.append(MultAssign(cmd.srcOff, cmd.destOff, cmd.value))
		elif isinstance(cmd, Assign):
			(clears if cmd.value == 0 else nonclears).add(cmd.offset)
			otherresult.append(Assign(cmd.offset, cmd.value))
		else:
			return None
	
	if deltas.get(0, 0) != -1:
		return None
	for cmd in otherresult:
		if      isinstance(cmd, (MultAdd,MultAssign)) and (cmd.srcOff in nonclears or cmd.srcOff not in clears or cmd.destOff == 0) or \
		        isinstance(cmd, (Assign,MultAssign)) and cmd.offset in deltas:
			return None
	
	deltaresult = []
	del deltas[0]
	offsets = deltas.keys()
	offsets.sort()
	for off in offsets:
		deltaresult.append(MultAdd(0, off, deltas[off]))
	deltaresult.append(Assign(0, 0))
	return If(deltaresult + otherresult)


# ---- Output formatters ----

def commands_to_c(commands, name, maincall=True, indentlevel=1):
	def indent(line, level=indentlevel):
		return "\t" * level + line + "\n"
	
	result = ""
	if maincall:
		result += indent("#include <stdio.h>", 0)
		result += indent("#include <string.h>", 0)
		result += indent("", 0)
		result += indent("int main(int argc, char **argv) {", 0)
		result += indent("unsigned char mem[1000000];")
		result += indent("unsigned char *p = &mem[1000];")
		result += indent("memset(mem, 0, sizeof(mem));")
		result += indent("")
	
	for cmd in commands:
		if   isinstance(cmd, Assign    ): result += indent("p[{}] = {};"         .format(cmd.offset, cmd.value))
		elif isinstance(cmd, Add       ): result += indent("p[{}] += {};"        .format(cmd.offset, cmd.value))
		elif isinstance(cmd, MultAssign): result += indent("p[{}] = p[{}] * {};" .format(cmd.destOff, cmd.srcOff, cmd.value))
		elif isinstance(cmd, MultAdd   ): result += indent("p[{}] += p[{}] * {};".format(cmd.destOff, cmd.srcOff, cmd.value))
		elif isinstance(cmd, Right     ): result += indent("p += {};"            .format(cmd.offset))
		elif isinstance(cmd, Input     ): result += indent("p[{}] = getchar();"  .format(cmd.offset))
		elif isinstance(cmd, Output    ): result += indent("putchar(p[{}]);"     .format(cmd.offset))
		elif isinstance(cmd, If        ):
			result += indent("if (*p != 0) {")
			result += commands_to_c(cmd.commands, name, False, indentlevel + 1)
			result += indent("}")
		elif isinstance(cmd, Loop      ):
			result += indent("while (*p != 0) {")
			result += commands_to_c(cmd.commands, name, False, indentlevel + 1)
			result += indent("}")
		else: raise AssertionError("Unknown command")
	
	if maincall:
		result += indent("")
		result += indent("return 0;")
		result += indent("}", 0)
	return result


def commands_to_java(commands, name, maincall=True, indentlevel=2):
	def indent(line, level=indentlevel):
		return "\t" * level + line + "\n"
	
	result = ""
	if maincall:
		result += indent("import java.io.IOException;", 0)
		result += indent("", 0)
		result += indent("public class " + name + " {", 0)
		result += indent("public static void main(String[] args) throws IOException {", 1)
		result += indent("byte[] mem = new byte[1000000];")
		result += indent("int i = 1000;")
		result += indent("")
	
	for cmd in commands:
		if   isinstance(cmd, Assign    ): result += indent("mem[i + {}] = (byte){};".format(cmd.offset, cmd.value))
		elif isinstance(cmd, Add       ): result += indent("mem[i + {}] += {};"     .format(cmd.offset, cmd.value))
		elif isinstance(cmd, MultAssign):
			if cmd.value == 1:
				result += indent("mem[i + {}] = mem[i + {}];".format(cmd.destOff, cmd.srcOff))
			else:
				result += indent("mem[i + {}] = (byte)(mem[i + {}] * {});".format(cmd.destOff, cmd.srcOff, cmd.value))
		elif isinstance(cmd, MultAdd   ):
			if cmd.value == 1:
				result += indent("mem[i + {}] += mem[i + {}];".format(cmd.destOff, cmd.srcOff))
			else:
				result += indent("mem[i + {}] += mem[i + {}] * {};".format(cmd.destOff, cmd.srcOff, cmd.value))
		elif isinstance(cmd, Right     ): result += indent("i += {};"                         .format(cmd.offset))
		elif isinstance(cmd, Input     ): result += indent("mem[{}] = (byte)System.in.read();".format(cmd.offset))
		elif isinstance(cmd, Output    ): result += indent("System.out.write(mem[i + {}]);"   .format(cmd.offset)) + indent("System.out.flush();")
		elif isinstance(cmd, If        ):
			result += indent("if (mem[i] != 0) {")
			result += commands_to_java(cmd.commands, name, False, indentlevel + 1)
			result += indent("}")
		elif isinstance(cmd, Loop      ):
			result += indent("while (mem[i] != 0) {")
			result += commands_to_java(cmd.commands, name, False, indentlevel + 1)
			result += indent("}")
		else: raise AssertionError("Unknown command")
	
	if maincall:
		result += indent("}", 1)
		result += indent("}", 0)
	return result


def commands_to_python(commands, name, maincall=True, indentlevel=0):
	def indent(line, level=indentlevel):
		return "\t" * level + line + "\n"
	
	result = ""
	if maincall:
		result += indent("import sys")
		result += indent("")
		result += indent("mem = [0] * 1000000")
		result += indent("i = 1000")
		result += indent("")
	
	for cmd in commands:
		if   isinstance(cmd, Assign    ): result += indent("mem[i + {}] = {}".format(cmd.offset, cmd.value))
		elif isinstance(cmd, Add       ): result += indent("mem[i + {}] = (mem[i + {}] + {}) & 0xFF".format(cmd.offset, cmd.offset, cmd.value))
		elif isinstance(cmd, MultAssign): result += indent("mem[i + {}] = (mem[i + {}] * {}) & 0xFF".format(cmd.destOff, cmd.srcOff, cmd.value))
		elif isinstance(cmd, MultAdd   ): result += indent("mem[i + {}] = (mem[i + {}] + mem[i + {}] * {}) & 0xFF".format(cmd.destOff, cmd.destOff, cmd.srcOff, cmd.value))
		elif isinstance(cmd, Right     ): result += indent("i += {}".format(cmd.offset))
		elif isinstance(cmd, Input     ): result += indent("mem[{}] = ord(sys.stdin.read())".format(cmd.offset))
		elif isinstance(cmd, Output    ): result += indent("sys.stdout.write(chr(mem[i + {}]))".format(cmd.offset))
		elif isinstance(cmd, If        ):
			result += indent("if mem[i] != 0:")
			result += commands_to_python(cmd.commands, name, False, indentlevel + 1)
		elif isinstance(cmd, Loop      ):
			result += indent("while mem[i] != 0:")
			result += commands_to_python(cmd.commands, name, False, indentlevel + 1)
		else: raise AssertionError("Unknown command")
	return result


# ---- Intermediate representation (IR) ----

class Command(object):  # Common superclass
	pass

class Assign(Command):
	def __init__(self, offset, value):
		self.offset = offset
		self.value = value

class Add(Command):
	def __init__(self, offset, value):
		self.offset = offset
		self.value = value

class MultAssign(Command):
	def __init__(self, srcOff, destOff, value):
		self.srcOff = srcOff
		self.destOff = destOff
		self.value = value

class MultAdd(Command):
	def __init__(self, srcOff, destOff, value):
		self.srcOff = srcOff
		self.destOff = destOff
		self.value = value

class Right(Command):
	def __init__(self, offset):
		self.offset = offset

class Input(Command):
	def __init__(self, offset):
		self.offset = offset

class Output(Command):
	def __init__(self, offset):
		self.offset = offset

class If(Command):
	def __init__(self, commands):
		self.commands = commands

class Loop(Command):
	def __init__(self, commands):
		self.commands = commands


# ---- Miscellaneous ----

if __name__ == "__main__":
	errmsg = main(sys.argv[1:])
	if errmsg is not None:
		print >>sys.stderr, errmsg
		sys.exit(1)
