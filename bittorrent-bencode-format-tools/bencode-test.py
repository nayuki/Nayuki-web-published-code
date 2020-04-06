# 
# BitTorrent bencode coder test suite (Python)
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

import io, unittest
import bencode


class BencodeTest(unittest.TestCase):
	
	# ---- Test the serialization ----
	
	def test_serialize_integer(self):
		self._check_serialize("i0e", 0)
		self._check_serialize("i2e", 2)
		self._check_serialize("i-1e", -1)
		self._check_serialize("i3141592e", 3141592)
		self._check_serialize("i-27182818284e", -27182818284)
		self._check_serialize("i1208925819614629174706176e", 1 << 80)
	
	
	def test_serialize_byte_string(self):
		self._check_serialize("0:", b"")
		self._check_serialize("1:\u0000", b"\x00")
		self._check_serialize("2:\u0004\u0001", b"\x04\x01")
		self._check_serialize("3:ben", b"ben")
		self._check_serialize("10:ABCDE98765", b"ABCDE98765")
	
	
	def test_serialize_list(self):
		self._check_serialize("le", [])
		self._check_serialize("li4ee", [4])
		self._check_serialize("li7e5:Helloe", [7, b"Hello"])
		self._check_serialize("li-88ele1:Xe", [-88, [], b"X"])
	
	
	def test_serialize_dictionary(self):
		self._check_serialize("de", {})
		self._check_serialize("d0:lee", {b"":[]})
		self._check_serialize("d3:AAA6:-141422:ZZi768ee", {b"ZZ":768, b"AAA":b"-14142"})
		self._check_serialize("d1:\u0003le1:\u0008dee", {b"\x03":[], b"\x08":{}})
	
	
	# Asserts that serializing the given bencode value equals the given byte string.
	def _check_serialize(self, expected, obj):
		with io.BytesIO() as out:
			bencode.serialize(obj, out)
			actual = out.getvalue()
		self.assertEqual(expected.encode("UTF-8"), actual)
	
	
	
	# ---- Test the parsing ----
	
	def test_parse_empty(self):
		self._parse_expecting_exception([""], EOFError)
	
	
	def test_parse_invalid(self):
		CASES = [
			"i0ei1e",
			"1:a2:bc3:def",
			"le0:de",
		]
		self._parse_expecting_exception(CASES, ValueError)
	
	
	def test_parse_integer(self):
		self._check_parse(0, "i0e")
		self._check_parse(11, "i11e")
		self._check_parse(-749, "i-749e")
		self._check_parse(9223372036854775807, "i9223372036854775807e")
		self._check_parse(-9223372036854775808, "i-9223372036854775808e")
	
	
	def test_parse_integer_eof(self):
		CASES = [
			"i",
			"i0",
			"i1248",
			"i-",
		]
		self._parse_expecting_exception(CASES, EOFError)
	
	
	def test_parse_integer_invalid(self):
		CASES = [
			"ie",
			"i00",
			"i00e",
			"i019",
			"i0199e",
			"i-e",
			"i-0",
			"i-0e",
			"i-026e",
			"i-B",
			"iA",
			"iAe",
			"i01Ce",
			"i+5e",
			"i4.0e",
			"i9E9e",
		]
		self._parse_expecting_exception(CASES, ValueError)
	
	
	def test_parse_byte_string(self):
		self._check_parse(b"", "0:")
		self._check_parse(b"&", "1:&")
		self._check_parse(b"abcdefghijklm", "13:abcdefghijklm")
	
	
	def test_parse_byte_string_eof(self):
		CASES = [
			"0",
			"1",
			"843",
			"1:",
			"2:",
			"2:q",
			"d",
			"d3:$",
		]
		self._parse_expecting_exception(CASES, EOFError)
	
	
	def test_parse_byte_string_invalid(self):
		CASES = [
			"00",
			"01",
			"00:",
			"01:",
			"-",
			"-0",
			"-1:",
		]
		self._parse_expecting_exception(CASES, ValueError)
	
	
	def test_parse_list(self):
		self._check_parse([], "le")
		self._check_parse([-6], "li-6ee")
		self._check_parse([b"00", 55], "l2:00i55ee")
		self._check_parse([[], []], "llelee")
	
	
	def test_parse_list_eof(self):
		CASES = [
			"l",
			"li0e",
			"llleleel",
		]
		self._parse_expecting_exception(CASES, EOFError)
	
	
	def test_parse_dictionary(self):
		self._check_parse({}, "de")
		self._check_parse({b"-":404}, "d1:-i404ee")
		self._check_parse({b"010":b"101", b"yU":[]}, "d3:0103:1012:yUlee")
	
	
	def test_parse_dictionary_eof(self):
		CASES = [
			"d",
			"d1::",
			"d2:  0:",
			"d0:d",
		]
		self._parse_expecting_exception(CASES, EOFError)
	
	
	def test_parse_dictionary_invalid(self):
		CASES = [
			"d:",
			"d-",
			"d1:A0:1:A1:.",
			"d1:B0:1:A1:.",
			"d1:B0:1:D0:1:C0:",
			"d1:E0:1:F0:1:E0:",
			"d2:gg0:1:g0:",
		]
		self._parse_expecting_exception(CASES, ValueError)
	
	
	# Asserts that parsing each given test case will raise the given exception.
	def _parse_expecting_exception(self, testcases, expect):
		for cs in testcases:
			try:
				BencodeTest._try_parse(cs)
			except Exception as e:
				if isinstance(e, expect):
					continue  # Pass
			self.fail()
	
	
	# Asserts that parsing the given byte string equals the given bencode value.
	def _check_parse(self, expect, s):
		actual = BencodeTest._try_parse(s)
		self.assertTrue(BencodeTest._deep_equals(expect, actual))
	
	
	# Parses the given string into a bencode value.
	@staticmethod
	def _try_parse(s):
		with io.BytesIO(s.encode("UTF-8")) as inp:
			return bencode.parse(inp)
	
	
	# Tests whether the two given bencode values/structures are equal.
	@staticmethod
	def _deep_equals(x, y):
		if bencode.is_int(x) and bencode.is_int(y):
			return x == y
		elif bencode.is_bytes(x) and bencode.is_bytes(y):
			return x == y
		elif bencode.is_list(x) and bencode.is_list(y):
			return len(x) == len(y) and all(
				BencodeTest._deep_equals(xe, ye)
				for (xe, ye) in zip(x, y))
		elif bencode.is_dict(x) and bencode.is_dict(y):
			return len(x) == len(y) and all(
				bencode.is_bytes(xk) and bencode.is_bytes(yk) and
				xk == yk and BencodeTest._deep_equals(xv, yv)
				for ((xk, xv), (yk, yv)) in zip(sorted(x.items()), sorted(y.items())))
		else:
			raise ValueError("Invalid type")



if __name__ == "__main__":
	unittest.main()
