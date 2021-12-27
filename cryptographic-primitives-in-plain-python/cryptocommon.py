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

from typing import Iterator, Protocol, Sequence, TypeVar, Union


# ---- Low-level arithmetic functions and constants ----

UINT16_MASK: int = (1 << 16) - 1  # 0xFFFF
UINT32_MASK: int = (1 << 32) - 1  # 0xFFFF_FFFF
UINT64_MASK: int = (1 << 64) - 1  # 0xFFFF_FFFF_FFFF_FFFF


# Tests whether 'value' is an unsigned 8-bit integer.
def is_uint8(value: int) -> bool:
	return 0 <= value < (1 << 8)


# Tests whether 'value' is an unsigned 16-bit integer.
def is_uint16(value: int) -> bool:
	return 0 <= value < (1 << 16)


# Tests whether 'value' is an unsigned 32-bit integer.
def is_uint32(value: int) -> bool:
	return 0 <= value < (1 << 32)


# Tests whether 'value' is an unsigned 64-bit integer.
def is_uint64(value: int) -> bool:
	return 0 <= value < (1 << 64)


# 'value' must be uint32, 'amount' must be in the range [0, 32), and the result is uint32.
def rotate_left_uint32(value: int, amount: int) -> int:
	assert is_uint32(value)
	assert 0 <= amount < 32
	return ((value << amount) | (value >> (32 - amount))) & UINT32_MASK


# 'value' must be uint32, 'amount' must be in the range [0, 32), and the result is uint32.
def rotate_right_uint32(value: int, amount: int) -> int:
	assert is_uint32(value)
	assert 0 <= amount < 32
	return ((value << (32 - amount)) | (value >> amount)) & UINT32_MASK


# 'value' must be uint64, 'amount' must be in the range [0, 64), and the result is uint64.
def rotate_left_uint64(value: int, amount: int) -> int:
	assert is_uint64(value)
	assert 0 <= amount < 64
	return ((value << amount) | (value >> (64 - amount))) & UINT64_MASK


# 'value' must be uint64, 'amount' must be in the range [0, 64), and the result is uint64.
def rotate_right_uint64(value: int, amount: int) -> int:
	assert is_uint64(value)
	assert 0 <= amount < 64
	return ((value << (64 - amount)) | (value >> amount)) & UINT64_MASK


# ---- Miscellaneous functions ----

T = TypeVar("T", bound="_Sliceable")

class _Sliceable(Protocol):
	def __len__(self) -> int: ...
	def __getitem__(self: T, i: slice) -> T: ...

def iter_blocks(seq: T, blocksize: int) -> Iterator[T]:
	assert len(seq) % blocksize == 0
	for i in range(0, len(seq), blocksize):
		yield seq[i : i + blocksize]


# ---- Data conversion functions ----

# For example: asciistr_to_bytes("0Az") -> [48, 65, 122].
def asciistr_to_bytes(asciistr: str) -> bytes:
	return bytes(map(ord, asciistr))


# For example: bytes_to_debugstr([255, 0, 192]) -> "[FF 00 C0]".
def bytes_to_debugstr(bytelist: Union[bytes,Sequence[int]]) -> str:
	return "[" + " ".join(f"{b:02X}" for b in bytelist) + "]"
