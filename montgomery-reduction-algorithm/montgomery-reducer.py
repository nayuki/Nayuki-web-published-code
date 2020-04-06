# 
# Montgomery reduction algorithm (Python)
# 
# Copyright (c) 2020 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/montgomery-reduction-algorithm
# 

import fractions, random, unittest


class MontgomeryReducerTest(unittest.TestCase):
	
	def test_basic(self):
		for _ in range(3000):
			bitlen = random.randint(2, 100)
			mod = random.randrange(1 << bitlen, 2 << bitlen) | 1  # Force it to be odd
			mr = MontgomeryReducer(mod)
			
			for _ in range(100):
				x = random.randrange(0, mod)
				y = random.randrange(0, mod)
				u = mr.convert_in(x)
				v = mr.convert_in(y)
				w = mr.multiply(u, v)
				if mr.convert_out(w) != x * y % mod:
					raise AssertionError()
			
			for _ in range(10):
				x = random.randrange(0, mod)
				y = random.randrange(0, mod)
				u = mr.convert_in(x)
				v = mr.pow(u, y)
				if mr.convert_out(v) != pow(x, y, mod):
					raise AssertionError()



class MontgomeryReducer:
	
	def __init__(self, mod):
		# Modulus
		if mod < 3 or mod % 2 == 0:
			raise ValueError("Modulus must be an odd number at least 3")
		self.modulus = mod
		
		# Reducer
		self.reducerbits = (mod.bit_length() // 8 + 1) * 8  # This is a multiple of 8
		self.reducer = 1 << self.reducerbits  # This is a power of 256
		self.mask = self.reducer - 1
		assert self.reducer > mod and fractions.gcd(self.reducer, mod) == 1
		
		# Other computed numbers
		self.reciprocal = MontgomeryReducer.reciprocal_mod(self.reducer % mod, mod)
		self.factor = (self.reducer * self.reciprocal - 1) // mod
		self.convertedone = self.reducer % mod
	
	
	# The range of x is unlimited
	def convert_in(self, x):
		return (x << self.reducerbits) % self.modulus
	
	
	# The range of x is unlimited
	def convert_out(self, x):
		return (x * self.reciprocal) % self.modulus
	
	
	# Inputs and output are in Montgomery form and in the range [0, modulus)
	def multiply(self, x, y):
		mod = self.modulus
		assert 0 <= x < mod and 0 <= y < mod
		product = x * y
		temp = ((product & self.mask) * self.factor) & self.mask
		reduced = (product + temp * mod) >> self.reducerbits
		result = reduced if (reduced < mod) else (reduced - mod)
		assert 0 <= result < mod
		return result
	
	
	# Input x (base) and output (power) are in Montgomery form and in the range [0, modulus); input y (exponent) is in standard form
	def pow(self, x, y):
		assert 0 <= x < self.modulus
		if y < 0:
			raise ValueError("Negative exponent")
		z = self.convertedone
		while y != 0:
			if y & 1 != 0:
				z = self.multiply(z, x)
			x = self.multiply(x, x)
			y >>= 1
		return z
	
	
	@staticmethod
	def reciprocal_mod(x, mod):
		# Based on a simplification of the extended Euclidean algorithm
		assert mod > 0 and 0 <= x < mod
		y = x
		x = mod
		a = 0
		b = 1
		while y != 0:
			a, b = b, a - x // y * b
			x, y = y, x % y
		if x == 1:
			return a % mod
		else:
			raise ValueError("Reciprocal does not exist")



if __name__ == "__main__":
	unittest.main()
