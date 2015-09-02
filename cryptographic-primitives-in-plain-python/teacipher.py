# 
# The TEA (Tiny Encryption Algorithm) block cipher.
# 
# Copyright (c) 2015 Project Nayuki
# http://www.nayuki.io/page/cryptographic-primitives-in-plain-python
# 
# (MIT License)
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


# ---- Public functions ----

# Computes the encryption of the given block (8-element bytelist) with
# the given key (16-element bytelist), returning a new 8-element bytelist.
def encrypt(block, key, printdebug=False):
	# Check input arguments
	assert type(block) == list and len(block) == 8
	assert type(key) == list and len(key) == 16
	if printdebug: print("teacipher.encrypt(block = {}, key = {})".format(cryptocommon.bytelist_to_debugstr(block), cryptocommon.bytelist_to_debugstr(key)))
	
	# Pack key and block bytes into lists of uint32 in big endian
	k = _bytes_to_uint32_list_big_endian(key)    # 4 elements of uint32
	m = _bytes_to_uint32_list_big_endian(block)  # 2 elements of uint32
	
	# Perform 32 rounds of encryption
	rcon = 0
	for i in range(_NUM_ROUNDS):
		if printdebug: print("    Round {:2d}: block = [{:08X} {:08X}]".format(i, m[0], m[1]))
		rcon = (rcon + _ROUND_CONSTANT) & cryptocommon.UINT32_MASK
		m[0] += ((m[1] << 4) + k[0]) ^ (m[1] + rcon) ^ ((m[1] >> 5) + k[1])
		m[0] &= cryptocommon.UINT32_MASK
		m[1] += ((m[0] << 4) + k[2]) ^ (m[0] + rcon) ^ ((m[0] >> 5) + k[3])
		m[1] &= cryptocommon.UINT32_MASK
	
	# Unpack uint32 array into new block bytes in big endian
	result = []
	for x in m:
		result.append(int((x >> 24) & 0xFF))
		result.append(int((x >> 16) & 0xFF))
		result.append(int((x >>  8) & 0xFF))
		result.append(int((x >>  0) & 0xFF))
	if printdebug: print("")
	return result


# Computes the decryption of the given block (8-element bytelist) with
# the given key (16-element bytelist), returning a new 8-element bytelist.
def decrypt(block, key, printdebug=False):
	# Check input arguments
	assert type(block) == list and len(block) == 8
	assert type(key) == list and len(key) == 16
	if printdebug: print("teacipher.decrypt(block = {}, key = {})".format(cryptocommon.bytelist_to_debugstr(block), cryptocommon.bytelist_to_debugstr(key)))
	
	# Pack key and block bytes into lists of uint32 in big endian
	k = _bytes_to_uint32_list_big_endian(key)    # 4 elements of uint32
	m = _bytes_to_uint32_list_big_endian(block)  # 2 elements of uint32
	
	# Perform 32 rounds of decryption
	rcon = (_ROUND_CONSTANT * _NUM_ROUNDS) & cryptocommon.UINT32_MASK
	for i in range(_NUM_ROUNDS):
		if printdebug: print("    Round {:2d}: block = [{:08X} {:08X}]".format(i, m[0], m[1]))
		m[1] -= ((m[0] << 4) + k[2]) ^ (m[0] + rcon) ^ ((m[0] >> 5) + k[3])
		m[1] &= cryptocommon.UINT32_MASK
		m[0] -= ((m[1] << 4) + k[0]) ^ (m[1] + rcon) ^ ((m[1] >> 5) + k[1])
		m[0] &= cryptocommon.UINT32_MASK
		rcon = (rcon - _ROUND_CONSTANT) & cryptocommon.UINT32_MASK
	
	# Unpack uint32 array into new block bytes in big endian
	result = []
	for x in m:
		result.append(int((x >> 24) & 0xFF))
		result.append(int((x >> 16) & 0xFF))
		result.append(int((x >>  8) & 0xFF))
		result.append(int((x >>  0) & 0xFF))
	if printdebug: print("")
	return result


# ---- Private functions ----

def _bytes_to_uint32_list_big_endian(bytelist):
	assert len(bytelist) % 4 == 0
	result = [0] * (len(bytelist) // 4)
	for (i, b) in enumerate(bytelist):
		assert 0 <= b <= 0xFF
		result[i // 4] |= b << ((3 - (i % 4)) * 8)
	return result


# ---- Numerical constants/tables ----

_NUM_ROUNDS = 32

_ROUND_CONSTANT = 0x9E3779B9  # uint32
