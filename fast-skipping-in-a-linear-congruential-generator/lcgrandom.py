# 
# Linear congruential generator (LCG) with fast skipping and backward iteration (Python)
# 
# Copyright (c) 2021 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/fast-skipping-in-a-linear-congruential-generator
# 

import random, time


# ---- Demo main program, which runs a correctness check ----

def main() -> None:
	# Use the parameters from Java's LCG RNG
	A: int = 25214903917
	B: int = 11
	M: int = 2**48
	
	# Choose seed and create LCG RNG
	seed: int = random.randrange(M)
	randslow = LcgRandom(A, B, M, seed)
	
	# Start testing
	N: int = 10000
	
	# Check that skipping forward is correct
	for i in range(N):
		randfast = LcgRandom(A, B, M, seed)
		randfast.skip(i)
		if randslow.get_state() != randfast.get_state():
			raise AssertionError()
		randslow.next()
	
	# Check that backward iteration is correct
	for i in reversed(range(N)):
		randslow.previous()
		randfast = LcgRandom(A, B, M, seed)
		randfast.skip(i)
		if randslow.get_state() != randfast.get_state():
			raise AssertionError()
	
	# Check that backward skipping is correct
	for i in range(N):
		randfast = LcgRandom(A, B, M, seed)
		randfast.skip(-i)
		if randslow.get_state() != randfast.get_state():
			raise AssertionError()
		randslow.previous()
	
	print(f"Test passed (n={N})")



# ---- Random number generator class (implements most functionality of random.Random) ----

class LcgRandom(random.Random):
	
	def __new__(cls, *args, **kwargs):  # Magic because the superclass doesn't cooperate
		return random.Random.__new__(cls, random.random())
	
	
	def __init__(self, a: int, b: int, m: int, seed: int):
		assert isinstance(a, int) and a > 0
		assert isinstance(b, int) and b >= 0
		assert isinstance(m, int) and m > 0
		assert isinstance(seed, int) and 0 <= seed < m
		
		self.a = a     # Multiplier
		self.ainv = LcgRandom.reciprocal_mod(a, m)
		self.b = b     # Increment
		self.m = m     # Modulus
		self.x = seed  # State
	
	
	# Returns the raw state, with 0 <= x < m. To get a pseudorandom number
	# with a certain distribution, the value needs to be further processed.
	def get_state(self) -> int:
		return self.x
	
	
	# Advances the state by one iteration.
	def next(self) -> None:
		self.x = (self.x * self.a + self.b) % self.m
	
	
	# Rewinds the state by one iteration.
	def previous(self) -> None:
		# The intermediate result after subtracting 'b' may be
		# negative, but the modular arithmetic is correct
		self.x = (self.x - self.b) * self.ainv % self.m
	
	
	# Advances/rewinds the state by the given number of iterations.
	def skip(self, n: int) -> None:
		a: int
		b: int
		if n >= 0:
			a = self.a
			b = self.b
		else:
			a = self.ainv
			b = -self.ainv * self.b
			n = -n
		a1: int = a - 1
		ma: int = a1 * self.m
		y: int = (pow(a, n, ma) - 1) // a1 * b
		z: int = pow(a, n, self.m) * self.x
		self.x = (y + z) % self.m
	
	
	# Quite inefficient, but accommodates arbitrarily small
	# or big moduli, and moduli that are not powers of 2
	def randbit(self) -> bool:
		self.next()
		return self.x >= (self.m >> 1)
	
	
	# Implements a method in class random.Random.
	def getrandbits(self, k: int) -> int:
		result: int = 0
		for _ in range(k):
			result = (result << 1) | self.randbit()
		return result
	
	
	# Implements a method in class random.Random.
	def random(self) -> float:
		return self.getrandbits(52) / (1 << 52)
	
	
	@staticmethod
	def reciprocal_mod(x: int, mod: int) -> int:
		# Based on a simplification of the extended Euclidean algorithm
		assert 0 <= x < mod
		x, y = mod, x
		a, b = 0, 1
		while y != 0:
			a, b = b, a - x // y * b
			x, y = y, x % y
		if x == 1:
			return a % mod
		else:
			raise ValueError("Reciprocal does not exist")



if __name__ == "__main__":
	main()
