# 
# The SHA-1 hash function. It is described in FIPS Publication 180.
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

import cryptocommon
from typing import Callable, List, Sequence, Tuple, Union


# ---- Public functions ----

def hash(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given bytelist message, returning 20 bytes."""
	
	# Make a shallow copy of the list to prevent modifying the caller's list object
	msg = bytearray(message)
	if printdebug:  print(f"sha1.hash(message = {len(message)} bytes)")
	
	# Append the termination bit (rounded up to a whole byte)
	msg.append(0x80)
	
	# Append padding bytes until message is exactly 8 bytes less than a whole block
	while (len(msg) + 8) % _BLOCK_SIZE != 0:
		msg.append(0x00)
	
	# Append the length of the original message in bits, as 8 bytes in big endian
	bitlength: int = len(message) * 8
	msg.extend(bitlength.to_bytes(8, "big"))
	
	# Initialize the hash state
	state: Tuple[int,int,int,int,int] = (0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0)
	
	# Compress each block in the augmented message
	assert len(msg) % _BLOCK_SIZE == 0
	for i in range(len(msg) // _BLOCK_SIZE):
		block: bytes = msg[i * _BLOCK_SIZE : (i + 1) * _BLOCK_SIZE]
		if printdebug:  print(f"    Block {i} = {cryptocommon.bytelist_to_debugstr(block)}")
		state = _compress(block, state, printdebug)
	
	# Serialize the final state as bytes in big endian
	result = bytearray()
	for x in state:
		result.extend(x.to_bytes(4, "big"))
	if printdebug:  print()
	return result


# ---- Private functions ----

# Requirement: All elements of block and state must be uint32.
def _compress(block: bytes, state: Tuple[int,int,int,int,int], printdebug: bool) -> Tuple[int,int,int,int,int]:
	# Check argument lengths
	assert len(block) == _BLOCK_SIZE
	assert len(state) == 5
	
	# Alias shorter names for readability
	mask32: int = cryptocommon.UINT32_MASK
	rotl32: Callable[[int,int],int] = cryptocommon.rotate_left_uint32
	
	# Pack block bytes into first part of schedule as uint32 in big endian
	schedule: List[int] = []
	for i in range(0, len(block), 4):
		schedule.append(int.from_bytes(block[i : i + 4], "big"))
	
	# Extend the message schedule by blending previous values
	for i in range(len(schedule), 80):
		temp: int = schedule[i - 3] ^ schedule[i - 8] ^ schedule[i - 14] ^ schedule[i - 16]
		schedule.append(rotl32(temp, 1))
	
	# Unpack state into variables; each one is a uint32
	a, b, c, d, e = state
	
	# Perform 80 rounds of hashing
	for i in range(len(schedule)):
		# Compute f value based on the round index i
		if printdebug:  print(f"        Round {i:2d}: a={a:08X}, b={b:08X}, c={c:08X}, d={d:08X}, e={e:08X}")
		j: int = i // 20
		if   j == 0:  f = (b & c) | (~b & d)
		elif j == 1:  f = b ^ c ^ d
		elif j == 2:  f = (b & c) ^ (b & d) ^ (c & d)
		elif j == 3:  f = b ^ c ^ d
		else:  raise AssertionError()
		
		# Perform the round calculation
		temp = (rotl32(a, 5) + f + e + schedule[i] + _ROUND_CONSTANTS[j]) & mask32
		e = d
		d = c
		c = rotl32(b, 30)
		b = a
		a = temp
	
	# Return new state as a tuple
	return (
		(state[0] + a) & mask32,
		(state[1] + b) & mask32,
		(state[2] + c) & mask32,
		(state[3] + d) & mask32,
		(state[4] + e) & mask32)


# ---- Numerical constants/tables ----

_BLOCK_SIZE: int = 64  # In bytes

_ROUND_CONSTANTS: List[int] = [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6]
