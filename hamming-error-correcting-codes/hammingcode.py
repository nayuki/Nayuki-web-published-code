# 
# Hamming error-correcting code (Python)
# 
# Copyright (c) 2025 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/hamming-error-correcting-codes
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

import collections
from typing import Optional


class HammingCode:
	
	message_length: int
	codeword_length: int
	_num_parity: int  # Excluding extra parity
	has_extra_parity: bool
	
	
	def __init__(self, msglen: int, extraparity: bool):
		if msglen < 1:
			raise ValueError("Message length too small")
		self.message_length = msglen
		self.has_extra_parity = extraparity
		
		self._num_parity = 2
		while 2**self._num_parity - 1 - self._num_parity < msglen:
			self._num_parity += 1
		self.codeword_length = self.message_length + self._num_parity
		if extraparity:
			self.codeword_length += 1
	
	
	def encode(self, msg: collections.abc.Sequence[int]) -> list[int]:
		if len(msg) != self.message_length:
			raise ValueError("Message length mismatch")
		if any((x not in (0, 1)) for x in msg):
			raise ValueError("Message contains value other than 0 and 1")
		
		result: list[int] = []
		i: int = 0
		for j in range(self.codeword_length + (0 if self.has_extra_parity else 1)):
			if j & (j - 1) == 0:  # j is 0 (extra parity bit) or power of 2 (Hamming parity bit)
				result.append(0)
			else:
				result.append(msg[i])
				i += 1
		assert i == len(msg)
		
		syndrome: int = 0
		for (i, x) in enumerate(result):
			syndrome ^= x * i
		for i in range(self._num_parity):
			result[2**i] = (syndrome >> i) & 1
		sum: int = 0
		for (i, x) in enumerate(result):
			sum ^= x
		result[0] = sum
		
		if not self.has_extra_parity:
			del result[0]
		return result
	
	
	def decode(self, cw: collections.abc.Sequence[int]) -> tuple[Optional[list[int]],bool]:
		if len(cw) != self.codeword_length:
			raise ValueError("Codeword length mismatch")
		if any((x not in (0, 1)) for x in cw):
			raise ValueError("Codeword contains value other than 0 and 1")
		
		tempcw: list[int] = list(cw)
		if not self.has_extra_parity:
			tempcw.insert(0, 0)  # Placeholder extra parity bit
		
		sum: int = 0
		syndrome: int = 0
		for (i, x) in enumerate(tempcw):
			sum ^= x
			syndrome ^= x * i
		
		error: bool = self.has_extra_parity and (sum != 0)
		if syndrome != 0:
			error = True
			if (syndrome >= len(tempcw)) or (self.has_extra_parity and (sum == 0)):
				return (None, True)
			tempcw[syndrome] ^= 1
		
		msg: list[int] = [x for (i, x) in enumerate(tempcw) if (i & (i - 1) != 0)]
		assert len(msg) == self.message_length
		return (msg, error)
