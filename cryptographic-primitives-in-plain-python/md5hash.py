# 
# The MD5 hash function. It is described in RFC 1321.
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


# ---- Public functions ----

# Computes the hash of the given bytelist message, returning a new 16-element bytelist.
def hash(message, printdebug=False):
	# Make a shallow copy of the list to prevent modifying the caller's list object
	assert isinstance(message, list)
	msg = list(message)
	if printdebug:  print(f"md5.hash(message = {len(message)} bytes)")
	
	# Append the termination bit (rounded up to a whole byte)
	msg.append(0x80)
	
	# Append padding bytes until message is exactly 8 bytes less than a whole block
	while (len(msg) + 8) % _BLOCK_SIZE != 0:
		msg.append(0x00)
	
	# Append the length of the original message in bits, as 8 bytes in little endian
	bitlength = len(message) * 8
	for i in range(8):
		msg.append((bitlength >> (i * 8)) & 0xFF)
	
	# Initialize the hash state
	state = (0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476)
	
	# Compress each block in the augmented message
	assert len(msg) % _BLOCK_SIZE == 0
	for i in range(len(msg) // _BLOCK_SIZE):
		block = tuple(msg[i * _BLOCK_SIZE : (i + 1) * _BLOCK_SIZE])
		if printdebug:  print(f"    Block {i} = {cryptocommon.bytelist_to_debugstr(block)}")
		state = _compress(block, state, printdebug)
	
	# Serialize the final state as a bytelist in little endian
	result = []
	for x in state:
		result.append(int((x >>  0) & 0xFF))
		result.append(int((x >>  8) & 0xFF))
		result.append(int((x >> 16) & 0xFF))
		result.append(int((x >> 24) & 0xFF))
	if printdebug:  print()
	return result


# ---- Private functions ----

# Requirement: All elements of block and state must be uint32.
def _compress(block, state, printdebug):
	# Check argument types and lengths
	assert isinstance(block, tuple) and len(block) == _BLOCK_SIZE
	assert isinstance(state, tuple) and len(state) == 4
	
	# Pack block bytes into schedule as uint32 in little endian
	schedule = [0] * 16
	for (i, b) in enumerate(block):
		assert 0 <= b <= 0xFF
		schedule[i // 4] |= b << ((i % 4) * 8)
	
	# Unpack state into variables; each one is a uint32
	a, b, c, d = state
	
	# Perform 64 rounds of hashing
	for i in range(len(_ROUND_CONSTANTS)):
		# Compute f value and schedule index based on the round index i
		if printdebug:  print(f"        Round {i:2d}: a={a:08X}, b={b:08X}, c={c:08X}, d={d:08X}")
		if i < 16:
			f = (b & c) | (~b & d)
			k = i
		elif i < 32:
			f = (d & b) | (~d & c)
			k = (5 * i + 1) % 16
		elif i < 48:
			f = b ^ c ^ d
			k = (3 * i + 5) % 16
		else:
			f = c ^ (b | ~d)
			k = (7 * i) % 16
		
		# Perform the round calculation
		rot = _ROTATION_AMOUNTS[((i >> 2) & 0xC) | (i & 0x3)]
		temp = (a + f + schedule[k] + _ROUND_CONSTANTS[i]) & cryptocommon.UINT32_MASK
		temp = cryptocommon.rotate_left_uint32(temp, rot)
		a = d
		d = c
		c = b
		b = (b + temp) & cryptocommon.UINT32_MASK
	
	# Return new state as a tuple
	return (
		(state[0] + a) & cryptocommon.UINT32_MASK,
		(state[1] + b) & cryptocommon.UINT32_MASK,
		(state[2] + c) & cryptocommon.UINT32_MASK,
		(state[3] + d) & cryptocommon.UINT32_MASK)


# ---- Numerical constants/tables ----

_BLOCK_SIZE = 64  # In bytes

_ROUND_CONSTANTS = [  # 64 elements of uint32
	0xD76AA478, 0xE8C7B756, 0x242070DB, 0xC1BDCEEE,
	0xF57C0FAF, 0x4787C62A, 0xA8304613, 0xFD469501,
	0x698098D8, 0x8B44F7AF, 0xFFFF5BB1, 0x895CD7BE,
	0x6B901122, 0xFD987193, 0xA679438E, 0x49B40821,
	0xF61E2562, 0xC040B340, 0x265E5A51, 0xE9B6C7AA,
	0xD62F105D, 0x02441453, 0xD8A1E681, 0xE7D3FBC8,
	0x21E1CDE6, 0xC33707D6, 0xF4D50D87, 0x455A14ED,
	0xA9E3E905, 0xFCEFA3F8, 0x676F02D9, 0x8D2A4C8A,
	0xFFFA3942, 0x8771F681, 0x6D9D6122, 0xFDE5380C,
	0xA4BEEA44, 0x4BDECFA9, 0xF6BB4B60, 0xBEBFBC70,
	0x289B7EC6, 0xEAA127FA, 0xD4EF3085, 0x04881D05,
	0xD9D4D039, 0xE6DB99E5, 0x1FA27CF8, 0xC4AC5665,
	0xF4292244, 0x432AFF97, 0xAB9423A7, 0xFC93A039,
	0x655B59C3, 0x8F0CCC92, 0xFFEFF47D, 0x85845DD1,
	0x6FA87E4F, 0xFE2CE6E0, 0xA3014314, 0x4E0811A1,
	0xF7537E82, 0xBD3AF235, 0x2AD7D2BB, 0xEB86D391,
]

_ROTATION_AMOUNTS = [
	7, 12, 17, 22,
	5,  9, 14, 20,
	4, 11, 16, 23,
	6, 10, 15, 21,
]
