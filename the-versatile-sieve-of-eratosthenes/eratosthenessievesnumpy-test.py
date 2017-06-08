# 
# Test of variants of the sieve of Eratosthenes (Python with NumPy)
# by Project Nayuki, 2017. Public domain.
# https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
# 

import unittest
import eratosthenessievesnumpy


class EratosthenesSievesNumpyTest(unittest.TestCase):
	
	def test_values(self):
		self.assertEqual(eratosthenessievesnumpy.sieve_primeness(30).tolist(), [False, False, True, True, False, True, False, True, False, False, False, True, False, True, False, False, False, True, False, True, False, False, False, True, False, False, False, False, False, True, False])
		self.assertEqual(eratosthenessievesnumpy.sieve_smallest_prime_factor(30).tolist(), [0, 1, 2, 3, 2, 5, 2, 7, 2, 3, 2, 11, 2, 13, 2, 3, 2, 17, 2, 19, 2, 3, 2, 23, 2, 5, 2, 3, 2, 29, 2])
		self.assertEqual(eratosthenessievesnumpy.sieve_totient(30).tolist(), [0, 1, 1, 2, 2, 4, 2, 6, 4, 6, 4, 10, 4, 12, 6, 8, 8, 16, 6, 18, 8, 12, 10, 22, 8, 20, 12, 18, 12, 28, 8])
		self.assertEqual(eratosthenessievesnumpy.sieve_omega(30).tolist(), [0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2, 1, 3])
		self.assertEqual(eratosthenessievesnumpy.sieve_radical(30).tolist(), [0, 1, 2, 3, 2, 5, 6, 7, 2, 3, 10, 11, 6, 13, 14, 15, 2, 17, 6, 19, 10, 21, 22, 23, 6, 5, 26, 3, 14, 29, 30])
	
	
	def test_prefix_consistency(self):
		N = 3000
		FUNCS = [
			eratosthenessievesnumpy.sieve_primeness,
			eratosthenessievesnumpy.sieve_smallest_prime_factor,
			eratosthenessievesnumpy.sieve_totient,
			eratosthenessievesnumpy.sieve_omega,
			eratosthenessievesnumpy.sieve_radical,
		]
		for func in FUNCS:
			prev = []
			for i in range(N):
				cur = func(i).tolist()
				self.assertEqual(len(cur), len(prev) + 1)
				self.assertEqual(cur[ : -1], prev)
				prev = cur


if __name__ == "__main__":
	unittest.main()
