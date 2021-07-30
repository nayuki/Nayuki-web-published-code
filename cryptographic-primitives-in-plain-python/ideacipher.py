# 
# The IDEA (International Data Encryption Algorithm) block cipher.
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
from typing import List, Sequence, Tuple, Union


# ---- Public functions ----

def encrypt(block: Union[bytes,Sequence[int]], key: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the encryption of the given block (8 bytes)
	with the given key (16 bytes), returning 8 bytes."""
	return _crypt(block, key, "encrypt", printdebug)


def decrypt(block: Union[bytes,Sequence[int]], key: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the decryption of the given block (8 bytes)
	with the given key (16 bytes), returning 8 bytes."""
	return _crypt(block, key, "decrypt", printdebug)


# ---- Private cipher functions ----

def _crypt(block: Union[bytes,Sequence[int]], key: Union[bytes,Sequence[int]], direction: str, printdebug: bool) -> bytes:
	# Check input arguments
	assert len(block) == 8
	assert len(key) == 16
	assert direction in ("encrypt", "decrypt")
	if printdebug:  print(f"ideacipher.{direction}(block = {cryptocommon.bytelist_to_debugstr(block)}, key = {cryptocommon.bytelist_to_debugstr(key)})")
	
	# Compute and handle the key schedule
	keyschedule: Tuple[int,...] = _expand_key_schedule(key)
	if direction == "decrypt":
		keyschedule = _invert_key_schedule(keyschedule)
	
	# Pack block bytes into variables as uint16 in big endian
	w: int = block[0] << 8 | block[1]
	x: int = block[2] << 8 | block[3]
	y: int = block[4] << 8 | block[5]
	z: int = block[6] << 8 | block[7]
	
	# Perform 8 rounds of encryption/decryption
	for i in range(_NUM_ROUNDS):
		if printdebug:  print(f"    Round {i}: block = [{w:04X} {x:04X} {y:04X} {z:04X}]")
		j: int = i * 6
		w = _multiply(w, keyschedule[j + 0])
		x = _add(x, keyschedule[j + 1])
		y = _add(y, keyschedule[j + 2])
		z = _multiply(z, keyschedule[j + 3])
		u: int = _multiply(w ^ y, keyschedule[j + 4])
		v: int = _multiply(_add(x ^ z, u), keyschedule[j + 5])
		u = _add(u, v)
		w ^= v
		x ^= u
		y ^= v
		z ^= u
		x, y = y, x
	
	# Perform final half-round
	if printdebug:  print(f"    Round {_NUM_ROUNDS}: block = [{w:04X} {x:04X} {y:04X} {z:04X}]")
	x, y = y, x
	w = _multiply(w, keyschedule[-4])
	x = _add(x, keyschedule[-3])
	y = _add(y, keyschedule[-2])
	z = _multiply(z, keyschedule[-1])
	
	# Serialize the final block as bytes in big endian
	return bytes([
		w >> 8, w & 0xFF,
		x >> 8, x & 0xFF,
		y >> 8, y & 0xFF,
		z >> 8, z & 0xFF])


# Given 16 bytes, this computes and returns a tuple containing 52 elements of uint16.
def _expand_key_schedule(key: Union[bytes,Sequence[int]]) -> Tuple[int,...]:
	# Pack all key bytes into a single uint128
	bigkey: int = 0
	for b in key:
		assert cryptocommon.is_uint8(b)
		bigkey = (bigkey << 8) | b
	assert 0 <= bigkey < (1 << 128)
	
	# Append the 16-bit prefix onto the suffix to yield a uint144
	bigkey = (bigkey << 16) | (bigkey >> 112)
	
	# Extract consecutive 16 bits at different offsets to form the key schedule
	result: List[int] = []
	for i in range(_NUM_ROUNDS * 6 + 4):
		offset = (i * 16 + i // 8 * 25) % 128
		result.append((bigkey >> (128 - offset)) & 0xFFFF)
	return tuple(result)


# Given an encryption key schedule, this computes and returns the
# decryption key schedule as a tuple containing 52 elements of uint16.
def _invert_key_schedule(keysch: Tuple[int,...]) -> Tuple[int,...]:
	assert len(keysch) % 6 == 4
	result: List[int] = []
	result.append(_reciprocal(keysch[-4]))
	result.append(_negate(keysch[-3]))
	result.append(_negate(keysch[-2]))
	result.append(_reciprocal(keysch[-1]))
	result.append(keysch[-6])
	result.append(keysch[-5])
	
	for i in range(1, _NUM_ROUNDS):
		j: int = i * 6
		result.append(_reciprocal(keysch[-j - 4]))
		result.append(_negate(keysch[-j - 2]))
		result.append(_negate(keysch[-j - 3]))
		result.append(_reciprocal(keysch[-j - 1]))
		result.append(keysch[-j - 6])
		result.append(keysch[-j - 5])
	
	result.append(_reciprocal(keysch[0]))
	result.append(_negate(keysch[1]))
	result.append(_negate(keysch[2]))
	result.append(_reciprocal(keysch[3]))
	return tuple(result)


# ---- Private arithmetic functions ----

# Returns x + y modulo 2^16. Inputs and output are uint16. Only used by _crypt().
def _add(x: int, y: int) -> int:
	assert cryptocommon.is_uint16(x)
	assert cryptocommon.is_uint16(y)
	return (x + y) & 0xFFFF


# Returns x * y modulo (2^16 + 1), where 0x0000 is treated as 0x10000.
# Inputs and output are uint16. Note that 2^16 + 1 is prime. Only used by _crypt().
def _multiply(x: int, y: int) -> int:
	assert cryptocommon.is_uint16(x)
	assert cryptocommon.is_uint16(y)
	if x == 0x0000:
		x = 0x10000
	if y == 0x0000:
		y = 0x10000
	z: int = (x * y) % 0x10001
	if z == 0x10000:
		z = 0x0000
	assert cryptocommon.is_uint16(z)
	return z


# Returns the additive inverse of x modulo 2^16.
# Input and output are uint16. Only used by _invert_key_schedule().
def _negate(x: int) -> int:
	assert cryptocommon.is_uint16(x)
	return (-x) & 0xFFFF


# Returns the multiplicative inverse of x modulo (2^16 + 1), where 0x0000 is
# treated as 0x10000. Input and output are uint16. Only used by _invert_key_schedule().
def _reciprocal(x: int) -> int:
	assert cryptocommon.is_uint16(x)
	if x == 0:
		return 0
	else:
		return pow(x, 0xFFFF, 0x10001)  # By Fermat's little theorem


# ---- Numerical constants/tables ----

_NUM_ROUNDS: int = 8
