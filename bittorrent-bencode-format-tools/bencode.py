# 
# BitTorrent bencode encoder/decoder (Python)
# 
# Copyright (c) 2019 Project Nayuki. (MIT License)
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

import numbers, sys
py3 = sys.version_info.major >= 3
if py3:
	import collections.abc as collections_abc
	unicode = str
else:
	import collections as collections_abc


# ---- Bencode serializer ----

def serialize(obj, out):
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
	result = _parse_value(inp, inp.read(1))
	if inp.read(1) != b"":
		raise ValueError("Unexpected extra data")
	return result


def _parse_value(inp, leadbyte):
	if leadbyte == b"":
		raise EOFError()
	elif leadbyte == b"i":
		return _parse_integer(inp)
	elif b"0" <= leadbyte <= b"9":
		return _parse_byte_string(inp, leadbyte)
	elif leadbyte == b"l":
		return _parse_list(inp)
	elif leadbyte == b"d":
		return _parse_dictionary(inp)
	else:
		raise ValueError("Unexpected value type")


def _parse_integer(inp):
	buf = bytearray()
	while True:
		b = inp.read(1)
		if b == b"":
			raise EOFError()
		if b == b"e":
			break
		
		if len(buf) == 0:
			ok = b == b"-" or b"0" <= b <= b"9"
		elif len(buf) == 1 and buf[0] == ord("-"):
			ok = b"1" <= b <= b"9"
		elif len(buf) == 1 and buf[0] == ord("0"):
			ok = False
		else:  # buf starts with [123456789] or -[123456789]
			ok = b"0" <= b <= b"9"
		
		if ok:
			buf.append(b[0] if py3 else ord(b))
		else:
			raise ValueError("Unexpected integer character")
	if len(buf) == 0 or (len(buf) == 1 and buf[0] == ord("-")):
		raise ValueError("Invalid integer syntax")
	return int(buf)


def _parse_byte_string(inp, leadbyte):
	length = _parse_natural_number(inp, leadbyte)
	result = bytearray()
	for _ in range(length):
		b = inp.read(1)
		if b == b"":
			raise EOFError()
		result.append(b[0] if py3 else ord(b))
	return bytes(result)


def _parse_natural_number(inp, leadbyte):
	buf = bytearray()
	b = leadbyte
	while b != b":":
		if b == b"":
			raise EOFError()
		elif (len(buf) != 1 or buf[0] != ord("0")) and b"0" <= b <= b"9":
			buf.append(b[0] if py3 else ord(b))
		else:
			raise ValueError("Unexpected integer character")
		b = inp.read(1)
	if len(buf) == 0:
		raise ValueError("Invalid integer syntax")
	return int(buf)


def _parse_list(inp):
	result = []
	while True:
		b = inp.read(1)
		if b == b"e":
			break
		result.append(_parse_value(inp, b))
	return result


def _parse_dictionary(inp):
	result = {}
	prevkey = None
	while True:
		b = inp.read(1)
		if b == b"e":
			break
		key = _parse_byte_string(inp, b)
		if prevkey is not None and key <= prevkey:
			raise ValueError("Misordered dictionary key")
		prevkey = key
		
		b = inp.read(1)
		if b == b"":
			raise EOFError()
		result[key] = _parse_value(inp, b)
	return result



# ---- Bencode-Python type checkers ----

def is_int(obj):
	return isinstance(obj, numbers.Integral)

def is_bytes(obj):
	return isinstance(obj, (bytes, bytearray))

def is_list(obj):
	return isinstance(obj, collections_abc.Sequence) and \
		not isinstance(obj, (str, unicode, bytes, bytearray))

def is_dict(obj):
	return isinstance(obj, collections_abc.Mapping)
