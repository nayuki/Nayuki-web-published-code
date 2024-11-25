# 
# The RIPEMD-256 hash function.
# 
# Copyright (c) 2024 Project Nayuki. (MIT License)
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

from collections.abc import Callable, Sequence
import cryptocommon
from cryptocommon import UINT32_MASK


# ---- Public functions ----

def hash(message: bytes|Sequence[int], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 32 bytes."""
	
	# Make a mutable copy for use within this function
	msg: bytearray = bytearray(message)
	if printdebug:  print(f"ripemd256.hash(message = {len(message)} bytes)")
	
	# Append the termination bit (rounded up to a whole byte)
	msg.append(0x80)
	
	# Append padding bytes until message is exactly 8 bytes less than a whole block
	while (len(msg) + 8) % _BLOCK_SIZE != 0:
		msg.append(0x00)
	
	# Append the length of the original message in bits
	bitlength: int = len(message) * 8
	msg.extend(bitlength.to_bytes(8, "little"))
	
	# Initialize the hash state
	state: tuple[int,int,int,int,int,int,int,int] = (
		0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476,
		0x76543210, 0xFEDCBA98, 0x89ABCDEF, 0x01234567)
	
	# Compress each block in the augmented message
	for (i, block) in enumerate(cryptocommon.iter_blocks(msg, _BLOCK_SIZE)):
		if printdebug:  print(f"    Block {i} = {cryptocommon.bytes_to_debugstr(block)}")
		state = _compress(block, state, printdebug)
	
	# Serialize the final state
	if printdebug:  print()
	return b"".join(x.to_bytes(4, "little") for x in state)


# ---- Private functions ----

# Requirement: All elements of state must be uint32.
def _compress(block: bytes, state: tuple[int,int,int,int,int,int,int,int], printdebug: bool) -> tuple[int,int,int,int,int,int,int,int]:
	# Check argument lengths
	assert len(block) == _BLOCK_SIZE
	
	# Pack block bytes into schedule
	schedule: list[int] = [int.from_bytes(chunk, "little")
		for chunk in cryptocommon.iter_blocks(block, 4)]
	
	# Unpack state into variables; each one is a uint32
	al, bl, cl, dl, ar, br, cr, dr = state
	
	# Non-linear function
	def f(i: int, x: int, y: int, z: int) -> int:
		if   i <  0:  raise AssertionError()
		elif i < 16:  return x ^ y ^ z
		elif i < 32:  return (x & y) | (~x & z)
		elif i < 48:  return (x | (y ^ UINT32_MASK)) ^ z
		elif i < 64:  return (x & z) | (y & ~z)
		else       :  raise AssertionError()
	
	# Alias shorter names for readability
	rotl32: Callable[[int,int],int] = cryptocommon.rotate_left_uint32
	
	# Perform 64 rounds of hashing
	for i in range(64):
		if printdebug:  print(f"        Round {i:2d}: al={al:08X}, bl={bl:08X}, cl={cl:08X}, dl={dl:08X}, ar={ar:08X}, br={br:08X}, cr={cr:08X}, dr={dr:08X}")
		t: int = rotl32((al + f(i, bl, cl, dl) + schedule[_RL[i]] + _KL[i // 16]) & UINT32_MASK, _SL[i])
		al, bl, cl, dl = dl, t, bl, cl
		t = rotl32((ar + f(63 - i, br, cr, dr) + schedule[_RR[i]] + _KR[i // 16]) & UINT32_MASK, _SR[i])
		ar, br, cr, dr = dr, t, br, cr
		if i == 15:
			al, ar = ar, al
		elif i == 31:
			bl, br = br, bl
		elif i == 47:
			cl, cr = cr, cl
		elif i == 63:
			dl, dr = dr, dl
	
	# Return the new state
	return (
		(state[0] + al) & UINT32_MASK,
		(state[1] + bl) & UINT32_MASK,
		(state[2] + cl) & UINT32_MASK,
		(state[3] + dl) & UINT32_MASK,
		(state[4] + ar) & UINT32_MASK,
		(state[5] + br) & UINT32_MASK,
		(state[6] + cr) & UINT32_MASK,
		(state[7] + dr) & UINT32_MASK)


# ---- Numerical constants/tables ----

_BLOCK_SIZE: int = 64  # In bytes

_KL: list[int] = [0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC]
_KR: list[int] = [0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x00000000]

_RL: list[int] = [
	 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
	 7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
	 3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
	 1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
]

_RR: list[int] = [
	 5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
	 6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
	15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
	 8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
]

_SL: list[int] = [
	11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
	 7,  6,  8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
	11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
	11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
]

_SR: list[int] = [
	 8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
	 9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
	 9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
	15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
]
