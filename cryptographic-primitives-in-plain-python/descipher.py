# 
# The DES (Data Encryption Standard) block cipher.
# Note: The key length is 64 bits but 8 of them are ignored, so the effective key length is 56 bits.
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

from typing import List, Sequence, Tuple, Union
import cryptocommon


# ---- Public functions ----

def encrypt(block: Union[bytes,Sequence[int]], key: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the encryption of the given block (8 bytes)
	with the given key (8 bytes), returning 8 bytes."""
	return _crypt(block, key, "encrypt", printdebug)


def decrypt(block: Union[bytes,Sequence[int]], key: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the decryption of the given block (8 bytes)
	with the given key (8 bytes), returning 8 bytes."""
	return _crypt(block, key, "decrypt", printdebug)


# ---- Private functions ----

def _crypt(block: Union[bytes,Sequence[int]], key: Union[bytes,Sequence[int]], direction: str, printdebug: bool) -> bytes:
	# Check input arguments
	assert len(block) == 8
	assert len(key) == 8
	assert direction in ("encrypt", "decrypt")
	if printdebug:  print(f"descipher.{direction}(block = {cryptocommon.bytes_to_debugstr(block)}, key = {cryptocommon.bytes_to_debugstr(key)})")
	
	# Pack key bytes
	k: int = int.from_bytes(key, "big")
	assert cryptocommon.is_uint64(k)
	
	# Compute and handle the key schedule
	keyschedule: Tuple[int,...] = _expand_key_schedule(k)
	if direction == "decrypt":
		keyschedule = tuple(reversed(keyschedule))
	
	# Pack block bytes
	m: int = int.from_bytes(block, "big")
	assert cryptocommon.is_uint64(m)
	
	# Do initial permutation on block and split into two uint32 words
	m = _extract_bits(m, 64, _INITIAL_PERMUTATION)
	left : int = (m >> 32) & cryptocommon.UINT32_MASK
	right: int = (m >>  0) & cryptocommon.UINT32_MASK
	
	# Perform 16 rounds of encryption/decryption
	for (i, subkey) in enumerate(keyschedule):
		if printdebug:  print(f"    Round {i:2d}: block = [{left:08X} {right:08X}]")
		left, right = right, (left ^ _feistel_function(right, subkey))
		assert cryptocommon.is_uint32(right)
	
	# Merge the halves back into a uint64 and do final permutation on new block
	m = right << 32 | left
	m = _extract_bits(m, 64, _FINAL_PERMUTATION)
	assert cryptocommon.is_uint64(m)
	
	# Serialize the new block
	return m.to_bytes(8, "big")


def _expand_key_schedule(key: int) -> Tuple[int,...]:
	assert cryptocommon.is_uint64(key)
	result: List[int] = []
	left : int = _extract_bits(key, 64, _PERMUTED_CHOICE_1_LEFT )
	right: int = _extract_bits(key, 64, _PERMUTED_CHOICE_1_RIGHT)
	for shift in _ROUND_KEY_SHIFTS:
		left  = _rotate_left_uint28(left , shift)
		right = _rotate_left_uint28(right, shift)
		assert 0 <= left  < (1 << 28)
		assert 0 <= right < (1 << 28)
		packed: int = left << 28 | right
		subkey: int = _extract_bits(packed, 56, _PERMUTED_CHOICE_2)
		assert 0 <= subkey < (1 << 48)
		result.append(subkey)
	assert len(result) == 16
	return tuple(result)


def _feistel_function(data: int, subkey: int) -> int:
	assert cryptocommon.is_uint32(data)
	assert 0 <= subkey < (1 << 48)
	a: int = _extract_bits(data, 32, _FEISTEL_EXPANSION)  # uint48
	b: int = a ^ subkey     # uint48
	c: int = _do_sboxes(b)  # uint32
	d: int = _extract_bits(c, 32, _FEISTEL_PERMUTATION)   # uint32
	assert cryptocommon.is_uint32(d)
	return d


def _do_sboxes(data: int) -> int:
	assert 0 <= data < (1 << 48)
	mask: int = (1 << 6) - 1
	result: int = 0
	for i in range(8):  # Topmost 6 bits use _SBOXES[0], next lower 6 bits use _SBOXES[1], ..., lowest 6 bits use _SBOXES[7].
		result |= _SBOXES[7 - i][(data >> (i * 6)) & mask] << (i * 4)
	assert cryptocommon.is_uint32(result)
	return result


# Extracts bits from 'value' according to 'indices'. 'value' is uint(bitwidth), and the result is a uint(len(indices)).
# Bit positions in 'value' are numbered from 1 at the most significant bit to 'bitwidth' at the least significant bit.
# indices[0] selects which bit of 'value' maps into the MSB of the result, and indices[-1] maps to the LSB of the result.
# For example: _extract_bits(0b10000, 5, [5, 1, 2]) = 0b010.
def _extract_bits(value: int, bitwidth: int, indices: List[int]) -> int:
	assert 0 <= value < (1 << bitwidth)
	result: int = 0
	for i in indices:
		result <<= 1
		result |= (value >> (bitwidth - i)) & 1
	assert 0 <= result < (1 << len(indices))
	return result


# 'value' is uint28, 'amount' is in the range [0, 28), and result is uint28.
def _rotate_left_uint28(value: int, amount: int) -> int:
	mask: int = (1 << 28) - 1
	assert 0 <= value <= mask
	assert 0 <= amount < 28
	return ((value << amount) | (value >> (28 - amount))) & mask


# ---- Numerical constants/tables ----

# All tables below are copied from https://en.wikipedia.org/wiki/DES_supplementary_material .

# Defines 16 rounds
_ROUND_KEY_SHIFTS: List[int] = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1]

# 64 bits -> 28 bits
_PERMUTED_CHOICE_1_LEFT : List[int] = [57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18, 10, 2, 59, 51, 43, 35, 27, 19, 11, 3, 60, 52, 44, 36]
_PERMUTED_CHOICE_1_RIGHT: List[int] = [63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38, 30, 22, 14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4]

# 56 bits -> 48 bits
_PERMUTED_CHOICE_2: List[int] = [14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10, 23, 19, 12, 4, 26, 8, 16, 7, 27, 20, 13, 2, 41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48, 44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32]

# 64 bits -> 64 bits
_INITIAL_PERMUTATION: List[int] = [58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4, 62, 54, 46, 38, 30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8, 57, 49, 41, 33, 25, 17, 9, 1, 59, 51, 43, 35, 27, 19, 11, 3, 61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39, 31, 23, 15, 7]
_FINAL_PERMUTATION  : List[int] = [40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31, 38, 6, 46, 14, 54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29, 36, 4, 44, 12, 52, 20, 60, 28, 35, 3, 43, 11, 51, 19, 59, 27, 34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9, 49, 17, 57, 25]

# 32 bits -> 48 bits
_FEISTEL_EXPANSION: List[int] = [32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 8, 9, 10, 11, 12, 13, 12, 13, 14, 15, 16, 17, 16, 17, 18, 19, 20, 21, 20, 21, 22, 23, 24, 25, 24, 25, 26, 27, 28, 29, 28, 29, 30, 31, 32, 1]

# 32 bits -> 32 bits
_FEISTEL_PERMUTATION: List[int] = [16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10, 2, 8, 24, 14, 32, 27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25]

# 8 different S-boxes, each mapping 6 input bits to 4 output bits
_SBOXES: List[List[int]] = [
	[0xE, 0x0, 0x4, 0xF, 0xD, 0x7, 0x1, 0x4, 0x2, 0xE, 0xF, 0x2, 0xB, 0xD, 0x8, 0x1, 0x3, 0xA, 0xA, 0x6, 0x6, 0xC, 0xC, 0xB, 0x5, 0x9, 0x9, 0x5, 0x0, 0x3, 0x7, 0x8, 0x4, 0xF, 0x1, 0xC, 0xE, 0x8, 0x8, 0x2, 0xD, 0x4, 0x6, 0x9, 0x2, 0x1, 0xB, 0x7, 0xF, 0x5, 0xC, 0xB, 0x9, 0x3, 0x7, 0xE, 0x3, 0xA, 0xA, 0x0, 0x5, 0x6, 0x0, 0xD],
	[0xF, 0x3, 0x1, 0xD, 0x8, 0x4, 0xE, 0x7, 0x6, 0xF, 0xB, 0x2, 0x3, 0x8, 0x4, 0xE, 0x9, 0xC, 0x7, 0x0, 0x2, 0x1, 0xD, 0xA, 0xC, 0x6, 0x0, 0x9, 0x5, 0xB, 0xA, 0x5, 0x0, 0xD, 0xE, 0x8, 0x7, 0xA, 0xB, 0x1, 0xA, 0x3, 0x4, 0xF, 0xD, 0x4, 0x1, 0x2, 0x5, 0xB, 0x8, 0x6, 0xC, 0x7, 0x6, 0xC, 0x9, 0x0, 0x3, 0x5, 0x2, 0xE, 0xF, 0x9],
	[0xA, 0xD, 0x0, 0x7, 0x9, 0x0, 0xE, 0x9, 0x6, 0x3, 0x3, 0x4, 0xF, 0x6, 0x5, 0xA, 0x1, 0x2, 0xD, 0x8, 0xC, 0x5, 0x7, 0xE, 0xB, 0xC, 0x4, 0xB, 0x2, 0xF, 0x8, 0x1, 0xD, 0x1, 0x6, 0xA, 0x4, 0xD, 0x9, 0x0, 0x8, 0x6, 0xF, 0x9, 0x3, 0x8, 0x0, 0x7, 0xB, 0x4, 0x1, 0xF, 0x2, 0xE, 0xC, 0x3, 0x5, 0xB, 0xA, 0x5, 0xE, 0x2, 0x7, 0xC],
	[0x7, 0xD, 0xD, 0x8, 0xE, 0xB, 0x3, 0x5, 0x0, 0x6, 0x6, 0xF, 0x9, 0x0, 0xA, 0x3, 0x1, 0x4, 0x2, 0x7, 0x8, 0x2, 0x5, 0xC, 0xB, 0x1, 0xC, 0xA, 0x4, 0xE, 0xF, 0x9, 0xA, 0x3, 0x6, 0xF, 0x9, 0x0, 0x0, 0x6, 0xC, 0xA, 0xB, 0x1, 0x7, 0xD, 0xD, 0x8, 0xF, 0x9, 0x1, 0x4, 0x3, 0x5, 0xE, 0xB, 0x5, 0xC, 0x2, 0x7, 0x8, 0x2, 0x4, 0xE],
	[0x2, 0xE, 0xC, 0xB, 0x4, 0x2, 0x1, 0xC, 0x7, 0x4, 0xA, 0x7, 0xB, 0xD, 0x6, 0x1, 0x8, 0x5, 0x5, 0x0, 0x3, 0xF, 0xF, 0xA, 0xD, 0x3, 0x0, 0x9, 0xE, 0x8, 0x9, 0x6, 0x4, 0xB, 0x2, 0x8, 0x1, 0xC, 0xB, 0x7, 0xA, 0x1, 0xD, 0xE, 0x7, 0x2, 0x8, 0xD, 0xF, 0x6, 0x9, 0xF, 0xC, 0x0, 0x5, 0x9, 0x6, 0xA, 0x3, 0x4, 0x0, 0x5, 0xE, 0x3],
	[0xC, 0xA, 0x1, 0xF, 0xA, 0x4, 0xF, 0x2, 0x9, 0x7, 0x2, 0xC, 0x6, 0x9, 0x8, 0x5, 0x0, 0x6, 0xD, 0x1, 0x3, 0xD, 0x4, 0xE, 0xE, 0x0, 0x7, 0xB, 0x5, 0x3, 0xB, 0x8, 0x9, 0x4, 0xE, 0x3, 0xF, 0x2, 0x5, 0xC, 0x2, 0x9, 0x8, 0x5, 0xC, 0xF, 0x3, 0xA, 0x7, 0xB, 0x0, 0xE, 0x4, 0x1, 0xA, 0x7, 0x1, 0x6, 0xD, 0x0, 0xB, 0x8, 0x6, 0xD],
	[0x4, 0xD, 0xB, 0x0, 0x2, 0xB, 0xE, 0x7, 0xF, 0x4, 0x0, 0x9, 0x8, 0x1, 0xD, 0xA, 0x3, 0xE, 0xC, 0x3, 0x9, 0x5, 0x7, 0xC, 0x5, 0x2, 0xA, 0xF, 0x6, 0x8, 0x1, 0x6, 0x1, 0x6, 0x4, 0xB, 0xB, 0xD, 0xD, 0x8, 0xC, 0x1, 0x3, 0x4, 0x7, 0xA, 0xE, 0x7, 0xA, 0x9, 0xF, 0x5, 0x6, 0x0, 0x8, 0xF, 0x0, 0xE, 0x5, 0x2, 0x9, 0x3, 0x2, 0xC],
	[0xD, 0x1, 0x2, 0xF, 0x8, 0xD, 0x4, 0x8, 0x6, 0xA, 0xF, 0x3, 0xB, 0x7, 0x1, 0x4, 0xA, 0xC, 0x9, 0x5, 0x3, 0x6, 0xE, 0xB, 0x5, 0x0, 0x0, 0xE, 0xC, 0x9, 0x7, 0x2, 0x7, 0x2, 0xB, 0x1, 0x4, 0xE, 0x1, 0x7, 0x9, 0x4, 0xC, 0xA, 0xE, 0x8, 0x2, 0xD, 0x0, 0xF, 0x6, 0xC, 0xA, 0x9, 0xD, 0x0, 0xF, 0x3, 0x3, 0x5, 0x5, 0x6, 0x8, 0xB],
]
