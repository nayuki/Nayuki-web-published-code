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

from typing import List, Sequence, Union
import cryptocommon


# ---- Public functions ----

def hash(message: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the hash of the given message, returning 64 bytes."""
	
	# Make a mutable copy for use within this function
	msg = bytearray(message)
	if printdebug:  print(f"whirlpool.hash(message = {len(message)} bytes)")
	
	# Append the termination bit (rounded up to a whole byte)
	msg.append(0x80)
	
	# Append padding bytes until message is exactly 32 bytes less than a whole block
	while (len(msg) + 32) % _BLOCK_SIZE != 0:
		msg.append(0x00)
	
	# Append the length of the original message in bits
	bitlength: int = len(message) * 8
	msg.extend(bitlength.to_bytes(32, "big"))
	
	# Initialize the hash state
	state = b"\x00" * _BLOCK_SIZE
	
	# Compress each block in the augmented message
	for (i, block) in enumerate(cryptocommon.iter_blocks(msg, _BLOCK_SIZE)):
		if printdebug:  print(f"    Block {i} = {cryptocommon.bytes_to_debugstr(block)}")
		state = _compress(block, state, printdebug)
	
	# Return the final state
	if printdebug:  print()
	return state


# ---- Private functions ----

def _compress(block: bytes, state: bytes, printdebug: bool) -> bytes:
	# Check argument lengths
	assert len(block) == len(state) == _BLOCK_SIZE
	
	# Perform 10 rounds of hashing
	tempkey: bytes = state
	tempmsg: bytes = _add_round_key(block, state)
	i = 0
	for rcon in _ROUND_CONSTANTS:
		if printdebug:  print(f"        Round {i:2d}: block = {cryptocommon.bytes_to_debugstr(tempmsg)}")
		tempkey = _compute_round(tempkey, rcon)  # Compute key schedule on the fly
		tempmsg = _compute_round(tempmsg, tempkey)
		i += 1
	if printdebug:  print(f"        Round {i:2d}: block = {cryptocommon.bytes_to_debugstr(tempmsg)}")
	
	# Combine data using the Miyaguchi-Preneel construction
	return bytes((x ^ y ^ z) for (x, y, z) in zip(state, block, tempmsg))


def _compute_round(msg: bytes, key: bytes) -> bytes:
	assert len(msg) == len(key) == _BLOCK_SIZE
	msg = _sub_bytes(msg)
	msg = _shift_columns(msg)
	msg = _mix_rows(msg)
	msg = _add_round_key(msg, key)
	assert len(msg) == _BLOCK_SIZE
	return msg


def _sub_bytes(msg: bytes) -> bytes:
	assert len(msg) == _BLOCK_SIZE
	newmsg = bytes(_SBOX[b] for b in msg)
	assert len(newmsg) == _BLOCK_SIZE
	return newmsg


def _shift_columns(msg: bytes) -> bytes:
	assert len(msg) == _BLOCK_SIZE
	newmsg = bytearray([0] * 64)  # Dummy initial values, all will be overwritten
	for col in range(8):
		for row in range(8):
			newmsg[(row + col) % 8 * 8 + col] = msg[row * 8 + col]
	assert len(newmsg) == _BLOCK_SIZE
	return newmsg


def _mix_rows(msg: bytes) -> bytes:
	assert len(msg) == _BLOCK_SIZE
	newmsg = bytearray([0] * 64)  # Dummy initial values, all will be overwritten
	for row in range(8):
		for col in range(8):
			val: int = 0
			for i in range(8):
				val ^= _multiply(msg[row * 8 + (col + i) % 8], _MULTIPLIERS[i])
			newmsg[row * 8 + col] = val
	assert len(newmsg) == _BLOCK_SIZE
	return newmsg


def _add_round_key(msg: bytes, key: bytes) -> bytes:
	assert len(msg) == len(key) == _BLOCK_SIZE
	newmsg = bytes((x ^ y) for (x, y) in zip(msg, key))
	assert len(newmsg) == _BLOCK_SIZE
	return newmsg


# Performs finite field multiplication on the given two bytes, returning a byte.
def _multiply(x: int, y: int) -> int:
	assert cryptocommon.is_uint8(x)
	assert cryptocommon.is_uint8(y)
	z: int = 0
	for i in reversed(range(8)):
		z <<= 1
		if z >= 0x100:
			z ^= 0x11D
		if ((y >> i) & 1) != 0:
			z ^= x
	assert cryptocommon.is_uint8(z)
	return z


# ---- Numerical constants/tables ----

_BLOCK_SIZE: int = 64  # In bytes

_NUM_ROUNDS: int = 10

_MULTIPLIERS: List[int] = [0x01, 0x09, 0x02, 0x05, 0x08, 0x01, 0x04, 0x01]

_SBOX = bytearray()  # A permutation of the 256 byte values, from 0x00 to 0xFF
def _init_sbox() -> None:
	E: List[int] = [0x1, 0xB, 0x9, 0xC, 0xD, 0x6, 0xF, 0x3, 0xE, 0x8, 0x7, 0x4, 0xA, 0x2, 0x5, 0x0]  # The E mini-box
	R: List[int] = [0x7, 0xC, 0xB, 0xD, 0xE, 0x4, 0x9, 0xF, 0x6, 0x3, 0x8, 0xA, 0x2, 0x5, 0x1, 0x0]  # The R mini-box
	EINV: List[int] = [0] * 16  # The inverse of E
	for (i, x) in enumerate(E):
		EINV[x] = i
	for i in range(256):
		left: int = E[i >> 4]
		right: int = EINV[i & 0xF]
		temp: int = R[left ^ right]
		_SBOX.append(E[left ^ temp] << 4 | EINV[right ^ temp])
_init_sbox()

# Each element of this list is 64 bytes, which comprises
# the next 8 bytes from the S-box followed by 56 zeros.
_ROUND_CONSTANTS: List[bytes] = [
	_SBOX[i * 8 : (i + 1) * 8] + b"\x00" * 56
	for i in range(_NUM_ROUNDS)]
