# 
# Number-theoretic transform test (Python)
# 
# Copyright (c) 2023 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/number-theoretic-transform-integer-dft
# 

import random, unittest
from typing import List, Set, Tuple
import numbertheoretictransform as ntt


class NumberTheoreticTransformTest(unittest.TestCase):
	
	def test_forward_transform(self) -> None:
		actual: List[int] = ntt.transform([6, 0, 10, 7, 2], 3, 11)
		expect: List[int] = [3, 7, 0, 5, 4]
		self.assertEqual(expect, actual)
	
	
	def test_inverse_transform(self) -> None:
		actual: List[int] = ntt.inverse_transform([3, 7, 0, 5, 4], 3, 11)
		expect: List[int] = [6, 0, 10, 7, 2]
		self.assertEqual(expect, actual)
	
	
	def test_simple_convolution(self) -> None:
		mod: int = 673
		root: int = 326
		vec0: List[int] = ntt.transform([4, 1, 4, 2, 1, 3, 5, 6], root, mod)
		vec1: List[int] = ntt.transform([6, 1, 8, 0, 3, 3, 9, 8], root, mod)
		vec2: List[int] = [(x * y % mod) for (x, y) in zip(vec0, vec1)]
		actual: List[int] = ntt.inverse_transform(vec2, root, mod)
		expect: List[int] = [123, 120, 106, 92, 139, 144, 140, 124]
		self.assertEqual(expect, actual)
	
	
	def test_automatic_convolution(self) -> None:
		actual: List[int] = ntt.circular_convolve(
			[4, 1, 4, 2, 1, 3, 5, 6],
			[6, 1, 8, 0, 3, 3, 9, 8])
		expect: List[int] = [123, 120, 106, 92, 139, 144, 140, 124]
		self.assertEqual(expect, actual)
	
	
	def test_transform_roundtrip_randomly(self) -> None:
		TRIALS: int = 300
		for _ in range(TRIALS):
			veclen: int = random.randint(1, 100)
			maxval: int = random.randint(1, 100)
			vec: List[int] = [random.randrange(maxval + 1) for _ in range(veclen)]
			temp, root, mod = ntt.find_params_and_transform(vec, maxval + 1)
			inv: List[int] = ntt.inverse_transform(temp, root, mod)
			self.assertEqual(vec, inv)
	
	
	def test_transform_linearity_randomly(self) -> None:
		TRIALS: int = 100
		for _ in range(TRIALS):
			veclen: int = random.randint(1, 100)
			maxval: int = random.randint(1, 100)
			vec0: List[int] = [random.randrange(maxval + 1) for _ in range(veclen)]
			vec1: List[int] = [random.randrange(maxval + 1) for _ in range(veclen)]
			out0, root, mod = ntt.find_params_and_transform(vec0, maxval + 1)
			out1: List[int] = ntt.transform(vec1, root, mod)
			out01: List[int] = [(x + y) % mod for (x, y) in zip(out0, out1)]
			vec2: List[int] = [(x + y) % mod for (x, y) in zip(vec0, vec1)]
			out2: List[int] = ntt.transform(vec2, root, mod)
			self.assertEqual(out2, out01)
	
	
	def test_convolution_randomly(self) -> None:
		TRIALS: int = 100
		for _ in range(TRIALS):
			veclen: int = random.randint(1, 100)
			maxval: int = random.randint(1, 100)
			vec0: List[int] = [random.randrange(maxval + 1) for _ in range(veclen)]
			vec1: List[int] = [random.randrange(maxval + 1) for _ in range(veclen)]
			actual: List[int] = ntt.circular_convolve(vec0, vec1)
			expect: List[int] = NumberTheoreticTransformTest._circular_convolve(vec0, vec1)
			self.assertEqual(expect, actual)
	
	
	@staticmethod  # Naive algorithm
	def _circular_convolve(vec0: List[int], vec1: List[int]) -> List[int]:
		assert len(vec0) == len(vec1)
		result: List[int] = [0] * len(vec0)
		for (i, val0) in enumerate(vec0):
			for (j, val1) in enumerate(vec1):
				result[(i + j) % len(vec0)] += val0 * val1
		return result
	
	
	def test_transform_radix2_vs_naive(self) -> None:
		TRIALS: int = 300
		for _ in range(TRIALS):
			veclen: int = 2**random.randrange(8)
			maxval: int = random.randint(1, 100)
			vec: List[int] = [random.randrange(maxval + 1) for _ in range(veclen)]
			temp, root, mod = ntt.find_params_and_transform(vec, maxval + 1)
			ntt.transform_radix_2(vec, root, mod)
			self.assertEqual(temp, vec)
	
	
	def test_transform_radix2_roundtrip_randomly(self) -> None:
		TRIALS: int = 10
		for _ in range(TRIALS):
			veclen = 2**random.randint(0, 16)
			vallimit = 2**random.randint(1, 16)
			invec: List[int] = [random.randrange(vallimit) for _ in range(veclen)]
			
			mod: int = ntt.find_modulus(len(invec), vallimit)
			root: int = ntt.find_primitive_root(len(invec), mod - 1, mod)
			vec: List[int] = list(invec)
			ntt.transform_radix_2(vec, root, mod)
			
			ntt.transform_radix_2(vec, pow(root, -1, mod), mod)
			scaler: int = pow(veclen, -1, mod)
			vec = [(x * scaler % mod) for x in vec]
			self.assertEqual(invec, vec)
	
	
	def test_find_generator(self) -> None:
		CASES: List[Tuple[int,int,Set[int]]] = [
			( 2,  1, {1}),
			( 3,  2, {2}),
			( 4,  2, {3}),
			( 5,  4, {2, 3}),
			( 6,  2, {5}),
			( 7,  6, {3, 5}),
			( 8,  4, set()),
			( 9,  6, {2, 5}),
			(10,  4, {3, 7}),
			(11, 10, {2, 6, 7, 8}),
			(12,  4, set()),
			(13, 12, {2, 6, 7, 11}),
			(14,  6, {3, 5}),
			(15,  8, set()),
			(16,  8, set()),
			(17, 16, {3, 5, 6, 7, 10, 11, 12, 14}),
			(18,  6, {5, 11}),
			(19, 18, {2, 3, 10, 13, 14, 15}),
			(20,  8, set()),
			(21, 12, set()),
			(22, 10, {7, 13, 17, 19}),
			(23, 22, {5, 7, 10, 11, 14, 15, 17, 19, 20, 21}),
		]
		for (mod, totient, gens) in CASES:
			if len(gens) > 0:
				gen: int = ntt.find_generator(totient, mod)
				self.assertTrue(gen in gens)
			else:
				self.assertRaises(ValueError, ntt.find_generator, totient, mod)
	
	
	def test_is_primitive_root(self) -> None:
		CASES: List[Tuple[int,int,Set[int]]] = [
			( 2,  1, {1}),
			( 3,  2, {2}),
			( 4,  2, {3}),
			( 5,  2, {4}),
			( 5,  4, {2, 3}),
			( 6,  2, {5}),
			( 7,  2, {6}),
			( 7,  3, {2, 4}),
			( 7,  6, {3, 5}),
			( 8,  2, {3, 5, 7}),
			( 8,  4, set()),
			( 9,  2, {8}),
			( 9,  3, {4, 7}),
			( 9,  6, {2, 5}),
			(10,  2, {9}),
			(10,  4, {3, 7}),
			(11,  2, {10}),
			(11,  5, {3, 4, 5, 9}),
			(11, 10, {2, 6, 7, 8}),
			(12,  2, {5, 7, 11}),
			(12,  4, set()),
			(13,  2, {12}),
			(13,  3, {3, 9}),
			(13,  4, {5, 8}),
			(13,  6, {4, 10}),
			(13, 12, {2, 6, 7, 11}),
			(14,  2, {13}),
			(14,  3, {9, 11}),
			(14,  6, {3, 5}),
			(15,  2, {4, 11, 14}),
			(15,  4, {2, 7, 8, 13}),
			(15,  8, set()),
			
			(16,  8, set()),
			(17, 16, {3, 5, 6, 7, 10, 11, 12, 14}),
			(18,  6, {5, 11}),
			(19, 18, {2, 3, 10, 13, 14, 15}),
			(20,  8, set()),
			(21, 12, set()),
			(22, 10, {7, 13, 17, 19}),
			(23, 22, {5, 7, 10, 11, 14, 15, 17, 19, 20, 21}),
		]
		for (mod, degree, primroots) in CASES:
			for i in range(mod):
				self.assertEqual(i in primroots, ntt.is_primitive_root(i, degree, mod))
	
	
	def test_is_primitive_root_prime_generator(self) -> None:
		TRIALS: int = 1_000
		for _ in range(TRIALS):
			p: int = random.randrange(2, 10_000)
			if not ntt.is_prime(p):
				continue
			totient: int = p - 1
			
			val: int = random.randrange(p)
			expect: bool = True
			temp: int = 1
			for _ in range(totient - 1):
				temp = temp * val % p
				expect = expect and (temp != 1)
			temp = temp * val % p
			expect = expect and (temp == 1)
			actual: bool = ntt.is_primitive_root(val, totient, p)
			self.assertEqual(expect, actual)
	
	
	def test_unique_prime_factors(self) -> None:
		CASES: List[Tuple[int,List[int]]] = [
			( 1, []),
			( 2, [2]),
			( 3, [3]),
			( 4, [2]),
			( 5, [5]),
			( 6, [2, 3]),
			( 7, [7]),
			( 8, [2]),
			( 9, [3]),
			(10, [2, 5]),
			(11, [11]),
			(12, [2, 3]),
			(13, [13]),
			(14, [2, 7]),
			(15, [3, 5]),
			(16, [2]),
		]
		for (n, expect) in CASES:
			actual: List[int] = ntt.unique_prime_factors(n)
			self.assertEqual(expect, actual)
		
		TRIALS: int = 1_000
		for _ in range(TRIALS):
			n = random.randrange(2, 10_000)
			facts: List[int] = ntt.unique_prime_factors(n)
			self.assertEqual(ntt.is_prime(n), (len(facts) == 1) and (facts[0] == n))
	
	
	def test_is_prime(self) -> None:
		CASES: List[Tuple[int,bool]] = [
			( 2, True ),
			( 3, True ),
			( 4, False),
			( 5, True ),
			( 6, False),
			( 7, True ),
			( 8, False),
			( 9, False),
			(10, False),
			(11, True ),
			(12, False),
			(13, True ),
			(14, False),
			(15, False),
			(16, False),
		]
		for (n, expect) in CASES:
			actual: bool = ntt.is_prime(n)
			self.assertEqual(expect, actual)
	
	
	def test_sqrt(self) -> None:
		CASES: List[Tuple[int,int]] = [
			(0, 0),
			(1, 1),
			(2, 1),
			(3, 1),
			(4, 2),
			(5, 2),
			(6, 2),
			(7, 2),
			(8, 2),
			(9, 3),
		]
		for (x, y) in CASES:
			self.assertEqual(y, ntt.sqrt(x))
		
		TRIALS: int = 1_000
		for _ in range(TRIALS):
			x = random.randrange(10_000)
			y = ntt.sqrt(x)
			self.assertTrue(y**2 <= x < (y+1)**2)



if __name__ == "__main__":
	unittest.main()
