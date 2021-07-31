# 
# The SHA-256 hash function. It is described in FIPS Publication 180.
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
	"""Computes the hash of the given message, returning 32 bytes."""
	
	# Make a mutable copy for use within this function
	msg = bytearray(message)
	if printdebug:  print(f"sha256.hash(message = {len(message)} bytes)")
	
	# Append the termination bit (rounded up to a whole byte)
	msg.append(0x80)
	
	# Append padding bytes until message is exactly 8 bytes less than a whole block
	while (len(msg) + 8) % _BLOCK_SIZE != 0:
		msg.append(0x00)
	
	# Append the length of the original message in bits
	bitlength: int = len(message) * 8
	msg.extend(bitlength.to_bytes(8, "big"))
	
	# Initialize the hash state
	state: Tuple[int,int,int,int,int,int,int,int] = (
		0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
		0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19)
	
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
def _compress(block: bytes, state: Tuple[int,int,int,int,int,int,int,int], printdebug: bool) -> Tuple[int,int,int,int,int,int,int,int]:
	# Check argument lengths
	assert len(block) == _BLOCK_SIZE
	
	# Alias shorter names for readability
	rotr32: Callable[[int,int],int] = cryptocommon.rotate_right_uint32
	
	# Pack block bytes into first part of schedule
	schedule: List[int] = [int.from_bytes(block[i : i + 4], "big")
		for i in range(0, len(block), 4)]
	
	# Extend the message schedule by blending previous values
	for _ in range(len(schedule), len(_ROUND_CONSTANTS)):
		x: int = schedule[-15]
		y: int = schedule[- 2]
		smallsigma0: int = rotr32(x,  7) ^ rotr32(x, 18) ^ (x >>  3)
		smallsigma1: int = rotr32(y, 17) ^ rotr32(y, 19) ^ (y >> 10)
		temp: int = (schedule[-16] + schedule[-7] + smallsigma0 + smallsigma1) & UINT32_MASK
		schedule.append(temp)
	
	# Unpack state into variables; each one is a uint32
	a, b, c, d, e, f, g, h = state
	
	# Perform 64 rounds of hashing
	for i in range(len(schedule)):
		# Perform the round calculation
		if printdebug:  print(f"        Round {i:2d}: a={a:08X}, b={b:08X}, c={c:08X}, d={d:08X}, e={e:08X}, f={f:08X}, g={g:08X}, h={h:08X}")
		bigsigma0: int = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22)
		bigsigma1: int = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25)
		choose: int = (e & f) ^ (~e & g)
		majority: int = (a & b) ^ (a & c) ^ (b & c)
		t1: int = (h + bigsigma1 + choose + schedule[i] + _ROUND_CONSTANTS[i]) & UINT32_MASK
		t2: int = (bigsigma0 + majority) & UINT32_MASK
		h = g
		g = f
		f = e
		e = (d + t1) & UINT32_MASK
		d = c
		c = b
		b = a
		a = (t1 + t2) & UINT32_MASK
	
	# Return new state as a tuple
	return (
		(state[0] + a) & UINT32_MASK,
		(state[1] + b) & UINT32_MASK,
		(state[2] + c) & UINT32_MASK,
		(state[3] + d) & UINT32_MASK,
		(state[4] + e) & UINT32_MASK,
		(state[5] + f) & UINT32_MASK,
		(state[6] + g) & UINT32_MASK,
		(state[7] + h) & UINT32_MASK)


# ---- Numerical constants/tables ----

_BLOCK_SIZE: int = 64  # In bytes

_ROUND_CONSTANTS: List[int] = [  # 64 elements of uint32
	0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
	0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
	0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
	0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
	0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
	0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
	0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
	0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
	0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
	0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
	0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
	0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
	0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
	0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
	0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
	0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
]
