# 
# The AES (Advanced Encryption Standard) block cipher. It is described in FIPS Publication 197.
# Note: Only the 128-bit key length is implemented.
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

# Computes the encryption of the given block (16-element bytelist) with
# the given key (16-element bytelist), returning a new 16-element bytelist.
def encrypt(block, key, printdebug=False):
	# Check input arguments
	assert type(block) == list and len(block) == 16
	assert type(key) == list and len(key) == 16
	if printdebug: print("aescipher.encrypt(block = {}, key = {})".format(cryptocommon.bytelist_to_debugstr(block), cryptocommon.bytelist_to_debugstr(key)))
	
	# Compute key schedule from key
	keyschedule = _expand_key_schedule(key)
	
	# Perform special first round
	i = 0
	newblock = tuple(block)
	if printdebug: print("    Round {:2d}: block = {}".format(i, cryptocommon.bytelist_to_debugstr(list(newblock))))
	newblock = _add_round_key(newblock, keyschedule[0])
	i += 1
	
	# Perform 9 regular rounds of encryption
	for subkey in keyschedule[1 : -1]:
		if printdebug: print("    Round {:2d}: block = {}".format(i, cryptocommon.bytelist_to_debugstr(list(newblock))))
		newblock = _sub_bytes(newblock, _SBOX_FORWARD)
		newblock = _shift_rows(newblock, 1)
		newblock = _mix_columns(newblock, _MULTIPLIERS_FORWARD)
		newblock = _add_round_key(newblock, subkey)
		i += 1
	
	# Perform special last round
	if printdebug: print("    Round {:2d}: block = {}".format(i, cryptocommon.bytelist_to_debugstr(list(newblock))))
	newblock = _sub_bytes(newblock, _SBOX_FORWARD)
	newblock = _shift_rows(newblock, 1)
	newblock = _add_round_key(newblock, keyschedule[-1])
	
	# Return the final block as a bytelist
	if printdebug: print("")
	return list(newblock)


# Computes the decryption of the given block (16-element bytelist) with
# the given key (16-element bytelist), returning a new 16-element bytelist.
def decrypt(block, key, printdebug=False):
	# Check input arguments
	assert type(block) == list and len(block) == 16
	assert type(key) == list and len(key) == 16
	if printdebug: print("aescipher.decrypt(block = {}, key = {})".format(cryptocommon.bytelist_to_debugstr(block), cryptocommon.bytelist_to_debugstr(key)))
	
	# Compute key schedule from key
	keyschedule = list(reversed(_expand_key_schedule(key)))
	
	# Perform special first round
	i = 0
	newblock = tuple(block)
	if printdebug: print("    Round {:2d}: block = {}".format(i, cryptocommon.bytelist_to_debugstr(list(newblock))))
	newblock = _add_round_key(newblock, keyschedule[0])
	newblock = _shift_rows(newblock, -1)
	newblock = _sub_bytes(newblock, _SBOX_INVERSE)
	i += 1
	
	# Perform 9 regular rounds of decryption
	for subkey in keyschedule[1 : -1]:
		if printdebug: print("    Round {:2d}: block = {}".format(i, cryptocommon.bytelist_to_debugstr(list(newblock))))
		newblock = _add_round_key(newblock, subkey)
		newblock = _mix_columns(newblock, _MULTIPLIERS_INVERSE)
		newblock = _shift_rows(newblock, -1)
		newblock = _sub_bytes(newblock, _SBOX_INVERSE)
		i += 1
	
	# Perform special last round
	if printdebug: print("    Round {:2d}: block = {}".format(i, cryptocommon.bytelist_to_debugstr(list(newblock))))
	newblock = _add_round_key(newblock, keyschedule[-1])
	
	# Return the final block as a bytelist
	if printdebug: print("")
	return list(newblock)


# ---- Private functions ----

def _expand_key_schedule(key):
	# Initialize key schedule with the verbatim key
	assert type(key) == list and len(key) == 16
	result = [tuple(key)]  # Each element of this list is a 16-byte tuple
	
	# Extend the key schedule by blending previous values
	numrounds = 10
	rcon = 1
	for i in range(numrounds):
		subkey = []
		for j in range(16):
			if j < 4:
				val = result[i][12 + ((j + 1) % 4)]
				val = _SBOX_FORWARD[val]
				if j == 0:
					val ^= rcon
			else:
				val = subkey[j - 4]
			subkey.append(val ^ result[i][j])
		result.append(tuple(subkey))
		rcon = _multiply(rcon, 0x02)
	
	# Return the list
	return result


# 'msg' is a 16-byte tuple. Returns a 16-byte tuple.
def _sub_bytes(msg, sbox):
	assert len(sbox) == 256
	newmsg = []
	for b in msg:
		newmsg.append(sbox[b])
	return tuple(newmsg)


# 'msg' is a 16-byte tuple. Returns a 16-byte tuple.
def _shift_rows(msg, direction):
	assert direction in (-1, 1)
	newmsg = [None] * 16
	for row in range(4):
		for col in range(4):
			newmsg[col * 4 + row] = msg[(col + row * direction) % 4 * 4 + row]
	return tuple(newmsg)


# 'msg' is a 16-byte tuple. Returns a 16-byte tuple.
def _mix_columns(msg, multipliers):
	assert len(multipliers) == 4
	newmsg = [None] * 16
	for col in range(4):
		for row in range(4):
			val = 0
			for i in range(4):
				val ^= _multiply(msg[col * 4 + (row + i) % 4], multipliers[i])
			newmsg[col * 4 + row] = val
	return tuple(newmsg)


# 'msg' and 'key' are 16-byte tuples. Returns a 16-byte tuple.
def _add_round_key(msg, key):
	result = []
	for (x, y) in zip(msg, key):
		result.append(x ^ y)
	return tuple(result)


# Performs finite field multiplication on the given two bytes, returning a byte.
def _multiply(x, y):
	assert 0 <= x <= 0xFF
	assert 0 <= y <= 0xFF
	z = 0
	for i in reversed(range(8)):
		z <<= 1
		if z >= 0x100:
			z ^= 0x11B
		if ((y >> i) & 1) != 0:
			z ^= x
	assert 0 <= z <= 0xFF
	return z


# Computes the multiplicative inverse of the given byte, returning a byte.
def _reciprocal(x):
	assert 0 <= x <= 0xFF
	if x == 0:
		return 0
	for y in range(256):
		if _multiply(x, y) == 1:
			return y
	raise AssertionError()


# Rotates the given 8-bit integer left by the given number of bits.
def _rotl8(value, amount):
	assert 0 <= value <= 0xFF
	assert 0 <= amount < 8
	return ((value << amount) | (value >> (8 - amount))) & 0xFF


# ---- Numerical constants/tables ----

# For _mix_columns()
_MULTIPLIERS_FORWARD = [0x02, 0x03, 0x01, 0x01]
_MULTIPLIERS_INVERSE = [0x0E, 0x0B, 0x0D, 0x09]

# For _sub_bytes()
_SBOX_FORWARD = []  # A permutation of the 256 byte values, from 0x00 to 0xFF
_SBOX_INVERSE = [0] * 256  # Also a permutation
def _init_sbox():
	for i in range(256):
		j = _reciprocal(i)
		j = j ^ _rotl8(j, 1) ^ _rotl8(j, 2) ^ _rotl8(j, 3) ^ _rotl8(j, 4) ^ 0x63
		assert 0 <= j <= 0xFF
		_SBOX_FORWARD.append(j)
		_SBOX_INVERSE[j] = i
_init_sbox()
