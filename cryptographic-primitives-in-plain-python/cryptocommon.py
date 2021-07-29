# 
# Common utility functions and constants for cryptography use.
# 
# Copyright (c) 2021 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/cryptographic-primitives-in-plain-python
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

from typing import List, Sequence, Union


# ---- Low-level arithmetic functions and constants ----

UINT32_MASK: int = (1 << 32) - 1  # 0xFFFF FFFF
UINT64_MASK: int = (1 << 64) - 1  # 0xFFFF FFFF FFFF FFFF


# 'value' must be uint32, 'amount' must be in the range [0, 32), and the result is uint32.
def rotate_left_uint32(value: int, amount: int) -> int:
	assert 0 <= value <= UINT32_MASK
	assert 0 <= amount < 32
	return ((value << amount) | (value >> (32 - amount))) & UINT32_MASK


# 'value' must be uint32, 'amount' must be in the range [0, 32), and the result is uint32.
def rotate_right_uint32(value: int, amount: int) -> int:
	assert 0 <= value <= UINT32_MASK
	assert 0 <= amount < 32
	return ((value << (32 - amount)) | (value >> amount)) & UINT32_MASK


# 'value' must be uint64, 'amount' must be in the range [0, 64), and the result is uint64.
def rotate_left_uint64(value: int, amount: int) -> int:
	assert 0 <= value <= UINT64_MASK
	assert 0 <= amount < 64
	return ((value << amount) | (value >> (64 - amount))) & UINT64_MASK


# 'value' must be uint64, 'amount' must be in the range [0, 64), and the result is uint64.
def rotate_right_uint64(value: int, amount: int) -> int:
	assert 0 <= value <= UINT64_MASK
	assert 0 <= amount < 64
	return ((value << (64 - amount)) | (value >> amount)) & UINT64_MASK


# ---- Data conversion functions ----

# For example: asciistr_to_bytelist("0Az") -> [48, 65, 122].
def asciistr_to_bytelist(asciistr: str) -> bytes:
	return bytes(map(ord, asciistr))


# For example: hexstr_to_bytelist("FF00C0") -> [255, 0, 192].
def hexstr_to_bytelist(hexstr: str) -> bytes:
	assert len(hexstr) % 2 == 0
	return bytes(int(hexstr[i : i + 2], 16) for i in range(0, len(hexstr), 2))


# For example: bytelist_to_hexstr([255, 0, 192]) -> "FF00C0".
def bytelist_to_hexstr(bytelist: Union[bytes,Sequence[int]]) -> str:
	return "".join(f"{b:02X}" for b in bytelist)


# For example: bytelist_to_debugstr([255, 0, 192]) -> "[FF 00 C0]".
def bytelist_to_debugstr(bytelist: Union[bytes,Sequence[int]]) -> str:
	return "[" + " ".join(f"{b:02X}" for b in bytelist) + "]"
