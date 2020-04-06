# 
# BitTorrent bencode decoder demo (Python)
# 
# Copyright (c) 2020 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/bittorrent-bencode-format-tools
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy of
# this software and associated documentation files (the "Software"), to deal in
# the Software without restriction, including without limitation the rights to
# use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
# the Software, and to permit persons to whom the Software is furnished to do so,
# subject to the following conditions:
# - The above copyright notice and this permission notice shall be included in
#   all copies or substantial portions of the Software.
# - The Software is provided "as is", without warranty of any kind, express or
#   implied, including but not limited to the warranties of merchantability,
#   fitness for a particular purpose and noninfringement. In no event shall the
#   authors or copyright holders be liable for any claim, damages or other
#   liability, whether in an action of contract, tort or otherwise, arising from,
#   out of or in connection with the Software or the use or other dealings in the
#   Software.
# 

from __future__ import print_function
import os, sys
import bencode


# Reads the given file, parses its data as bencode, then prints the
# data structure with hierarchical formatting to standard output.
def main(args):
	USAGE = "Usage: python decode-bencode-demo.py Input.torrent"
	if len(args) != 1:
		sys.exit(USAGE)
	filepath = args[0]
	if not os.path.isfile(filepath):
		sys.exit(USAGE)
	
	with open(filepath, "rb") as inp:
		obj = bencode.parse(inp)
	_print_bencode_value(obj, 0)


# Recursively prints the given value/structure to standard output,
# with at least the given indentation depth.
def _print_bencode_value(obj, depth):
	if bencode.is_int(obj):
		print(f"Integer: {obj}")
	
	elif bencode.is_bytes(obj):
		s = f"Byte string ({len(obj)}) "
		try:
			obj.decode("UTF-8")
			s += "(text): "
		except UnicodeDecodeError:
			s += "(binary): "
		s += _render_byte_string(obj)
		print(s)
	
	elif bencode.is_list(obj):
		print("List:")
		for (i, val) in enumerate(obj):
			_print_indent(depth + 1)
			print(f"{i} = ", end="")
			_print_bencode_value(val, depth + 1)
	
	elif bencode.is_dict(obj):
		print("Dictionary:")
		for (key, val) in sorted(obj.items()):
			_print_indent(depth + 1)
			print(f"{_render_byte_string(key)} = ", end="")
			_print_bencode_value(val, depth + 1)
	
	else:
		raise ValueError(f"Unsupported value type: {type(obj)}")


# Returns a human-friendly string representation of the given byte string.
def _render_byte_string(bs):
	try:
		return bs.decode("UTF-8")
	except UnicodeDecodeError:
		parts = []
		for (i, b) in enumerate(bytearray(bs)):
			parts.append(f"{b:02X}")
			if i + 1 < len(bs) and i == 30:
				parts.append("...")
				break
		return " ".join(parts)


# Prints the given multiple of indentation whitespace
# to standard output, without a trailing newline.
def _print_indent(depth):
	if depth < 0:
		raise ValueError("Negative depth")
	print("    " * depth, end="")


if __name__ == "__main__":
	main(sys.argv[1 : ])
