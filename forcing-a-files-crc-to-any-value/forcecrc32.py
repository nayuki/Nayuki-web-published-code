#
# CRC-32 forcer (Python)
# Compatible with Python 2 and 3.
#
# Copyright (c) 2016 Project Nayuki
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


# ---- Main function ----

def main(args):
    # Handle arguments
    if len(args) != 3:
        return "Usage: python forcecrc32.py FileName ByteOffset NewCrc32Value"
    try:
        offset = int(args[1])
    except ValueError:
        return "Error: Invalid byte offset"
    if offset < 0:
        return "Error: Negative byte offset"
    try:
        if len(args[2]) != 8 or args[2].startswith(("+", "-")):
            return "Error: Invalid new CRC-32 value"
        temp = int(args[2], 16)
        if temp & MASK != temp:
            return "Error: Invalid new CRC-32 value"
        new_crc = reverse32(temp)
    except ValueError:
        return "Error: Invalid new CRC-32 value"

    # Process the file
    try:
        raf = open(args[0], "r+b")
        try:
            raf.seek(0, os.SEEK_END)
            length = raf.tell()
            if offset + 4 > length:
                return "Error: Byte offset plus 4 exceeds file length"

            # Read entire file and calculate original CRC-32 value
            crc = get_crc32(raf)
            print("Original CRC-32: {:08X}".format(reverse32(crc)))

            # Compute the change to make
            delta = crc ^ new_crc
            delta = multiply_mod(reciprocal_mod(pow_mod(2, (length - offset) * 8)), delta)

            # Patch 4 bytes in the file
            raf.seek(offset)
            bytes4 = bytearray(raf.read(4))
            if len(bytes4) != 4:
                return "Error: Cannot read 4 bytes at offset"
            for i in range(4):
                bytes4[i] ^= (reverse32(delta) >> (i * 8)) & 0xFF
            raf.seek(offset)
            raf.write(bytes4)
            print("Computed and wrote patch")

            # Recheck entire file
            if get_crc32(raf) == new_crc:
                print("New CRC-32 successfully verified")
            else:
                return "Error: Failed to update CRC-32 to desired value"

        except IOError as e:
            return "Error: I/O error"
        finally:
            raf.close()
    except IOError:
        return "Error: Cannot open file " + args[0]
    return None


# ---- Utilities ----

POLYNOMIAL = 0x104C11DB7  # Generator polynomial. Do not modify, because there are many dependencies
MASK = (1 << 32) - 1


def get_crc32(raf):
    raf.seek(0)
    crc = 0
    while True:
        buffer = raf.read(128 * 1024)
        if len(buffer) == 0:
            return reverse32(crc & MASK)
        else:
            crc = zlib.crc32(buffer, crc)


def reverse32(v):
	# blitter-type solution, rather faster than the naive solution
	masks = 0x55555555, 0x33333333, 0xF0F0F0F, 0xFF00FF, 0xFFFF
	for s in range(len(masks)):
		v = ((v >> (1 << s)) & masks[s]) | ((v & masks[s]) << (1 << s))
	return v


# ---- Polynomial arithmetic ----

# Returns polynomial x multiplied by polynomial y modulo the generator polynomial.
def multiply_mod(x, y):
    # Russian peasant multiplication algorithm
    z = 0
    while y != 0:
        z ^= x * (y & 1)
        y >>= 1
        x <<= 1
        if x & (1 << 32) != 0:
            x ^= POLYNOMIAL
    return z


# Returns polynomial x to the power of natural number y modulo the generator polynomial.
def pow_mod(x, y):
    # Exponentiation by squaring
    z = 1
    while y != 0:
        if y & 1 != 0:
            z = multiply_mod(z, x)
        x = multiply_mod(x, x)
        y >>= 1
    return z


# Computes polynomial x divided by polynomial y, returning the quotient and remainder.
def divide_and_remainder(x, y):
    if y == 0:
        raise ValueError("Division by zero")
    if x == 0:
        return (0, 0)

    ydeg = get_degree(y)
    z = 0
    for i in range(get_degree(x) - ydeg, -1, -1):
        if (x & (1 << (i + ydeg)) != 0):
            x ^= y << i
            z |= 1 << i
    return (z, x)


# Returns the reciprocal of polynomial x with respect to the modulus polynomial m.
def reciprocal_mod(x):
    # Based on a simplification of the extended Euclidean algorithm
    y = x
    x = POLYNOMIAL
    a = 0
    b = 1
    while (y != 0):
        divrem = divide_and_remainder(x, y)
        c = a ^ multiply_mod(divrem[0], b)
        x = y
        y = divrem[1]
        a = b
        b = c
    if x == 1:
        return a
    else:
        raise ValueError("Reciprocal does not exist")


def get_degree(x):
    if x == 0:
        return -1
    i = 0
    while True:
        if x >> i == 1:
            return i
        i += 1


# ---- Miscellaneous ----

if __name__ == "__main__":
    errmsg = main(sys.argv[1:])
    if errmsg is not None:
        sys.exit(errmsg)
