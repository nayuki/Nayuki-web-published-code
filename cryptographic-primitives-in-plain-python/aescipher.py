# 
# The AES (Advanced Encryption Standard) block cipher. It is described in FIPS Publication 197.
# All three key lengths (128, 192, 256 bits) are supported.
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

def encrypt(block: Union[bytes,Sequence[int]], key: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the encryption of the given block (16 bytes)
	with the given key (16/24/32 bytes), returning 16 bytes."""
	
	# Check input arguments
	assert len(block) == 16
	assert len(key) in (16, 24, 32)
	if printdebug:  print(f"aescipher.encrypt(block = {cryptocommon.bytelist_to_debugstr(block)}, key = {cryptocommon.bytelist_to_debugstr(key)})")
	
	# Compute key schedule from key
	keyschedule: Tuple[bytes,...] = _expand_key_schedule(key)
	
	# Perform special first round
	i: int = 0
	newblock = bytes(block)
	if printdebug:  print(f"    Round {i:2d}: block = {cryptocommon.bytelist_to_debugstr(newblock)}")
	newblock = _add_round_key(newblock, keyschedule[0])
	i += 1
	
	# Perform 9/11/13 regular rounds of encryption
	for subkey in keyschedule[1 : -1]:
		if printdebug:  print(f"    Round {i:2d}: block = {cryptocommon.bytelist_to_debugstr(newblock)}")
		newblock = _sub_bytes(newblock, _SBOX_FORWARD)
		newblock = _shift_rows(newblock, 1)
		newblock = _mix_columns(newblock, _MULTIPLIERS_FORWARD)
		newblock = _add_round_key(newblock, subkey)
		i += 1
	
	# Perform special last round
	if printdebug:  print(f"    Round {i:2d}: block = {cryptocommon.bytelist_to_debugstr(newblock)}")
	newblock = _sub_bytes(newblock, _SBOX_FORWARD)
	newblock = _shift_rows(newblock, 1)
	newblock = _add_round_key(newblock, keyschedule[-1])
	
	# Return the final block
	if printdebug:  print()
	return newblock


def decrypt(block: Union[bytes,Sequence[int]], key: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the decryption of the given block (16 bytes)
	with the given key (16/24/32 bytes), returning 16 bytes."""
	
	# Check input arguments
	assert len(block) == 16
	assert len(key) in (16, 24, 32)
	if printdebug:  print(f"aescipher.decrypt(block = {cryptocommon.bytelist_to_debugstr(block)}, key = {cryptocommon.bytelist_to_debugstr(key)})")
	
	# Compute key schedule from key
	keyschedule: Tuple[bytes,...] = tuple(reversed(_expand_key_schedule(key)))
	
	# Perform special first round
	i: int = 0
	newblock = bytes(block)
	if printdebug:  print(f"    Round {i:2d}: block = {cryptocommon.bytelist_to_debugstr(newblock)}")
	newblock = _add_round_key(newblock, keyschedule[0])
	newblock = _shift_rows(newblock, -1)
	newblock = _sub_bytes(newblock, _SBOX_INVERSE)
	i += 1
	
	# Perform 9/11/13 regular rounds of decryption
	for subkey in keyschedule[1 : -1]:
		if printdebug:  print(f"    Round {i:2d}: block = {cryptocommon.bytelist_to_debugstr(newblock)}")
		newblock = _add_round_key(newblock, subkey)
		newblock = _mix_columns(newblock, _MULTIPLIERS_INVERSE)
		newblock = _shift_rows(newblock, -1)
		newblock = _sub_bytes(newblock, _SBOX_INVERSE)
		i += 1
	
	# Perform special last round
	if printdebug:  print(f"    Round {i:2d}: block = {cryptocommon.bytelist_to_debugstr(newblock)}")
	newblock = _add_round_key(newblock, keyschedule[-1])
	
	# Return the final block as a bytelist
	if printdebug:  print()
	return newblock


# ---- Private functions ----

# Given 16/24/32 bytes, this computes and returns a tuple containing 11/13/15 tuples of 16 bytes each.
def _expand_key_schedule(key: Union[bytes,Sequence[int]]) -> Tuple[bytes,...]:
	# Initialize key schedule with the verbatim key
	nk: int = len(key) // 4  # Number of 32-bit words in original key
	assert nk in (4, 6, 8)
	schedule = bytearray(key)
	
	# Extend the key schedule by blending previous values
	numrounds: int = nk + 6
	rcon: int = 1
	for i in range(len(schedule), (numrounds + 1) * 16):
		j: int = i // 4
		if j % nk == 0:
			val: int = schedule[(j - 1) * 4 + (i + 1) % 4]
			val = _SBOX_FORWARD[val]
			if i % 4 == 0:
				val ^= rcon
				rcon = _multiply(rcon, 0x02)
		else:
			val = schedule[i - 4]
			if nk > 6 and j % nk == 4:
				val = _SBOX_FORWARD[val]
		val ^= schedule[i - nk * 4]
		schedule.append(val)
	
	# Split up the schedule into chunks of 16-byte subkeys
	return tuple(schedule[i : i + 16]
		for i in range(0, len(schedule), 16))


def _sub_bytes(msg: bytes, sbox: bytes) -> bytes:
	assert len(msg) == 16
	assert len(sbox) == 256
	newmsg = bytes(sbox[b] for b in msg)
	assert len(newmsg) == 16
	return newmsg


def _shift_rows(msg: bytes, direction: int) -> bytes:
	assert len(msg) == 16
	assert direction in (-1, 1)
	newmsg = bytearray([0] * 16)  # Dummy initial values, all will be overwritten
	for row in range(4):
		for col in range(4):
			newmsg[col * 4 + row] = msg[(col + row * direction) % 4 * 4 + row]
	assert len(newmsg) == 16
	return newmsg


def _mix_columns(msg: bytes, multipliers: List[int]) -> bytes:
	assert len(msg) == 16
	assert len(multipliers) == 4
	newmsg = bytearray([0] * 16)  # Dummy initial values, all will be overwritten
	for col in range(4):
		for row in range(4):
			val: int = 0
			for i in range(4):
				val ^= _multiply(msg[col * 4 + (row + i) % 4], multipliers[i])
			newmsg[col * 4 + row] = val
	assert len(newmsg) == 16
	return newmsg


def _add_round_key(msg: bytes, key: bytes) -> bytes:
	assert len(msg) == len(key) == 16
	newmsg = bytes((x ^ y) for (x, y) in zip(msg, key))
	assert len(newmsg) == 16
	return newmsg


# Performs finite field multiplication on the given two bytes, returning a byte.
def _multiply(x: int, y: int) -> int:
	assert cryptocommon.is_uint8(x)
	assert cryptocommon.is_uint8(y)
	z: int = 0
	for i in reversed(range(8)):
		z <<= 1
		if z >= 0x100:
			z ^= 0x11B
		if ((y >> i) & 1) != 0:
			z ^= x
	assert cryptocommon.is_uint8(z)
	return z


# Computes the multiplicative inverse of the given byte, returning a byte.
def _reciprocal(x: int) -> int:
	assert cryptocommon.is_uint8(x)
	if x == 0:
		return 0
	for y in range(256):
		if _multiply(x, y) == 1:
			return y
	raise AssertionError()


# Rotates the given 8-bit integer left by the given number of bits.
def _rotl8(value: int, amount: int) -> int:
	assert cryptocommon.is_uint8(value)
	assert 0 <= amount < 8
	return ((value << amount) | (value >> (8 - amount))) & 0xFF


# ---- Numerical constants/tables ----

# For _mix_columns()
_MULTIPLIERS_FORWARD: List[int] = [0x02, 0x03, 0x01, 0x01]
_MULTIPLIERS_INVERSE: List[int] = [0x0E, 0x0B, 0x0D, 0x09]

# For _sub_bytes()
_SBOX_FORWARD = bytearray()  # A permutation of the 256 byte values, from 0x00 to 0xFF
_SBOX_INVERSE = bytearray([0] * 256)  # Also a permutation
def _init_sbox() -> None:
	for i in range(256):
		j: int = _reciprocal(i)
		j = j ^ _rotl8(j, 1) ^ _rotl8(j, 2) ^ _rotl8(j, 3) ^ _rotl8(j, 4) ^ 0x63
		assert cryptocommon.is_uint8(j)
		_SBOX_FORWARD.append(j)
		_SBOX_INVERSE[j] = i
_init_sbox()
