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

from typing import Callable, List, Sequence, Tuple, Union
import cryptocommon
from cryptocommon import UINT32_MASK


# ---- Public functions ----

def hash(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 20 bytes."""
	
	# Make a mutable copy for use within this function
	msg = bytearray(message)
	if printdebug:  print(f"sha1.hash(message = {len(message)} bytes)")
	
	# Append the termination bit (rounded up to a whole byte)
	msg.append(0x80)
	
	# Append padding bytes until message is exactly 8 bytes less than a whole block
	while (len(msg) + 8) % _BLOCK_SIZE != 0:
		msg.append(0x00)
	
	# Append the length of the original message in bits
	bitlength: int = len(message) * 8
	msg.extend(bitlength.to_bytes(8, "big"))
	
	# Initialize the hash state
	state: Tuple[int,int,int,int,int] = (
		0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0)
	
	# Compress each block in the augmented message
	assert len(msg) % _BLOCK_SIZE == 0
	for i in range(len(msg) // _BLOCK_SIZE):
		block: bytes = msg[i * _BLOCK_SIZE : (i + 1) * _BLOCK_SIZE]
		if printdebug:  print(f"    Block {i} = {cryptocommon.bytelist_to_debugstr(block)}")
		state = _compress(block, state, printdebug)
	
	# Serialize the final state
	if printdebug:  print()
	return b"".join(x.to_bytes(4, "big") for x in state)


# ---- Private functions ----

# Requirement: All elements of block and state must be uint32.
def _compress(block: bytes, state: Tuple[int,int,int,int,int], printdebug: bool) -> Tuple[int,int,int,int,int]:
	# Check argument lengths
	assert len(block) == _BLOCK_SIZE
	
	# Alias shorter names for readability
	rotl32: Callable[[int,int],int] = cryptocommon.rotate_left_uint32
	
	# Pack block bytes into first part of schedule
	schedule: List[int] = [int.from_bytes(block[i : i + 4], "big")
		for i in range(0, len(block), 4)]
	
	# Extend the message schedule by blending previous values
	for _ in range(len(schedule), len(_ROUND_CONSTANTS) * 20):
		temp: int = schedule[-3] ^ schedule[-8] ^ schedule[-14] ^ schedule[-16]
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
		temp = (rotl32(a, 5) + f + e + schedule[i] + _ROUND_CONSTANTS[j]) & UINT32_MASK
		e = d
		d = c
		c = rotl32(b, 30)
		b = a
		a = temp
	
	# Return new state as a tuple
	return (
		(state[0] + a) & UINT32_MASK,
		(state[1] + b) & UINT32_MASK,
		(state[2] + c) & UINT32_MASK,
		(state[3] + d) & UINT32_MASK,
		(state[4] + e) & UINT32_MASK)


# ---- Numerical constants/tables ----

_BLOCK_SIZE: int = 64  # In bytes

_ROUND_CONSTANTS: List[int] = [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6]
