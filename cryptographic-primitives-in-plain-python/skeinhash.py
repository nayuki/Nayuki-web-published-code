# 
# The Skein hash function.
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

from typing import Dict, List, Sequence, Union
import cryptocommon
from cryptocommon import UINT32_MASK


uint64 = int


# ---- Public functions ----

def hash256_160(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 20 bytes."""
	return _hash(message, 256, 160, printdebug)


def hash256_224(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 28 bytes."""
	return _hash(message, 256, 224, printdebug)


def hash256_256(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 32 bytes."""
	return _hash(message, 256, 256, printdebug)


def hash256_384(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 48 bytes."""
	return _hash(message, 256, 384, printdebug)


def hash256_512(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 64 bytes."""
	return _hash(message, 256, 512, printdebug)


def hash256_1024(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 128 bytes."""
	return _hash(message, 256, 1024, printdebug)


def hash512_160(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 20 bytes."""
	return _hash(message, 512, 160, printdebug)


def hash512_224(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 28 bytes."""
	return _hash(message, 512, 224, printdebug)


def hash512_256(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 32 bytes."""
	return _hash(message, 512, 256, printdebug)


def hash512_384(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 48 bytes."""
	return _hash(message, 512, 384, printdebug)


def hash512_512(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 64 bytes."""
	return _hash(message, 512, 512, printdebug)


def hash512_1024(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 128 bytes."""
	return _hash(message, 512, 1024, printdebug)


def hash1024_160(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 20 bytes."""
	return _hash(message, 1024, 160, printdebug)


def hash1024_224(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 28 bytes."""
	return _hash(message, 1024, 224, printdebug)


def hash1024_256(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 32 bytes."""
	return _hash(message, 1024, 256, printdebug)


def hash1024_384(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 48 bytes."""
	return _hash(message, 1024, 384, printdebug)


def hash1024_512(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 64 bytes."""
	return _hash(message, 1024, 512, printdebug)


def hash1024_1024(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 128 bytes."""
	return _hash(message, 1024, 1024, printdebug)


# ---- Private functions ----

def _hash(message: Union[bytes,Sequence[int]], statebits: int, outbits: int, printdebug: bool) -> bytes:
	assert statebits in (256, 512, 1024)
	assert outbits % 8 == 0
	if printdebug:  print(f"skein.hash{statebits}_{outbits}(message = {len(message)} bytes)")
	
	# Compress the configuration
	state: bytes = b"\x00" * (statebits // 8)
	config: bytes = b"SHA3" + (1).to_bytes(2, "little") + b"\x00"*2 + outbits.to_bytes(8, "little") + b"\x00"*16
	state = _unique_block_iteration(state, config, _TYPE_CONFIGURATION, printdebug)
	
	# Compress the message
	state = _unique_block_iteration(state, bytes(message), _TYPE_MESSAGE, printdebug)
	
	# Extract the output
	result = bytearray()
	for i in range((outbits + statebits - 1) // statebits):
		result.extend(_unique_block_iteration(state, i.to_bytes(8, "little"), _TYPE_OUTPUT, printdebug))
	return result[ : outbits // 8]


def _unique_block_iteration(state: bytes, message: bytes, type: int, printdebug: bool) -> bytes:
	if printdebug:  print(f"    UBI: type={type}, state={cryptocommon.bytes_to_hexstr(state)}, message={cryptocommon.bytes_to_hexstr(message)}")
	
	# Pad message up to nearest full block, including at least one
	msg = bytearray(message)
	while (len(msg) == 0) or (len(msg) % len(state) != 0):
		msg.append(0)
	
	# Compress each block
	numblocks: int = len(msg) // len(state)
	for (i, block) in enumerate(cryptocommon.iter_blocks(msg, len(state))):
		position: int = min((i + 1) * len(block), len(message))
		first: bool = i == 0
		final: bool = i == numblocks - 1
		temp: bytes = _threefish_encrypt(block, state, _tweak_to_bytes(type, first, final, position), printdebug)
		state = bytes((a ^ b) for (a, b) in zip(block, temp))
	return state


# Internal block cipher
def _threefish_encrypt(plaintext: bytes, key: bytes, tweak: bytes, printdebug: bool) -> bytes:
	assert len(plaintext) == len(key)
	assert len(key) in (32, 64, 128)
	assert len(tweak) == 16
	if printdebug:  print(f"        Threefish: plaintext={cryptocommon.bytes_to_hexstr(plaintext)}, key={cryptocommon.bytes_to_hexstr(key)}, tweak={cryptocommon.bytes_to_hexstr(tweak)}")
	numwords: int = len(key) // 8
	
	keywords: List[uint64] = _bytes_to_words(key)
	temp: uint64 = 0x1BD11BDAA9FC1A22
	for word in keywords:
		temp ^= word
	keywords.append(temp)
	assert len(keywords) == numwords + 1
	
	tweakwords: List[uint64] = _bytes_to_words(tweak)
	tweakwords.append(tweakwords[0] ^ tweakwords[1])
	assert len(tweakwords) == 3
	
	block: List[uint64] = list(_bytes_to_words(plaintext))
	assert len(block) == numwords
	for i in range(_NUM_ROUNDS[numwords] + 1):
		if printdebug:  print(f"            Round {i:2}: block = {' '.join(f'{word:016X}' for word in block)}")
		
		if i % 4 == 0:  # Add subkey
			for j in range(len(block)):
				word = keywords[(i // 4 + j) % len(keywords)]
				if j == numwords - 3:
					word += tweakwords[(i // 4 + 0) % len(tweakwords)]
				elif j == numwords - 2:
					word += tweakwords[(i // 4 + 1) % len(tweakwords)]
				elif j == numwords - 1:
					word += i // 4
				block[j] = (block[j] + word) & cryptocommon.UINT64_MASK
			if i >= _NUM_ROUNDS[numwords]:
				break
		
		# Do mix and rotate
		mixedblock: List[uint64] = []
		for (j, (x0, x1)) in enumerate(cryptocommon.iter_blocks(block, 2)):
			y0: uint64 = (x0 + x1) & cryptocommon.UINT64_MASK
			y1: uint64 = (cryptocommon.rotate_left_uint64(x1, _ROTATIONS[numwords][i % 8][j])) ^ y0
			mixedblock.append(y0)
			mixedblock.append(y1)
		
		# Do permutation
		block = [mixedblock[_PERMUTATIONS[numwords][i]] for i in range(len(mixedblock))]
	
	return b"".join(word.to_bytes(8, "little") for word in block)


def _tweak_to_bytes(type: int, first: bool, final: bool, position: int) -> bytes:
	assert 0 <= type < (1 << 6)
	assert 0 <= position < (1 << 96)
	temp: int = int(final) << 127 | int(first) << 126 | type << 120 | position
	return temp.to_bytes(16, "little")


def _bytes_to_words(bs: bytes) -> List[uint64]:
	return [int.from_bytes(b, "little") for b in cryptocommon.iter_blocks(bs, 8)]


# ---- Numerical constants/tables ----

_NUM_ROUNDS: Dict[int,int] = {
	 4: 72,
	 8: 72,
	16: 80,
}


_PERMUTATIONS: Dict[int,List[int]] = {
	 4: [0, 3, 2, 1],
	 8: [2, 1, 4, 7, 6, 5, 0, 3],
	16: [0, 9, 2, 13, 6, 11, 4, 15, 10, 7, 12, 3, 14, 5, 8, 1],
}


_ROTATIONS: Dict[int,List[List[int]]] = {
	4: [
		[14, 16],
		[52, 57],
		[23, 40],
		[ 5, 37],
		[25, 33],
		[46, 12],
		[58, 22],
		[32, 32],
	],
	8: [
		[46, 36, 19, 37],
		[33, 27, 14, 42],
		[17, 49, 36, 39],
		[44,  9, 54, 56],
		[39, 30, 34, 24],
		[13, 50, 10, 17],
		[25, 29, 39, 43],
		[ 8, 35, 56, 22],
	],
	16: [
		[24, 13,  8, 47,  8, 17, 22, 37],
		[38, 19, 10, 55, 49, 18, 23, 52],
		[33,  4, 51, 13, 34, 41, 59, 17],
		[ 5, 20, 48, 41, 47, 28, 16, 25],
		[41,  9, 37, 31, 12, 47, 44, 30],
		[16, 34, 56, 51,  4, 53, 42, 41],
		[31, 44, 47, 46, 19, 42, 44, 25],
		[ 9, 48, 35, 52, 23, 31, 37, 20],
	],
}


_TYPE_CONFIGURATION: int = 4
_TYPE_MESSAGE: int = 48
_TYPE_OUTPUT: int = 63
