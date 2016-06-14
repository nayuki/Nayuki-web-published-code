# 
# Barrett reduction algorithm (Python)
# 
# Copyright (c) 2016 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/barrett-reduction-algorithm
# 

import random


def main():
	print("Self-check...")
	for i in range(10000):
		mod = random_modulus()
		modsqr = mod**2
		br = BarrettReducer(mod)
		for j in range(100):
			x = random.randrange(modsqr)
			if br.reduce(x) != x % mod:
				raise AssertionError()


def random_modulus():
	bitlen = random.randint(2, 100)
	return random.randint((1 << bitlen) + 1, (2 << bitlen) - 1)



class BarrettReducer(object):
	
	def __init__(self, mod):
		if mod <= 0:
			raise ValueError("Modulus must be positive")
		if mod & (mod - 1) == 0:
			raise ValueError("Modulus must not be a power of 2")
		self.modulus = mod
		self.shift = mod.bit_length() * 2
		self.factor = (1 << self.shift) // mod
	
	
	# For x in [0, mod^2), this returns x % mod.
	def reduce(self, x):
		mod = self.modulus
		assert 0 <= x < mod**2
		t = (x - ((x * self.factor) >> self.shift) * mod)
		return t if (t < mod) else (t - mod)



if __name__ == "__main__":
	main()
