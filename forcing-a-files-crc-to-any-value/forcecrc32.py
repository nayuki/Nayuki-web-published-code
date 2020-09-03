# 
# CRC-32 forcer (Python)
# 
# Copyright (c) 2020 Project Nayuki
# https://www.nayuki.io/page/forcing-a-files-crc-to-any-value
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program (see COPYING.txt).
# If not, see <http://www.gnu.org/licenses/>.
# 

import os, sys, zlib
from typing import BinaryIO, List, Optional, Tuple


# ---- Main application ----

def main(args: List[str]) -> Optional[str]:
	# Handle arguments
	if len(args) != 3:
		return "Usage: python forcecrc32.py FileName ByteOffset NewCrc32Value"
	try:
		offset: int = int(args[1])
	except ValueError:
		return "Error: Invalid byte offset"
	if offset < 0:
		return "Error: Negative byte offset"
	try:
		if len(args[2]) != 8 or args[2].startswith(("+", "-")):
			return "Error: Invalid new CRC-32 value"
		temp: int = int(args[2], 16)
		if temp & MASK != temp:
			return "Error: Invalid new CRC-32 value"
		new_crc: int = reverse32(temp)
	except ValueError:
		return "Error: Invalid new CRC-32 value"
	
	# Process the file
	try:
		modify_file_crc32(args[0], offset, new_crc, True)
	except IOError as e:
		return "I/O error: " + str(e)
	except ValueError as e:
		return "Error: " + str(e)
	except AssertionError as e:
		return "Assertion error: " + str(e)
	return None


# ---- Main function ----

# Public library function. offset is uint, and newcrc is uint32.
# May raise IOError, ValueError, AssertionError.
def modify_file_crc32(path: str, offset: int, newcrc: int, printstatus: bool = False) -> None:
	with open(path, "r+b") as raf:
		raf.seek(0, os.SEEK_END)
		length: int = raf.tell()
		if offset + 4 > length:
			raise ValueError("Byte offset plus 4 exceeds file length")
		
		# Read entire file and calculate original CRC-32 value
		crc: int = get_crc32(raf)
		if printstatus:
			print(f"Original CRC-32: {reverse32(crc):08X}")
		
		# Compute the change to make
		delta: int = crc ^ newcrc
		delta = multiply_mod(reciprocal_mod(pow_mod(2, (length - offset) * 8)), delta)
		
		# Patch 4 bytes in the file
		raf.seek(offset)
		bytes4: bytearray = bytearray(raf.read(4))
		if len(bytes4) != 4:
			raise IOError("Cannot read 4 bytes at offset")
		for i in range(4):
			bytes4[i] ^= (reverse32(delta) >> (i * 8)) & 0xFF
		raf.seek(offset)
		raf.write(bytes4)
		if printstatus:
			print("Computed and wrote patch")
		
		# Recheck entire file
		if get_crc32(raf) != newcrc:
			raise AssertionError("Failed to update CRC-32 to desired value")
		elif printstatus:
			print("New CRC-32 successfully verified")


# ---- Utilities ----

POLYNOMIAL: int = 0x104C11DB7  # Generator polynomial. Do not modify, because there are many dependencies
MASK: int = (1 << 32) - 1


def get_crc32(raf: BinaryIO) -> int:
	raf.seek(0)
	crc: int = 0
	while True:
		buffer: bytes = raf.read(128 * 1024)
		if len(buffer) == 0:
			return reverse32(crc)
		crc = zlib.crc32(buffer, crc)


def reverse32(x: int) -> int:
	y: int = 0
	for _ in range(32):
		y = (y << 1) | (x & 1)
		x >>= 1
	return y


# ---- Polynomial arithmetic ----

# Returns polynomial x multiplied by polynomial y modulo the generator polynomial.
def multiply_mod(x: int, y: int) -> int:
	# Russian peasant multiplication algorithm
	z: int = 0
	while y != 0:
		z ^= x * (y & 1)
		y >>= 1
		x <<= 1
		if (x >> 32) & 1 != 0:
			x ^= POLYNOMIAL
	return z


# Returns polynomial x to the power of natural number y modulo the generator polynomial.
def pow_mod(x: int, y: int) -> int:
	# Exponentiation by squaring
	z: int = 1
	while y != 0:
		if y & 1 != 0:
			z = multiply_mod(z, x)
		x = multiply_mod(x, x)
		y >>= 1
	return z


# Computes polynomial x divided by polynomial y, returning the quotient and remainder.
def divide_and_remainder(x: int, y: int) -> Tuple[int,int]:
	if y == 0:
		raise ValueError("Division by zero")
	if x == 0:
		return (0, 0)
	
	ydeg: int = get_degree(y)
	z: int = 0
	for i in range(get_degree(x) - ydeg, -1, -1):
		if (x >> (i + ydeg)) & 1 != 0:
			x ^= y << i
			z |= 1 << i
	return (z, x)


# Returns the reciprocal of polynomial x with respect to the modulus polynomial m.
def reciprocal_mod(x: int) -> int:
	# Based on a simplification of the extended Euclidean algorithm
	y: int = x
	x = POLYNOMIAL
	a: int = 0
	b: int = 1
	while y != 0:
		q, r = divide_and_remainder(x, y)
		c = a ^ multiply_mod(q, b)
		x = y
		y = r
		a = b
		b = c
	if x == 1:
		return a
	else:
		raise ValueError("Reciprocal does not exist")


def get_degree(x: int) -> int:
	return x.bit_length() - 1


# ---- Miscellaneous ----

if __name__ == "__main__":
	errmsg = main(sys.argv[1:])
	if errmsg is not None:
		sys.exit(errmsg)
