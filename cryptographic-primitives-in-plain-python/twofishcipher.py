# 
# The Twofish block cipher.
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
from cryptocommon import UINT32_MASK


byte = int
uint32 = int


# ---- Public functions ----

def encrypt(block: Union[bytes,Sequence[int]], key: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the encryption of the given block (16 bytes)
	with the given key (0 to 32 bytes), returning 16 bytes."""
	return _crypt(block, key, "encrypt", printdebug)


def decrypt(block: Union[bytes,Sequence[int]], key: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the decryption of the given block (16 bytes)
	with the given key (0 to 32 bytes), returning 16 bytes."""
	return _crypt(block, key, "decrypt", printdebug)


# ---- Private cipher functions ----

def _crypt(block: Union[bytes,Sequence[int]], key: Union[bytes,Sequence[int]], direction: str, printdebug: bool) -> bytes:
	# Check input arguments
	assert len(block) == 16
	assert direction in ("encrypt", "decrypt")
	if printdebug:  print(f"twofishcipher.{direction}(block = {cryptocommon.bytes_to_debugstr(block)}, key = {cryptocommon.bytes_to_debugstr(key)})")
	
	# Pack block bytes into four 32-bit words
	bws: List[uint32] = [int.from_bytes(bs, "little") for bs in cryptocommon.iter_blocks(bytes(block), 4)]
	
	# Compute the key schedule and S-box tweaker
	keyschedule, s = _expand_key_schedule(key)
	
	i: int
	if direction == "encrypt":
		# Whitening
		i = 0
		if printdebug:  print(f"    Round {i:2d}: block = {' '.join(f'{x:08X}' for x in bws)}")
		bws[0] ^= keyschedule[0]
		bws[1] ^= keyschedule[1]
		bws[2] ^= keyschedule[2]
		bws[3] ^= keyschedule[3]
		i += 1
		
		# Perform 16 rounds of encryption
		for subkeys in cryptocommon.iter_blocks(keyschedule[8 : ], 2):
			if printdebug:  print(f"    Round {i:2d}: block = {' '.join(f'{x:08X}' for x in bws)}")
			temp0, temp1 = _feistel_function(bws[0], bws[1], subkeys[0], subkeys[1], s)
			bws[2] = cryptocommon.rotate_right_uint32(bws[2] ^ temp0, 1)
			bws[3] = cryptocommon.rotate_left_uint32(bws[3], 1) ^ temp1
			bws = [bws[2], bws[3], bws[0], bws[1]]  # Swap halves
			i += 1
		bws = [bws[2], bws[3], bws[0], bws[1]]  # Undo last swap
		
		# Whitening
		if printdebug:  print(f"    Round {i:2d}: block = {' '.join(f'{x:08X}' for x in bws)}")
		bws[0] ^= keyschedule[4]
		bws[1] ^= keyschedule[5]
		bws[2] ^= keyschedule[6]
		bws[3] ^= keyschedule[7]
	
	elif direction == "decrypt":
		# Whitening
		i = 0
		if printdebug:  print(f"    Round {i:2d}: block = {' '.join(f'{x:08X}' for x in bws)}")
		bws[0] ^= keyschedule[4]
		bws[1] ^= keyschedule[5]
		bws[2] ^= keyschedule[6]
		bws[3] ^= keyschedule[7]
		i += 1
		
		# Perform 16 rounds of decryption
		for subkeys in reversed(list(cryptocommon.iter_blocks(keyschedule[8 : ], 2))):
			if printdebug:  print(f"    Round {i:2d}: block = {' '.join(f'{x:08X}' for x in bws)}")
			temp0, temp1 = _feistel_function(bws[0], bws[1], subkeys[0], subkeys[1], s)
			bws[2] = cryptocommon.rotate_left_uint32(bws[2], 1) ^ temp0
			bws[3] = cryptocommon.rotate_right_uint32(bws[3] ^ temp1, 1)
			bws = [bws[2], bws[3], bws[0], bws[1]]  # Swap halves
			i += 1
		bws = [bws[2], bws[3], bws[0], bws[1]]  # Undo last swap
		
		# Whitening
		if printdebug:  print(f"    Round {i:2d}: block = {' '.join(f'{x:08X}' for x in bws)}")
		bws[0] ^= keyschedule[0]
		bws[1] ^= keyschedule[1]
		bws[2] ^= keyschedule[2]
		bws[3] ^= keyschedule[3]
	
	else:
		raise AssertionError()
	
	# Serialize the new block
	return b"".join(x.to_bytes(4, "little") for x in bws)


def _expand_key_schedule(key: Union[bytes,Sequence[int]]) -> Tuple[Tuple[uint32,...],Tuple[uint32,...]]:
	assert len(key) <= 32
	
	# Pad key with zero until reaching a supported length
	paddedkey = bytearray(key)
	while len(paddedkey) not in (16, 24, 32):
		paddedkey.append(0)
	
	# Pack key bytes into 32-bit words and separate into even/odd indexes
	keywords: List[uint32] = [int.from_bytes(bs, "little") for bs in cryptocommon.iter_blocks(paddedkey, 4)]
	keywordseven: List[uint32] = keywords[0 : : 2]
	keywordsodd : List[uint32] = keywords[1 : : 2]
	assert 2 <= len(keywordseven) == len(keywordsodd) <= 4
	
	# Calculate RS matrix times each block of 8 key bytes
	s: List[uint32] = []
	for bs in cryptocommon.iter_blocks(paddedkey, 8):
		temp = bytearray()
		for row in _RS_MATRIX:
			sum: byte = 0
			for (cell, bb) in zip(row, bs):
				sum ^= _field_multiply(cell, bb, 0x14D)
			temp.append(sum)
		s.append(int.from_bytes(temp, "little"))
	s.reverse()
	assert len(s) == len(keywordseven)
	
	# Calculate actual key schedule
	expandedkey: List[uint32] = []
	for i in range(_NUM_ROUNDS + 4):
		rho: uint32 = 0x01010101
		a: uint32 = _function_h((2 * i + 0) * rho, keywordseven)
		b: uint32 = cryptocommon.rotate_left_uint32(_function_h((2 * i + 1) * rho, keywordsodd), 8)
		a, b = _pseudo_hadamard_transform(a, b)
		expandedkey.append(a)
		expandedkey.append(cryptocommon.rotate_left_uint32(b, 9))
	
	return (tuple(expandedkey), tuple(s))


def _feistel_function(r0: uint32, r1: uint32, subkey0: uint32, subkey1: uint32, s: Sequence[uint32]) -> Tuple[uint32,uint32]:
	assert cryptocommon.is_uint32(r0)
	assert cryptocommon.is_uint32(r1)
	assert cryptocommon.is_uint32(subkey0)
	assert cryptocommon.is_uint32(subkey1)
	
	t0: uint32 = _function_g(r0, s)
	t1: uint32 = _function_g(cryptocommon.rotate_left_uint32(r1, 8), s)
	t0, t1 = _pseudo_hadamard_transform(t0, t1)
	t0 = (t0 + subkey0) & UINT32_MASK
	t1 = (t1 + subkey1) & UINT32_MASK
	return (t0, t1)


# Can be precomputed based on the key, yielding a faster implementation.
def _function_g(x: uint32, s: Sequence[uint32]) -> uint32:
	return _function_h(x, s)


def _function_h(x: uint32, l: Sequence[uint32]) -> uint32:
	assert cryptocommon.is_uint32(x)
	assert 2 <= len(l) <= 4
	xs: bytes = x.to_bytes(4, "little")
	
	def sub_bytes(bs: bytes, sboxindexes: List[int]) -> bytes:
		assert len(bs) == len(sboxindexes)
		return bytes(_function_q(b, _Q_SBOXES[i]) for (b, i) in zip(bs, sboxindexes))
	
	def xor_bytes(bs: bytes, word: uint32) -> bytes:
		assert len(bs) == 4
		assert cryptocommon.is_uint32(word)
		return bytes((b ^ wb) for (b, wb) in zip(bs, word.to_bytes(4, "little")))
	
	for i in reversed(range(len(l))):
		xs = sub_bytes(xs, _FUNCTION_H_SBOX_SEQUENCE[i + 1])
		xs = xor_bytes(xs, l[i])
	xs = sub_bytes(xs, _FUNCTION_H_SBOX_SEQUENCE[0])
	
	zs = bytearray()
	for row in _MDS_MATRIX:
		z: byte = 0
		for (cell, xb) in zip(row, xs):
			z ^= _field_multiply(cell, xb, 0x169)
		zs.append(z)
	result: uint32 = int.from_bytes(zs, "little")
	assert cryptocommon.is_uint32(result)
	return result


# Can be replaced with a constant 256-entry S-box to yield a faster implementation.
def _function_q(x: byte, sboxes: Sequence[Sequence[uint32]]) -> byte:
	assert cryptocommon.is_uint8(x)
	a0 = _uint4(x >> 4)
	b0 = _uint4(x & 0xF)
	a1 = _uint4(a0 ^ b0)
	b1 = _uint4(a0 ^ _rotr4(b0, 1) ^ ((a0 << 3) & 0xF))
	a2 = _uint4(sboxes[0][a1])
	b2 = _uint4(sboxes[1][b1])
	a3 = _uint4(a2 ^ b2)
	b3 = _uint4(a2 ^ _rotr4(b2, 1) ^ ((a2 << 3) & 0xF))
	a4 = _uint4(sboxes[2][a3])
	b4 = _uint4(sboxes[3][b3])
	y: byte = b4 << 4 | a4
	assert cryptocommon.is_uint8(y)
	return y


def _pseudo_hadamard_transform(a: uint32, b: uint32) -> Tuple[uint32,uint32]:
	assert cryptocommon.is_uint32(a)
	assert cryptocommon.is_uint32(b)
	return (
		(a + 1 * b) & UINT32_MASK,
		(a + 2 * b) & UINT32_MASK,
	)


def _field_multiply(x: byte, y: byte, mod: int) -> byte:
	assert cryptocommon.is_uint8(x)
	assert cryptocommon.is_uint8(y)
	assert mod >> 8 == 1
	
	z: byte = 0
	for i in reversed(range(8)):
		z = (z << 1) ^ ((z >> 7) * mod)
		z ^= ((y >> i) & 1) * x
	assert cryptocommon.is_uint8(z)
	return z


# Rotates the given 4-bit integer right by the given number of bits.
def _rotr4(value: int, amount: int) -> int:
	assert 0 <= value < (1 << 4)
	assert 0 <= amount < 4
	return ((value << (4 - amount)) | (value >> amount)) & 0xF


def _uint4(v: int) -> int:
	if 0 <= v < (1 << 4):
		return v
	raise ValueError()


# ---- Numerical constants/tables ----

_NUM_ROUNDS: int = 16


_MDS_MATRIX: List[List[byte]] = [  # Stands for maximum distance separable
	[0x01, 0xEF, 0x5B, 0x5B],
	[0x5B, 0xEF, 0xEF, 0x01],
	[0xEF, 0x5B, 0x01, 0xEF],
	[0xEF, 0x01, 0xEF, 0x5B],
]


_RS_MATRIX: List[List[byte]] = [  # Stands for Reed-Solomon
	[0x01, 0xA4, 0x55, 0x87, 0x5A, 0x58, 0xDB, 0x9E],
	[0xA4, 0x56, 0x82, 0xF3, 0x1E, 0xC6, 0x68, 0xE5],
	[0x02, 0xA1, 0xFC, 0xC1, 0x47, 0xAE, 0x3D, 0x19],
	[0xA4, 0x55, 0x87, 0x5A, 0x58, 0xDB, 0x9E, 0x03],
]


_Q_SBOXES: List[List[List[int]]] = [
	[
		[0x8, 0x1, 0x7, 0xD, 0x6, 0xF, 0x3, 0x2, 0x0, 0xB, 0x5, 0x9, 0xE, 0xC, 0xA, 0x4],
		[0xE, 0xC, 0xB, 0x8, 0x1, 0x2, 0x3, 0x5, 0xF, 0x4, 0xA, 0x6, 0x7, 0x0, 0x9, 0xD],
		[0xB, 0xA, 0x5, 0xE, 0x6, 0xD, 0x9, 0x0, 0xC, 0x8, 0xF, 0x3, 0x2, 0x4, 0x7, 0x1],
		[0xD, 0x7, 0xF, 0x4, 0x1, 0x2, 0x6, 0xE, 0x9, 0xB, 0x3, 0x0, 0x8, 0x5, 0xC, 0xA],
	],
	[
		[0x2, 0x8, 0xB, 0xD, 0xF, 0x7, 0x6, 0xE, 0x3, 0x1, 0x9, 0x4, 0x0, 0xA, 0xC, 0x5],
		[0x1, 0xE, 0x2, 0xB, 0x4, 0xC, 0x3, 0x7, 0x6, 0xD, 0xA, 0x5, 0xF, 0x9, 0x0, 0x8],
		[0x4, 0xC, 0x7, 0x5, 0x1, 0x6, 0x9, 0xA, 0x0, 0xE, 0xD, 0x8, 0x2, 0xB, 0x3, 0xF],
		[0xB, 0x9, 0x5, 0x1, 0xC, 0x3, 0xD, 0xE, 0x6, 0x4, 0x7, 0xF, 0x2, 0x0, 0x8, 0xA],
	],
]


_FUNCTION_H_SBOX_SEQUENCE: List[List[int]] = [
	[1, 0, 1, 0],
	[0, 0, 1, 1],
	[0, 1, 0, 1],
	[1, 1, 0, 0],
	[1, 0, 0, 1],
]
