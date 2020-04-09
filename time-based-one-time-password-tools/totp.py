# 
# Time-based One-Time Password tools (Python)
# 
# Copyright (c) 2020 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/time-based-one-time-password-tools
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

import base64, hashlib, hmac, time, struct, sys, unittest
from typing import List, Optional, Tuple, Union


# ---- Library functions ----

# Time-based One-Time Password algorithm (RFC 6238)
def calc_totp(
		secretkey: bytes,
		epoch: int = 0,
		timestep: int = 30,
		timestamp: Optional[int] = None,
		codelen: int = 6,
		hashfunc = hashlib.sha1,
		) -> str:
	
	if timestamp is None:
		timestamp = int(time.time())
	
	# Check arguments
	assert isinstance(epoch    , int)
	assert isinstance(timestep , int)
	assert isinstance(timestamp, int)
	
	# Calculate HOTP
	timecounter: int = (timestamp - epoch) // timestep
	return calc_hotp(secretkey, struct.pack(">Q", timecounter), codelen, hashfunc)


# HMAC-based One-Time Password algorithm (RFC 4226)
def calc_hotp(
		secretkey: bytes,
		counter: bytes,
		codelen: int = 6,
		hashfunc = hashlib.sha1,
		) -> str:
	
	# Check arguments
	assert isinstance(secretkey, (bytes, bytearray))
	assert isinstance(counter  , (bytes, bytearray))
	assert isinstance(codelen  , int) and 1 <= codelen <= 9
	
	# Calculate HMAC
	hasher = hmac.new(secretkey, counter, hashfunc)
	hash: bytes = hasher.digest()
	
	# Dynamically truncate the hash value
	offset: int = hash[-1] % 16
	extracted: bytes = hash[offset : offset + 4]
	val: int = struct.unpack(">I", extracted)[0]
	val %= 2**31
	
	# Extract and format base-10 digits
	val %= 10**codelen
	return str(val).zfill(codelen)


# Calculates TOTP for the most popular configuration:
# epoch=0, timestep=30, hashfunc=hashlib.sha1, codelen=6.
def calc_totp_compact_default(secretkey: bytes) -> str:
	count = struct.pack(">Q", int(time.time()) // 30)
	hash = hmac.new(secretkey, count, hashlib.sha1).digest()
	offset = hash[-1] % 16
	val, = struct.unpack(">I", hash[offset : offset + 4])
	return str(val % 2**31 % 10**6).zfill(6)



# ---- Test suite ----

class TotpTest(unittest.TestCase):
	
	def test_hotp(self) -> None:
		CASES: List[Tuple[int,str]] = [
			(0, "284755224"),
			(1, "094287082"),
			(2, "137359152"),
			(3, "726969429"),
			(4, "640338314"),
			(5, "868254676"),
			(6, "918287922"),
			(7, "082162583"),
			(8, "673399871"),
			(9, "645520489"),
		]
		SECRET_KEY: bytes = b"12345678901234567890"
		
		for cs in CASES:
			actual = calc_hotp(SECRET_KEY, struct.pack(">Q", cs[0]), 9, hashlib.sha1)
			self.assertEqual(cs[1], actual)
	
	
	def test_totp(self) -> None:
		CASES: List[Tuple[int,str,str,str]] = [
			(         59, "94287082", "46119246", "90693936"),
			( 1111111109, "07081804", "68084774", "25091201"),
			( 1111111111, "14050471", "67062674", "99943326"),
			( 1234567890, "89005924", "91819424", "93441116"),
			( 2000000000, "69279037", "90698825", "38618901"),
			(20000000000, "65353130", "77737706", "47863826"),
		]
		SECRET_KEYS: List[bytes] = [
			b"12345678901234567890",
			b"12345678901234567890123456789012",
			b"1234567890123456789012345678901234567890123456789012345678901234",
		]
		
		for cs in CASES:
			self.assertEqual(cs[1], calc_totp(SECRET_KEYS[0], 0, 30, cs[0], 8, hashlib.sha1  ))
			self.assertEqual(cs[2], calc_totp(SECRET_KEYS[1], 0, 30, cs[0], 8, hashlib.sha256))
			self.assertEqual(cs[3], calc_totp(SECRET_KEYS[2], 0, 30, cs[0], 8, hashlib.sha512))



# ---- Main program ----

def main(args: List[str]) -> None:
	if len(args) == 0:
		unittest.main()
	elif len(args) == 1:
		keystr: str = args[0].replace(" ", "").upper()
		secretkey: bytes = base64.b32decode(keystr)
		code: str = calc_totp(secretkey)
		assert calc_totp_compact_default(secretkey) == code
		print(code)
	else:
		sys.exit("Usage: python totp.py [SecretKey]")


if __name__ == "__main__":
	main(sys.argv[1 : ])
