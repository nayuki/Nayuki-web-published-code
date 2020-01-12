# 
# BitTorrent bencode encoder/decoder (Python)
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

"""Converts between bencode data structures and byte sequences.
Bencode supports four types of values:
* Integer, which is mapped to Python int.
* Byte string, which is mapped to Python bytes or bytearray.
  (Note that in Python 2, bytes is a synonym for str.)
* List, which is mapped to Python list or tuple, such that every element is a bencode value.
* Dictionary, which is mapped to Python dict, such that every key
  is a bytes object and every value is a bencode value."""

import numbers, sys
py3 = sys.version_info.major >= 3
if py3:
	import collections.abc as collections_abc
	unicode = str
else:
	import collections as collections_abc


# ---- Bencode serializer ----

def serialize(obj, out):
	"""Serializes the given bencode value into bytes and writes them to the given binary output stream.
	The allowed types of the value and its children are described in this module's overview comment.
	Raises TypeError if the value or any child or any dictionary key has an unsupported type."""
	if is_int(obj):
		out.write("i{}e".format(obj).encode("UTF-8"))
	elif is_bytes(obj):
		out.write("{}:".format(len(obj)).encode("UTF-8") + obj)
	elif is_list(obj):
		out.write(b"l")
		for o in obj:
			serialize(o, out)
		out.write(b"e")
	elif is_dict(obj):
		out.write(b"d")
		for (k, v) in sorted(obj.items()):
			if not is_bytes(k):
				raise TypeError("Map/dict key must be a byte string")
			serialize(k, out)
			serialize(v, out)
		out.write(b"e")
	else:
		raise TypeError("Unsupported value type: {}".format(type(obj)))



# ---- Bencode parser ----

def parse(inp):
	"""Parses bytes from the given binary input stream and returns the bencode value represented by the bytes.
	The input data must have exactly one root object and then the stream must immediately end.
	Note that the returned value maps bencode byte string to Python bytes, and maps bencode list to Python list.
	Raises ValueError if the input data does not conform to bencode's serialization syntax rules.
	Raises EOFError if more data was expected but the input stream ended."""
	parser = _Parser(inp)
	result = parser.parse_value(parser.read_byte())
	if inp.read(1) != b"":
		raise ValueError("Unexpected extra data")
	return result


class _Parser(object):
	
	def __init__(self, inp):
		self._input = inp
	
	
	def parse_value(self, head):
		if head == b"i":
			return self._parse_integer()
		elif b"0" <= head <= b"9":
			return self._parse_byte_string(head)
		elif head == b"l":
			return self._parse_list()
		elif head == b"d":
			return self._parse_dictionary()
		else:
			raise ValueError("Unexpected value type")
	
	
	def _parse_integer(self):
		buf = bytearray()
		while True:
			b = self.read_byte()
			if b == b"e":
				break
			
			if buf == b"":
				ok = b == b"-" or b"0" <= b <= b"9"
			elif buf == b"-":
				ok = b"1" <= b <= b"9"
			elif buf == b"0":
				ok = False
			else:  # buf starts with [123456789] or -[123456789]
				ok = b"0" <= b <= b"9"
			
			if not ok:
				raise ValueError("Unexpected integer character")
			buf.append(b[0] if py3 else ord(b))
		if buf in (b"", b"-"):
			raise ValueError("Invalid integer syntax")
		return int(buf)
	
	
	def _parse_byte_string(self, head):
		length = self._parse_natural_number(head)
		result = bytearray()
		for _ in range(length):
			b = self.read_byte()
			result.append(b[0] if py3 else ord(b))
		return bytes(result)
	
	
	def _parse_natural_number(self, head):
		buf = bytearray()
		b = head
		while True:
			if b < b"0" or b > b"9" or buf == b"0":
				raise ValueError("Unexpected integer character")
			buf.append(b[0] if py3 else ord(b))
			b = self.read_byte()
			if b == b":":
				break
		return int(buf)
	
	
	def _parse_list(self):
		result = []
		while True:
			b = self.read_byte()
			if b == b"e":
				break
			result.append(self.parse_value(b))
		return result
	
	
	def _parse_dictionary(self):
		result = {}
		prevkey = None
		while True:
			b = self.read_byte()
			if b == b"e":
				break
			key = self._parse_byte_string(b)
			if prevkey is not None and key <= prevkey:
				raise ValueError("Misordered dictionary key")
			prevkey = key
			result[key] = self.parse_value(self.read_byte())
		return result
	
	
	def read_byte(self):
		result = self._input.read(1)
		if len(result) == 0:
			raise EOFError()
		return result



# ---- Bencode-Python type checkers ----

def is_int(obj):
	"""Tests whether the given value is a bencode integer."""
	return isinstance(obj, numbers.Integral)

def is_bytes(obj):
	"""Tests whether the given value is a bencode byte string."""
	return isinstance(obj, (bytes, bytearray))

def is_list(obj):
	"""Tests whether the given value is a bencode list."""
	return isinstance(obj, collections_abc.Sequence) and \
		not isinstance(obj, (str, unicode, bytes, bytearray))

def is_dict(obj):
	"""Tests whether the given value is a bencode dictionary."""
	return isinstance(obj, collections_abc.Mapping)
