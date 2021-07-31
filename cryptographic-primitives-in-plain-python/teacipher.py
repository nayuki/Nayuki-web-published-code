# 
# The TEA (Tiny Encryption Algorithm) block cipher.
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
from cryptocommon import UINT32_MASK


# ---- Public functions ----

def encrypt(block: Union[bytes,Sequence[int]], key: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the encryption of the given block (8 bytes)
	with the given key (16 bytes), returning 8 bytes."""
	
	# Check input arguments
	assert len(block) == 8
	assert len(key) == 16
	if printdebug:  print(f"teacipher.encrypt(block = {cryptocommon.bytes_to_debugstr(block)}, key = {cryptocommon.bytes_to_debugstr(key)})")
	
	# Pack key and block bytes into lists of uint32 in big endian
	k: List[int] = _bytes_to_uint32_list_big_endian(key)    # 4 elements of uint32
	m: List[int] = _bytes_to_uint32_list_big_endian(block)  # 2 elements of uint32
	
	# Perform 64 rounds of encryption
	rcon: int = 0
	for i in range(_NUM_CYCLES):
		if printdebug:  print(f"    Round {i:2d}: block = [{m[0]:08X} {m[1]:08X}]")
		rcon = (rcon + _ROUND_CONSTANT) & UINT32_MASK
		m[0] += ((m[1] << 4) + k[0]) ^ (m[1] + rcon) ^ ((m[1] >> 5) + k[1])
		m[0] &= UINT32_MASK
		m[1] += ((m[0] << 4) + k[2]) ^ (m[0] + rcon) ^ ((m[0] >> 5) + k[3])
		m[1] &= UINT32_MASK
	
	# Serialize the final block as bytes in big endian
	if printdebug:  print()
	return b"".join(x.to_bytes(4, "big") for x in m)


def decrypt(block: Union[bytes,Sequence[int]], key: Union[bytes,Sequence[int]], printdebug: bool = False) -> bytes:
	"""Computes the decryption of the given block (8 bytes)
	with the given key (16 bytes), returning 8 bytes."""
	
	# Check input arguments
	assert len(block) == 8
	assert len(key) == 16
	if printdebug:  print(f"teacipher.decrypt(block = {cryptocommon.bytes_to_debugstr(block)}, key = {cryptocommon.bytes_to_debugstr(key)})")
	
	# Pack key and block bytes into lists of uint32 in big endian
	k: List[int] = _bytes_to_uint32_list_big_endian(key)    # 4 elements of uint32
	m: List[int] = _bytes_to_uint32_list_big_endian(block)  # 2 elements of uint32
	
	# Perform 64 rounds of decryption
	rcon: int = (_ROUND_CONSTANT * _NUM_CYCLES) & UINT32_MASK
	for i in range(_NUM_CYCLES):
		if printdebug:  print(f"    Round {i:2d}: block = [{m[0]:08X} {m[1]:08X}]")
		m[1] -= ((m[0] << 4) + k[2]) ^ (m[0] + rcon) ^ ((m[0] >> 5) + k[3])
		m[1] &= UINT32_MASK
		m[0] -= ((m[1] << 4) + k[0]) ^ (m[1] + rcon) ^ ((m[1] >> 5) + k[1])
		m[0] &= UINT32_MASK
		rcon = (rcon - _ROUND_CONSTANT) & UINT32_MASK
	
	# Serialize the final block as bytes in big endian
	if printdebug:  print()
	return b"".join(x.to_bytes(4, "big") for x in m)


# ---- Private functions ----

# For example: _bytes_to_uint32_list_big_endian([0xFF, 0x00, 0xAB, 0xCD, 0x27, 0x18, 0x28, 0x44]) -> [0xFF00ABCD, 0x27182844].
def _bytes_to_uint32_list_big_endian(bytelist: Union[bytes,Sequence[int]]) -> List[int]:
	assert len(bytelist) % 4 == 0
	return [int.from_bytes(bytelist[i : i + 4], "big")
		for i in range(0, len(bytelist), 4)]


# ---- Numerical constants/tables ----

_NUM_ROUNDS: int = 64  # Must be even
_NUM_CYCLES: int = _NUM_ROUNDS // 2

_ROUND_CONSTANT: int = 0x9E3779B9  # uint32, equal to floor((sqrt(5) - 1) / 2 * 2^32)
