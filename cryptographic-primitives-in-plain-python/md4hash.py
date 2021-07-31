# 
# The MD4 hash function. It is described in RFC 1320.
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


# ---- Public functions ----

def hash(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 16 bytes."""
	
	# Make a mutable copy for use within this function
	msg = bytearray(message)
	if printdebug:  print(f"md4.hash(message = {len(message)} bytes)")
	
	# Append the termination bit (rounded up to a whole byte)
	msg.append(0x80)
	
	# Append padding bytes until message is exactly 8 bytes less than a whole block
	while (len(msg) + 8) % _BLOCK_SIZE != 0:
		msg.append(0x00)
	
	# Append the length of the original message in bits
	bitlength: int = len(message) * 8
	msg.extend(bitlength.to_bytes(8, "little"))
	
	# Initialize the hash state
	state: Tuple[int,int,int,int] = (
		0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476)
	
	# Compress each block in the augmented message
	for (i, block) in enumerate(cryptocommon.iter_blocks(msg, _BLOCK_SIZE)):
		if printdebug:  print(f"    Block {i} = {cryptocommon.bytes_to_debugstr(block)}")
		state = _compress(block, state, printdebug)
	
	# Serialize the final state
	if printdebug:  print()
	return b"".join(x.to_bytes(4, "little") for x in state)


# ---- Private functions ----

# Requirement: All elements of block and state must be uint32.
def _compress(block: bytes, state: Tuple[int,int,int,int], printdebug: bool) -> Tuple[int,int,int,int]:
	# Check argument lengths
	assert len(block) == _BLOCK_SIZE
	
	# Pack block bytes into schedule
	schedule: List[int] = [int.from_bytes(chunk, "little")
		for chunk in cryptocommon.iter_blocks(block, 4)]
	
	# Unpack state into variables; each one is a uint32
	a, b, c, d = state
	
	# Perform 48 rounds of hashing
	for i in range(48):
		# Compute f value, schedule index, and addition constant based on the round index i
		if printdebug:  print(f"        Round {i:2d}: a={a:08X}, b={b:08X}, c={c:08X}, d={d:08X}")
		f: int
		k: int
		add: int
		if i < 16:
			f = (b & c) | (~b & d)
			k = i
			add = 0x00000000
		elif i < 32:
			f = (b & c) | (b & d) | (c & d)
			k = ((i & 0x3) << 2) | ((i & 0xC) >> 2)
			add = 0x5A827999
		else:
			f = b ^ c ^ d
			k = ((i >> 3) & 0x1) | ((i >> 1) & 0x2) | ((i << 1) & 0x4) | ((i << 3) & 0x8)  # Last 4 bits reversed
			add = 0x6ED9EBA1
		
		# Perform the round calculation
		rot: int = _ROTATION_AMOUNTS[((i >> 2) & 0xC) | (i & 0x3)]
		temp: int = (a + f + schedule[k] + add) & UINT32_MASK
		temp = cryptocommon.rotate_left_uint32(temp, rot)
		a = d
		d = c
		c = b
		b = temp
	
	# Return the new state
	return (
		(state[0] + a) & UINT32_MASK,
		(state[1] + b) & UINT32_MASK,
		(state[2] + c) & UINT32_MASK,
		(state[3] + d) & UINT32_MASK)


# ---- Numerical constants/tables ----

_BLOCK_SIZE: int = 64  # In bytes

_ROTATION_AMOUNTS: List[int] = [
	3,  7, 11, 19,
	3,  5,  9, 13,
	3,  9, 11, 15,
]
