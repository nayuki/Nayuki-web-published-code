# 
# The SHA-3 family of hash functions. It is described in FIPS Publication 202.
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

def hash224(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given bytelist message, returning 28 bytes."""
	return _hash(message, 224, printdebug)


def hash256(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given bytelist message, returning 32 bytes."""
	return _hash(message, 256, printdebug)


def hash384(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given bytelist message, returning 48 bytes."""
	return _hash(message, 384, printdebug)


def hash512(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given bytelist message, returning 64 bytes."""
	return _hash(message, 512, printdebug)


# ---- Private functions ----

# Computes the hash of the given bytelist message, returning (outbitlen/8) bytes.
def _hash(message: Union[bytes,Sequence[int]], outbitlen: int, printdebug: bool) -> bytes:
	# Make a shallow copy of the list to prevent modifying the caller's list object
	msg = bytearray(message)
	blocksize: int = 200 - outbitlen // 4
	if printdebug:  print(f"sha3.hash{outbitlen}(message = {len(message)} bytes)")
	
	# Append the suffix bits and termination bit (rounded up to a whole byte)
	msg.append(0x06)
	
	# Appending padding bytes until message is exactly a multiple of a whole block
	while len(msg) % blocksize != 0:
		msg.append(0x00)
	
	# Set the final bit
	msg[-1] |= 0x80
	
	# Initialize the hash state
	state: List[List[int]] = [[0] * _MATRIX_SIZE for _ in range(_MATRIX_SIZE)]
	
	# Compress each block in the augmented message
	for i in range(len(msg) // blocksize):
		block: bytes = msg[i * blocksize : (i + 1) * blocksize]
		if printdebug:  print(f"    Block {i} = {cryptocommon.bytelist_to_debugstr(block)}")
		_compress(block, state, printdebug)
	
	# Serialize a prefix of the final state as bytes in little endian
	result = bytearray()
	for y in range(_MATRIX_SIZE):
		for x in range(_MATRIX_SIZE):
			result.extend(state[x][y].to_bytes(8, "little"))
	return result[ : outbitlen // 8]


# All elements of block must be uint8. State is a mutable 5*5 matrix of uint64.
def _compress(block: bytes, state: List[List[int]], printdebug: bool) -> None:
	# Alias shorter names for readability
	sz: int = _MATRIX_SIZE
	
	# Check argument lengths
	assert len(block) <= sz * sz * 8
	assert len(state) == sz
	for column in state:
		assert len(column) == sz
	
	# XOR block bytes into first part of state as uint64 in little endian
	for (i, bv) in enumerate(block):
		j: int = i >> 3
		x, y = j % sz, j // sz
		state[x][y] ^= bv << ((i % 8) * 8)
	
	# Perform 24 rounds of hashing
	a: List[List[int]] = state
	r: int = 1  # 8-bit LFSR
	for i in range(_NUM_ROUNDS):
		if printdebug:
			print(f"        Round {i:2d}:")
			for j in range(sz):
				y = (sz // 2 - j) % sz
				parts: List[str] = []
				for j in range(sz):
					x = (j - sz // 2) % sz
					parts.append(f"[{x},{y}]={a[x][y]:016X}")
				print("            " + ", ".join(parts))
		
		# Theta step
		c: List[int] = [0] * sz
		for x in range(sz):
			for y in range(sz):
				c[x] ^= a[x][y]
		d: List[int] = [(c[(x - 1) % sz] ^ cryptocommon.rotate_left_uint64(c[(x + 1) % sz], 1))
			for x in range(sz)]
		for x in range(sz):
			for y in range(sz):
				a[x][y] ^= d[x]
		
		# Rho step
		e: List[List[int]] = [[cryptocommon.rotate_left_uint64(a[x][y], _ROTATION[x][y])
			for y in range(sz)] for x in range(sz)]
		
		# Pi step
		b: List[List[int]] = [[0] * sz for _ in range(sz)]  # Dummy initial values, all will be overwritten
		for x in range(sz):
			for y in range(sz):
				b[y][(x * 2 + y * 3) % sz] = e[x][y]
		
		# Chi step
		for x in range(sz):
			for y in range(sz):
				a[x][y] = b[x][y] ^ (~b[(x + 1) % sz][y] & b[(x + 2) % sz][y])
		
		# Iota step
		for j in range(7):
			a[0][0] ^= (r & 1) << ((1 << j) - 1)
			r = (r << 1) ^ ((r >> 7) * 0x171)


# ---- Numerical constants/tables ----

_MATRIX_SIZE: int = 5

_NUM_ROUNDS: int = 24

_ROTATION: Tuple[Tuple[int,...],...] = (
	( 0, 36,  3, 41, 18),
	( 1, 44, 10, 45,  2),
	(62,  6, 43, 15, 61),
	(28, 55, 25, 21, 56),
	(27, 20, 39,  8, 14),
)
