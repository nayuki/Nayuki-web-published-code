# 
# The Whirlpool hash function.
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
from typing import List, Tuple


# ---- Public functions ----

def hash(message: List[int], printdebug: bool = False) -> List[int]:
	"""Computes the hash of the given bytelist message, returning a new 64-element bytelist."""
	
	# Make a shallow copy of the list to prevent modifying the caller's list object
	assert isinstance(message, list)
	msg = list(message)
	if printdebug:  print(f"whirlpool.hash(message = {len(message)} bytes)")
	
	# Append the termination bit (rounded up to a whole byte)
	msg.append(0x80)
	
	# Append padding bytes until message is exactly 32 bytes less than a whole block
	while (len(msg) + 32) % _BLOCK_SIZE != 0:
		msg.append(0x00)
	
	# Append the length of the original message in bits, as 32 bytes in big endian
	bitlength = len(message) * 8
	for i in reversed(range(32)):
		msg.append((bitlength >> (i * 8)) & 0xFF)
	
	# Initialize the hash state
	state = tuple([0] * _BLOCK_SIZE)
	
	# Compress each block in the augmented message
	assert len(msg) % _BLOCK_SIZE == 0
	for i in range(len(msg) // _BLOCK_SIZE):
		block = tuple(msg[i * _BLOCK_SIZE : (i + 1) * _BLOCK_SIZE])
		if printdebug:  print(f"    Block {i} = {cryptocommon.bytelist_to_debugstr(block)}")
		state = _compress(block, state, printdebug)
	
	# Return the final state as a bytelist
	if printdebug:  print()
	return list(state)


# ---- Private functions ----

# Requirement: All elements of block and state must be uint8 (byte).
def _compress(block: Tuple[int,...], state: Tuple[int,...], printdebug: bool) -> Tuple[int,...]:
	# Check argument types and lengths
	assert isinstance(block, tuple) and len(block) == _BLOCK_SIZE
	assert isinstance(state, tuple) and len(state) == _BLOCK_SIZE
	
	# Perform 10 rounds of hashing
	tempkey = state
	tempmsg = _add_round_key(block, state)
	i = 0
	for rcon in _ROUND_CONSTANTS:
		if printdebug:  print(f"        Round {i:2d}: block = {cryptocommon.bytelist_to_debugstr(list(tempmsg))}")
		tempkey = _compute_round(tempkey, rcon)  # Compute key schedule on the fly
		tempmsg = _compute_round(tempmsg, tempkey)
		i += 1
	if printdebug:  print(f"        Round {i:2d}: block = {cryptocommon.bytelist_to_debugstr(list(tempmsg))}")
	
	# Combine data using the Miyaguchi-Preneel construction
	newstate = []
	for (x, y, z) in zip(state, block, tempmsg):
		newstate.append(x ^ y ^ z)
	return tuple(newstate)


# 'msg' and 'key' are 64-byte tuples. Returns a 64-byte tuple.
def _compute_round(msg: Tuple[int,...], key: Tuple[int,...]) -> Tuple[int,...]:
	msg = _sub_bytes(msg)
	msg = _shift_columns(msg)
	msg = _mix_rows(msg)
	msg = _add_round_key(msg, key)
	return msg


# 'msg' is a 64-byte tuple. Returns a 64-byte tuple.
def _sub_bytes(msg: Tuple[int,...]) -> Tuple[int,...]:
	newmsg = []
	for b in msg:
		newmsg.append(_SBOX[b])
	return tuple(newmsg)


# 'msg' is a 64-byte tuple. Returns a 64-byte tuple.
def _shift_columns(msg: Tuple[int,...]) -> Tuple[int,...]:
	newmsg = [0] * 64  # Dummy initial values, all will be overwritten
	for col in range(8):
		for row in range(8):
			newmsg[(row + col) % 8 * 8 + col] = msg[row * 8 + col]
	return tuple(newmsg)


# 'msg' is a 64-byte tuple. Returns a 64-byte tuple.
def _mix_rows(msg: Tuple[int,...]) -> Tuple[int,...]:
	newmsg = [0] * 64  # Dummy initial values, all will be overwritten
	for row in range(8):
		for col in range(8):
			val = 0
			for i in range(8):
				val ^= _multiply(msg[row * 8 + (col + i) % 8], _MULTIPLIERS[i])
			newmsg[row * 8 + col] = val
	return tuple(newmsg)


# 'msg' and 'key' are 64-byte tuples. Returns a 64-byte tuple.
def _add_round_key(msg: Tuple[int,...], key: Tuple[int,...]) -> Tuple[int,...]:
	result = []
	for (x, y) in zip(msg, key):
		result.append(x ^ y)
	return tuple(result)


# Performs finite field multiplication on the given two bytes, returning a byte.
def _multiply(x: int, y: int) -> int:
	assert 0 <= x <= 0xFF
	assert 0 <= y <= 0xFF
	z = 0
	for i in reversed(range(8)):
		z <<= 1
		if z >= 0x100:
			z ^= 0x11D
		if ((y >> i) & 1) != 0:
			z ^= x
	assert 0 <= z <= 0xFF
	return z


# ---- Numerical constants/tables ----

_BLOCK_SIZE: int = 64  # In bytes

_NUM_ROUNDS: int = 10

_MULTIPLIERS: List[int] = [0x01, 0x09, 0x02, 0x05, 0x08, 0x01, 0x04, 0x01]

_SBOX: List[int] = []  # A permutation of the 256 byte values, from 0x00 to 0xFF
def _init_sbox():
	E = [0x1, 0xB, 0x9, 0xC, 0xD, 0x6, 0xF, 0x3, 0xE, 0x8, 0x7, 0x4, 0xA, 0x2, 0x5, 0x0]  # The E mini-box
	R = [0x7, 0xC, 0xB, 0xD, 0xE, 0x4, 0x9, 0xF, 0x6, 0x3, 0x8, 0xA, 0x2, 0x5, 0x1, 0x0]  # The R mini-box
	EINV = [0] * 16  # The inverse of E
	for (i, x) in enumerate(E):
		EINV[x] = i
	for i in range(256):
		left = E[i >> 4]
		right = EINV[i & 0xF]
		temp = R[left ^ right]
		_SBOX.append(E[left ^ temp] << 4 | EINV[right ^ temp])
_init_sbox()

_ROUND_CONSTANTS: List[Tuple[int,...]] = []  # Each element of this list is a tuple of 64 bytes
def _init_round_constants():
	for i in range(_NUM_ROUNDS):
		# Each round constant takes the next 8 bytes from the S-box, and appends 56 zeros to fill the 64-byte block
		rcon = _SBOX[i * 8 : (i + 1) * 8] + [0] * 56
		_ROUND_CONSTANTS.append(tuple(rcon))
_init_round_constants()
