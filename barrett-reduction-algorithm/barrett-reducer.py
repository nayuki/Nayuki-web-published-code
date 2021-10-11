# 
# Barrett reduction algorithm (Python)
# 
# Copyright (c) 2021 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/barrett-reduction-algorithm
# 

import random, unittest


class BarrettReducerTest(unittest.TestCase):
	
	def test_basic(self) -> None:
		for _ in range(10000):
			mod: int = BarrettReducerTest.random_modulus()
			modsqr: int = mod**2
			br = BarrettReducer(mod)
			for _ in range(100):
				x: int = random.randrange(modsqr)
				if br.reduce(x) != x % mod:
					raise AssertionError()
	
	
	@staticmethod
	def random_modulus() -> int:
		bitlen: int = random.randint(2, 100)
		return random.randint((1 << bitlen) + 1, (2 << bitlen) - 1)



class BarrettReducer:
	
	modulus: int
	shift: int
	factor: int
	
	
	def __init__(self, mod: int):
		if mod <= 0:
			raise ValueError("Modulus must be positive")
		if mod & (mod - 1) == 0:
			raise ValueError("Modulus must not be a power of 2")
		self.modulus = mod
		self.shift = mod.bit_length() * 2
		self.factor = (1 << self.shift) // mod
	
	
	# For x in [0, mod^2), this returns x % mod.
	def reduce(self, x: int) -> int:
		mod = self.modulus
		assert 0 <= x < mod**2
		t = (x - ((x * self.factor) >> self.shift) * mod)
		return t if (t < mod) else (t - mod)



if __name__ == "__main__":
	unittest.main()
