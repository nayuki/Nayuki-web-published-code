# 
# Hamming error-correcting code test (Python)
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

import random, unittest
from typing import Optional
from hammingcode import HammingCode


class HammingCodeTest(unittest.TestCase):
	
	def test_3_1(self) -> None:
		ham: HammingCode = HammingCode(1, False)
		# All encodings
		self.assertEqual(ham.encode([0]), [0,0,0])
		self.assertEqual(ham.encode([1]), [1,1,1])
		# All decodings
		self.assertEqual(ham.decode([0,0,0]), ([0], False))
		self.assertEqual(ham.decode([1,0,0]), ([0], True ))
		self.assertEqual(ham.decode([0,1,0]), ([0], True ))
		self.assertEqual(ham.decode([0,0,1]), ([0], True ))
		self.assertEqual(ham.decode([1,1,1]), ([1], False))
		self.assertEqual(ham.decode([0,1,1]), ([1], True ))
		self.assertEqual(ham.decode([1,0,1]), ([1], True ))
		self.assertEqual(ham.decode([1,1,0]), ([1], True ))
	
	
	def test_7_4(self) -> None:
		ham: HammingCode = HammingCode(4, False)
		# All encodings
		self.assertEqual(ham.encode([0,0,0,0]), [0,0,0,0,0,0,0])
		self.assertEqual(ham.encode([1,0,0,0]), [1,1,1,0,0,0,0])
		self.assertEqual(ham.encode([0,1,0,0]), [1,0,0,1,1,0,0])
		self.assertEqual(ham.encode([0,0,1,0]), [0,1,0,1,0,1,0])
		self.assertEqual(ham.encode([0,0,0,1]), [1,1,0,1,0,0,1])
		self.assertEqual(ham.encode([1,1,0,0]), [0,1,1,1,1,0,0])
		self.assertEqual(ham.encode([1,0,1,0]), [1,0,1,1,0,1,0])
		self.assertEqual(ham.encode([1,0,0,1]), [0,0,1,1,0,0,1])
		self.assertEqual(ham.encode([0,1,1,0]), [1,1,0,0,1,1,0])
		self.assertEqual(ham.encode([0,1,0,1]), [0,1,0,0,1,0,1])
		self.assertEqual(ham.encode([0,0,1,1]), [1,0,0,0,0,1,1])
		self.assertEqual(ham.encode([1,1,1,0]), [0,0,1,0,1,1,0])
		self.assertEqual(ham.encode([1,1,0,1]), [1,0,1,0,1,0,1])
		self.assertEqual(ham.encode([1,0,1,1]), [0,1,1,0,0,1,1])
		self.assertEqual(ham.encode([0,1,1,1]), [0,0,0,1,1,1,1])
		self.assertEqual(ham.encode([1,1,1,1]), [1,1,1,1,1,1,1])
		
		# All decodings
		for i in range(2**ham.message_length):  # All messages
			msg: list[int] = [((i >> j) & 1) for j in range(ham.message_length)]
			cw: list[int] = ham.encode(msg)
			self.assertEqual(ham.decode(cw), (msg, False))
			for j in range(ham.codeword_length):  # All 1-bit perturbations
				newcw: list[int] = list(cw)
				newcw[j] ^= 1
				self.assertEqual(ham.decode(newcw), (msg, True))
	
	
	def test_imperfect_decode_refused(self) -> None:
		CASES: list[tuple[int,list[int]]] = [
			(2, [0,0,1,0,1]),
			(2, [0,1,0,1,0]),
			(3, [1,0,0,0,0,1]),
			(3, [0,1,0,0,1,0]),
			(3, [0,0,1,1,0,0]),
			(3, [1,1,0,1,0,0]),
			(5, [0,1,0,0,0,0,0,1,0]),
			(5, [0,0,1,0,0,0,0,1,0]),
			(5, [0,0,0,1,0,0,0,1,0]),
			(5, [0,0,0,0,1,0,0,1,0]),
			(5, [0,0,0,0,0,1,0,1,0]),
			(5, [0,0,0,0,0,0,1,1,0]),
			(5, [0,0,1,0,0,0,0,0,1]),
		]
		for (msglen, cw) in CASES:
			ham: HammingCode = HammingCode(msglen, False)
			self.assertEqual(ham.decode(cw), (None, True))
	
	
	def test_perfect_randomly(self) -> None:
		TRIALS: int = 100
		for i in range(2, 10):
			ham: HammingCode = HammingCode(2**i - i - 1, False)
			self.assertEqual(ham.codeword_length, 2**i - 1)
			for _ in range(TRIALS):
				cw: list[int] = [random.randrange(2) for _ in range(ham.codeword_length)]
				self.assertIsNotNone(ham.decode(cw)[0])
	
	
	def test_randomly_without_extra_parity(self) -> None:
		TRIALS: int = 1_000
		for _ in range(TRIALS):
			ham: HammingCode = HammingCode(random.randrange(1, 1000), False)
			inmsg: list[int] = [random.randrange(2) for _ in range(ham.message_length)]
			cw: list[int] = ham.encode(inmsg)
			self.assertEqual(ham.decode(cw), (inmsg, False))
			newcw: list[int] = list(cw)
			
			# 1-bit perturbation is decodable
			i: int = random.randrange(ham.codeword_length)
			newcw[i] ^= 1
			self.assertEqual(ham.decode(newcw), (inmsg, True))
			
			# 2-bit perturbation is detectable and causes refused or wrong decoding
			assert ham.codeword_length >= 2
			j: int
			while (j := random.randrange(ham.codeword_length)) == i:
				pass
			newcw[j] ^= 1
			outmsg, error = ham.decode(newcw)
			self.assertTrue(error)
			self.assertTrue((outmsg is None) or (outmsg != inmsg))
	
	
	def test_randomly_with_extra_parity(self) -> None:
		TRIALS: int = 1_000
		for _ in range(TRIALS):
			ham: HammingCode = HammingCode(random.randrange(1, 1000), True)
			inmsg: list[int] = [random.randrange(2) for _ in range(ham.message_length)]
			cw: list[int] = ham.encode(inmsg)
			self.assertEqual(ham.decode(cw), (inmsg, False))
			newcw: list[int] = list(cw)
			
			# 1-bit perturbation is decodable
			i: int = random.randrange(ham.codeword_length)
			newcw[i] ^= 1
			self.assertEqual(ham.decode(newcw), (inmsg, True))
			
			# 2-bit perturbation is detectable and causes refused decoding
			assert ham.codeword_length >= 2
			j: int
			while (j := random.randrange(ham.codeword_length)) == i:
				pass
			newcw[j] ^= 1
			self.assertEqual(ham.decode(newcw), (None, True))
			
			# 3-bit perturbation is detectable and causes refused or wrong decoding
			assert ham.codeword_length >= 3
			k: int
			while (k := random.randrange(ham.codeword_length)) in (i, j):
				pass
			newcw[k] ^= 1
			outmsg, error = ham.decode(newcw)
			self.assertTrue(error)
			self.assertTrue((outmsg is None) or (outmsg != inmsg))



if __name__ == "__main__":
	unittest.main()
