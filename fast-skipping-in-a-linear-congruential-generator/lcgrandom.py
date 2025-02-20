# 
# Linear congruential generator (LCG) with fast skipping and backward iteration (Python)
# 
# Copyright (c) 2025 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/fast-skipping-in-a-linear-congruential-generator
# 

import random, unittest


# ---- Library ----

class LcgRandom(random.Random):  # Implements most functionality of random.Random
	
	def __new__(cls, *args, **kwargs):  # Magic because the superclass doesn't cooperate
		return random.Random.__new__(cls, random.random())
	
	
	def __init__(self, a: int, b: int, m: int, seed: int):
		assert a > 0
		assert b >= 0
		assert m > 0
		assert 0 <= seed < m
		
		self.a = a     # Multiplier
		self.ainv = pow(a, -1, m)
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
		if n >= 0:
			a: int = self.a
			b: int = self.b
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



# ---- Test suite ----

class LcgRandomTest(unittest.TestCase):
	
	def test_skip_forward(self) -> None:
		ITERS: int = 10000
		randslow: LcgRandom = LcgRandomTest.new_lcg_random()
		for i in range(ITERS):
			randfast: LcgRandom = LcgRandomTest.new_lcg_random()
			randfast.skip(i)
			self.assertEqual(randfast.get_state(), randslow.get_state())
			randslow.next()
	
	
	def test_iterate_backward(self) -> None:
		ITERS: int = 10000
		randslow: LcgRandom = LcgRandomTest.new_lcg_random()
		randslow.skip(ITERS)
		for i in reversed(range(ITERS)):
			randslow.previous()
			randfast: LcgRandom = LcgRandomTest.new_lcg_random()
			randfast.skip(i)
			self.assertEqual(randslow.get_state(), randfast.get_state())
	
	
	def test_skip_backward(self) -> None:
		ITERS: int = 10000
		randslow: LcgRandom = LcgRandomTest.new_lcg_random()
		for i in range(ITERS):
			randfast: LcgRandom = LcgRandomTest.new_lcg_random()
			randfast.skip(-i)
			self.assertEqual(randfast.get_state(), randslow.get_state())
			randslow.previous()
	
	
	modulus: int = 2**48
	seed: int
	
	@staticmethod
	def new_lcg_random() -> LcgRandom:
		# Use the parameters from Java's LCG RNG
		return LcgRandom(a=25214903917, b=11, m=LcgRandomTest.modulus, seed=LcgRandomTest.seed)

LcgRandomTest.seed = random.randrange(LcgRandomTest.modulus)



if __name__ == "__main__":
	unittest.main()
