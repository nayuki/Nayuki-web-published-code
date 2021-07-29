# 
# The SHA-512 hash function. It is described in FIPS Publication 180.
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

def hash(message, printdebug=False):
	"""Computes the hash of the given bytelist message, returning a new 64-element bytelist."""
	
	# Make a shallow copy of the list to prevent modifying the caller's list object
	assert isinstance(message, list)
	msg = list(message)
	if printdebug:  print(f"sha512.hash(message = {len(message)} bytes)")
	
	# Append the termination bit (rounded up to a whole byte)
	msg.append(0x80)
	
	# Append padding bytes until message is exactly 16 bytes less than a whole block
	while (len(msg) + 16) % _BLOCK_SIZE != 0:
		msg.append(0x00)
	
	# Append the length of the original message in bits, as 16 bytes in big endian
	bitlength = len(message) * 8
	for i in reversed(range(16)):
		msg.append((bitlength >> (i * 8)) & 0xFF)
	
	# Initialize the hash state
	state = (0x6A09E667F3BCC908, 0xBB67AE8584CAA73B, 0x3C6EF372FE94F82B, 0xA54FF53A5F1D36F1,
	         0x510E527FADE682D1, 0x9B05688C2B3E6C1F, 0x1F83D9ABFB41BD6B, 0x5BE0CD19137E2179)
	
	# Compress each block in the augmented message
	assert len(msg) % _BLOCK_SIZE == 0
	for i in range(len(msg) // _BLOCK_SIZE):
		block = tuple(msg[i * _BLOCK_SIZE : (i + 1) * _BLOCK_SIZE])
		if printdebug:  print(f"    Block {i} = {cryptocommon.bytelist_to_debugstr(block)}")
		state = _compress(block, state, printdebug)
	
	# Serialize the final state as a bytelist in big endian
	result = []
	for x in state:
		for i in reversed(range(8)):
			result.append(int((x >> (i * 8)) & 0xFF))
	if printdebug:  print()
	return result


# ---- Private functions ----

# Requirement: All elements of block and state must be uint64.
def _compress(block, state, printdebug):
	# Check argument types and lengths
	assert isinstance(block, tuple) and len(block) == _BLOCK_SIZE
	assert isinstance(state, tuple) and len(state) == 8
	
	# Alias shorter names for readability
	mask64 = cryptocommon.UINT64_MASK
	rotr64 = cryptocommon.rotate_right_uint64
	
	# Pack block bytes into first part of schedule as uint64 in big endian
	schedule = [0] * 16
	for (i, b) in enumerate(block):
		assert 0 <= b <= 0xFF
		schedule[i // 8] |= b << ((7 - (i % 8)) * 8)
	
	# Extend the message schedule by blending previous values
	for i in range(len(schedule), len(_ROUND_CONSTANTS)):
		x = schedule[i - 15]
		y = schedule[i -  2]
		smallsigma0 = rotr64(x,  1) ^ rotr64(x,  8) ^ (x >> 7)
		smallsigma1 = rotr64(y, 19) ^ rotr64(y, 61) ^ (y >> 6)
		temp = (schedule[i - 16] + schedule[i - 7] + smallsigma0 + smallsigma1) & mask64
		schedule.append(temp)
	
	# Unpack state into variables; each one is a uint64
	a, b, c, d, e, f, g, h = state
	
	# Perform 80 rounds of hashing
	for i in range(len(schedule)):
		# Perform the round calculation
		if printdebug:  print(f"        Round {i:2d}: a={a:016X}, b={b:016X}, c={c:016X}, d={d:016X}, e={e:016X}, f={f:016X}, g={g:016X}, h={h:016X}")
		bigsigma0 = rotr64(a, 28) ^ rotr64(a, 34) ^ rotr64(a, 39)
		bigsigma1 = rotr64(e, 14) ^ rotr64(e, 18) ^ rotr64(e, 41)
		choose = (e & f) ^ (~e & g)
		majority = (a & b) ^ (a & c) ^ (b & c)
		t1 = (h + bigsigma1 + choose + schedule[i] + _ROUND_CONSTANTS[i]) & mask64
		t2 = (bigsigma0 + majority) & mask64
		h = g
		g = f
		f = e
		e = (d + t1) & mask64
		d = c
		c = b
		b = a
		a = (t1 + t2) & mask64
	
	# Return new state as a tuple
	return (
		(state[0] + a) & mask64,
		(state[1] + b) & mask64,
		(state[2] + c) & mask64,
		(state[3] + d) & mask64,
		(state[4] + e) & mask64,
		(state[5] + f) & mask64,
		(state[6] + g) & mask64,
		(state[7] + h) & mask64)


# ---- Numerical constants/tables ----

_BLOCK_SIZE = 128  # In bytes

_ROUND_CONSTANTS = [  # 80 elements of uint64
	0x428A2F98D728AE22, 0x7137449123EF65CD, 0xB5C0FBCFEC4D3B2F, 0xE9B5DBA58189DBBC,
	0x3956C25BF348B538, 0x59F111F1B605D019, 0x923F82A4AF194F9B, 0xAB1C5ED5DA6D8118,
	0xD807AA98A3030242, 0x12835B0145706FBE, 0x243185BE4EE4B28C, 0x550C7DC3D5FFB4E2,
	0x72BE5D74F27B896F, 0x80DEB1FE3B1696B1, 0x9BDC06A725C71235, 0xC19BF174CF692694,
	0xE49B69C19EF14AD2, 0xEFBE4786384F25E3, 0x0FC19DC68B8CD5B5, 0x240CA1CC77AC9C65,
	0x2DE92C6F592B0275, 0x4A7484AA6EA6E483, 0x5CB0A9DCBD41FBD4, 0x76F988DA831153B5,
	0x983E5152EE66DFAB, 0xA831C66D2DB43210, 0xB00327C898FB213F, 0xBF597FC7BEEF0EE4,
	0xC6E00BF33DA88FC2, 0xD5A79147930AA725, 0x06CA6351E003826F, 0x142929670A0E6E70,
	0x27B70A8546D22FFC, 0x2E1B21385C26C926, 0x4D2C6DFC5AC42AED, 0x53380D139D95B3DF,
	0x650A73548BAF63DE, 0x766A0ABB3C77B2A8, 0x81C2C92E47EDAEE6, 0x92722C851482353B,
	0xA2BFE8A14CF10364, 0xA81A664BBC423001, 0xC24B8B70D0F89791, 0xC76C51A30654BE30,
	0xD192E819D6EF5218, 0xD69906245565A910, 0xF40E35855771202A, 0x106AA07032BBD1B8,
	0x19A4C116B8D2D0C8, 0x1E376C085141AB53, 0x2748774CDF8EEB99, 0x34B0BCB5E19B48A8,
	0x391C0CB3C5C95A63, 0x4ED8AA4AE3418ACB, 0x5B9CCA4F7763E373, 0x682E6FF3D6B2B8A3,
	0x748F82EE5DEFB2FC, 0x78A5636F43172F60, 0x84C87814A1F0AB72, 0x8CC702081A6439EC,
	0x90BEFFFA23631E28, 0xA4506CEBDE82BDE9, 0xBEF9A3F7B2C67915, 0xC67178F2E372532B,
	0xCA273ECEEA26619C, 0xD186B8C721C0C207, 0xEADA7DD6CDE0EB1E, 0xF57D4F7FEE6ED178,
	0x06F067AA72176FBA, 0x0A637DC5A2C898A6, 0x113F9804BEF90DAE, 0x1B710B35131C471B,
	0x28DB77F523047D84, 0x32CAAB7B40C72493, 0x3C9EBE0A15C9BEBC, 0x431D67C49C100D4C,
	0x4CC5D4BECB3E42B6, 0x597F299CFC657E2A, 0x5FCB6FAB3AD6FAEC, 0x6C44198C4A475817,
]
