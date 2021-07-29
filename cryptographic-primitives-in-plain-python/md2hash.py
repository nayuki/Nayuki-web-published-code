# 
# The MD2 hash function. It is described in RFC 1319.
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
	"""Computes the hash of the given bytelist message, returning a new 16-element bytelist."""
	
	# Make a shallow copy of the list to prevent modifying the caller's list object
	assert isinstance(message, list)
	msg = list(message)
	if printdebug:  print(f"md2.hash(message = {len(message)} bytes)")
	
	# Append the termination padding
	padlen = _BLOCK_SIZE - (len(msg) % _BLOCK_SIZE)
	msg.extend([padlen] * padlen)
	
	# Initialize the hash state
	state    = tuple([0] * 48)
	checksum = tuple([0] * 16)
	
	# Compress each block in the augmented message
	assert len(msg) % _BLOCK_SIZE == 0
	for i in range(len(msg) // _BLOCK_SIZE):
		block = tuple(msg[i * _BLOCK_SIZE : (i + 1) * _BLOCK_SIZE])
		if printdebug:  print(f"    Block {i} = {cryptocommon.bytelist_to_debugstr(block)}")
		state, checksum = _compress(block, state, checksum, printdebug)
	
	# Compress the checksum as the final block
	if printdebug:  print(f"    Final block = {cryptocommon.bytelist_to_debugstr(list(checksum))}")
	state, checksum = _compress(checksum, state, checksum, printdebug)
	
	# Return a prefix of the final state as a bytelist
	if printdebug:  print()
	return list(state[ : 16])


# ---- Private functions ----

def _compress(block: Tuple[int,...], state: Tuple[int,...], checksum: Tuple[int,...], printdebug: bool) -> Tuple[Tuple[int,...],Tuple[int,...]]:
	# Check argument types and lengths
	assert isinstance(block, tuple) and len(block) == _BLOCK_SIZE
	assert isinstance(state, tuple) and len(state) == 48
	assert isinstance(checksum, tuple) and len(checksum) == 16
	
	# Copy the block into the state
	newstate = list(state)
	for i in range(16):
		b = block[i]
		assert 0 <= b <= 0xFF
		newstate[i + 16] = b
		newstate[i + 32] = b ^ newstate[i]
	
	# Perform 18 rounds of hashing
	t = 0
	for i in range(18):
		for j in range(len(newstate)):
			newstate[j] ^= _SBOX[t]
			t = newstate[j]
		t = (t + i) & 0xFF
	
	# Checksum the block
	newchecksum = list(checksum)
	l = newchecksum[-1]
	for i in range(16):
		l = newchecksum[i] ^ _SBOX[block[i] ^ l]
		newchecksum[i] = l
	
	# Return new state and checksum as a tuples
	return (tuple(newstate), tuple(newchecksum))


# ---- Numerical constants/tables ----

_BLOCK_SIZE: int = 16  # In bytes

_SBOX: List[int] = [  # A permutation of the 256 byte values, from 0x00 to 0xFF
	0x29, 0x2E, 0x43, 0xC9, 0xA2, 0xD8, 0x7C, 0x01, 0x3D, 0x36, 0x54, 0xA1, 0xEC, 0xF0, 0x06, 0x13,
	0x62, 0xA7, 0x05, 0xF3, 0xC0, 0xC7, 0x73, 0x8C, 0x98, 0x93, 0x2B, 0xD9, 0xBC, 0x4C, 0x82, 0xCA,
	0x1E, 0x9B, 0x57, 0x3C, 0xFD, 0xD4, 0xE0, 0x16, 0x67, 0x42, 0x6F, 0x18, 0x8A, 0x17, 0xE5, 0x12,
	0xBE, 0x4E, 0xC4, 0xD6, 0xDA, 0x9E, 0xDE, 0x49, 0xA0, 0xFB, 0xF5, 0x8E, 0xBB, 0x2F, 0xEE, 0x7A,
	0xA9, 0x68, 0x79, 0x91, 0x15, 0xB2, 0x07, 0x3F, 0x94, 0xC2, 0x10, 0x89, 0x0B, 0x22, 0x5F, 0x21,
	0x80, 0x7F, 0x5D, 0x9A, 0x5A, 0x90, 0x32, 0x27, 0x35, 0x3E, 0xCC, 0xE7, 0xBF, 0xF7, 0x97, 0x03,
	0xFF, 0x19, 0x30, 0xB3, 0x48, 0xA5, 0xB5, 0xD1, 0xD7, 0x5E, 0x92, 0x2A, 0xAC, 0x56, 0xAA, 0xC6,
	0x4F, 0xB8, 0x38, 0xD2, 0x96, 0xA4, 0x7D, 0xB6, 0x76, 0xFC, 0x6B, 0xE2, 0x9C, 0x74, 0x04, 0xF1,
	0x45, 0x9D, 0x70, 0x59, 0x64, 0x71, 0x87, 0x20, 0x86, 0x5B, 0xCF, 0x65, 0xE6, 0x2D, 0xA8, 0x02,
	0x1B, 0x60, 0x25, 0xAD, 0xAE, 0xB0, 0xB9, 0xF6, 0x1C, 0x46, 0x61, 0x69, 0x34, 0x40, 0x7E, 0x0F,
	0x55, 0x47, 0xA3, 0x23, 0xDD, 0x51, 0xAF, 0x3A, 0xC3, 0x5C, 0xF9, 0xCE, 0xBA, 0xC5, 0xEA, 0x26,
	0x2C, 0x53, 0x0D, 0x6E, 0x85, 0x28, 0x84, 0x09, 0xD3, 0xDF, 0xCD, 0xF4, 0x41, 0x81, 0x4D, 0x52,
	0x6A, 0xDC, 0x37, 0xC8, 0x6C, 0xC1, 0xAB, 0xFA, 0x24, 0xE1, 0x7B, 0x08, 0x0C, 0xBD, 0xB1, 0x4A,
	0x78, 0x88, 0x95, 0x8B, 0xE3, 0x63, 0xE8, 0x6D, 0xE9, 0xCB, 0xD5, 0xFE, 0x3B, 0x00, 0x1D, 0x39,
	0xF2, 0xEF, 0xB7, 0x0E, 0x66, 0x58, 0xD0, 0xE4, 0xA6, 0x77, 0x72, 0xF8, 0xEB, 0x75, 0x4B, 0x0A,
	0x31, 0x44, 0x50, 0xB4, 0x8F, 0xED, 0x1F, 0x1A, 0xDB, 0x99, 0x8D, 0x33, 0x9F, 0x11, 0x83, 0x14,
]
