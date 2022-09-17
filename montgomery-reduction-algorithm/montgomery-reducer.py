# 
# Montgomery reduction algorithm (Python)
# 
# Copyright (c) 2022 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/montgomery-reduction-algorithm
# 

import math, random, unittest


class MontgomeryReducerTest(unittest.TestCase):
	
	def test_basic(self) -> None:
		for _ in range(3000):
			bitlen: int = random.randint(2, 100)
			mod: int = random.randrange(1 << bitlen, 2 << bitlen) | 1  # Force it to be odd
			mr = MontgomeryReducer(mod)
			
			for _ in range(100):
				x: int = random.randrange(mod)
				y: int = random.randrange(mod)
				u: int = mr.convert_in(x)
				v: int = mr.convert_in(y)
				w: int = mr.multiply(u, v)
				if mr.convert_out(w) != x * y % mod:
					raise AssertionError()
			
			for _ in range(10):
				x = random.randrange(mod)
				y = random.randrange(mod)
				u = mr.convert_in(x)
				v = mr.pow(u, y)
				if mr.convert_out(v) != pow(x, y, mod):
					raise AssertionError()



class MontgomeryReducer:
	
	modulus: int
	reducerbits: int
	reducer: int
	mask: int
	reciprocal: int
	factor: int
	convertedone: int
	
	
	def __init__(self, mod: int):
		# Modulus
		if mod < 3 or mod % 2 == 0:
			raise ValueError("Modulus must be an odd number at least 3")
		self.modulus = mod
		
		# Reducer
		self.reducerbits = (mod.bit_length() // 8 + 1) * 8  # This is a multiple of 8
		self.reducer = 1 << self.reducerbits  # This is a power of 256
		self.mask = self.reducer - 1
		assert (self.reducer > mod) and (math.gcd(self.reducer, mod) == 1)
		
		# Other computed numbers
		self.reciprocal = pow(self.reducer, -1, mod)
		self.factor = (self.reducer * self.reciprocal - 1) // mod
		self.convertedone = self.reducer % mod
	
	
	# The range of x is unlimited
	def convert_in(self, x: int) -> int:
		return (x << self.reducerbits) % self.modulus
	
	
	# The range of x is unlimited
	def convert_out(self, x: int) -> int:
		return (x * self.reciprocal) % self.modulus
	
	
	# Inputs and output are in Montgomery form and in the range [0, modulus)
	def multiply(self, x: int, y: int) -> int:
		mod: int = self.modulus
		assert (0 <= x < mod) and (0 <= y < mod)
		product: int = x * y
		temp: int = ((product & self.mask) * self.factor) & self.mask
		reduced: int = (product + temp * mod) >> self.reducerbits
		result: int = reduced if (reduced < mod) else (reduced - mod)
		assert 0 <= result < mod
		return result
	
	
	# Input x (base) and output (power) are in Montgomery form and in the range [0, modulus); input y (exponent) is in standard form
	def pow(self, x: int, y: int) -> int:
		assert 0 <= x < self.modulus
		if y < 0:
			raise ValueError("Negative exponent")
		z: int = self.convertedone
		while y != 0:
			if y & 1 != 0:
				z = self.multiply(z, x)
			x = self.multiply(x, x)
			y >>= 1
		return z



if __name__ == "__main__":
	unittest.main()
