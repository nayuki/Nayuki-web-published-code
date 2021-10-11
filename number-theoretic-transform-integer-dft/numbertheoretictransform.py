# 
# Number-theoretic transform library (Python)
# 
# Copyright (c) 2021 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/number-theoretic-transform-integer-dft
# 

import itertools
from typing import List, Tuple


# ---- High-level NTT functions ----

# Finds an appropriate set of parameters for the NTT, computes the forward transform on
# the given vector, and returns a tuple containing the output vector and NTT parameters.
# Note that all input values must be integers in the range [0, minmod).
def find_params_and_transform(invec: List[int], minmod: int) -> Tuple[List[int],int,int]:
	mod: int = find_modulus(len(invec), minmod)
	root: int = find_primitive_root(len(invec), mod - 1, mod)
	return (transform(invec, root, mod), root, mod)


# Returns the forward number-theoretic transform of the given vector with
# respect to the given primitive nth root of unity under the given modulus.
def transform(invec: List[int], root: int, mod: int) -> List[int]:
	if len(invec) >= mod:
		raise ValueError()
	if not all((0 <= val < mod) for val in invec):
		raise ValueError()
	if not (1 <= root < mod):
		raise ValueError()
	
	outvec: List[int] = []
	for i in range(len(invec)):
		temp: int = 0
		for (j, val) in enumerate(invec):
			temp += val * pow(root, i * j, mod)
			temp %= mod
		outvec.append(temp)
	return outvec


# Returns the inverse number-theoretic transform of the given vector with
# respect to the given primitive nth root of unity under the given modulus.
def inverse_transform(invec: List[int], root: int, mod: int) -> List[int]:
	outvec: List[int] = transform(invec, reciprocal(root, mod), mod)
	scaler: int = reciprocal(len(invec), mod)
	return [(val * scaler % mod) for val in outvec]


# Computes the forward number-theoretic transform of the given vector in place,
# with respect to the given primitive nth root of unity under the given modulus.
# The length of the vector must be a power of 2.
def transform_radix_2(vector: List[int], root: int, mod: int) -> None:
	n: int = len(vector)
	levels: int = n.bit_length() - 1
	if 1 << levels != n:
		raise ValueError("Length is not a power of 2")
	
	def reverse(x: int, bits: int) -> int:
		y: int = 0
		for i in range(bits):
			y = (y << 1) | (x & 1)
			x >>= 1
		return y
	for i in range(n):
		j: int = reverse(i, levels)
		if j > i:
			vector[i], vector[j] = vector[j], vector[i]
	
	powtable: List[int] = []
	temp: int = 1
	for i in range(n // 2):
		powtable.append(temp)
		temp = temp * root % mod
	
	size: int = 2
	while size <= n:
		halfsize: int = size // 2
		tablestep: int = n // size
		for i in range(0, n, size):
			k: int = 0
			for j in range(i, i + halfsize):
				l: int = j + halfsize
				left: int = vector[j]
				right: int = vector[l] * powtable[k]
				vector[j] = (left + right) % mod
				vector[l] = (left - right) % mod
				k += tablestep
		size *= 2


# Returns the circular convolution of the given vectors of integers.
# All values must be non-negative. Internally, a sufficiently large modulus
# is chosen so that the convolved result can be represented without overflow.
def circular_convolve(vec0: List[int], vec1: List[int]) -> List[int]:
	if not (0 < len(vec0) == len(vec1)):
		raise ValueError()
	if any((val < 0) for val in itertools.chain(vec0, vec1)):
		raise ValueError()
	maxval: int = max(val for val in itertools.chain(vec0, vec1))
	minmod: int = maxval**2 * len(vec0) + 1
	temp0, root, mod = find_params_and_transform(vec0, minmod)
	temp1: List[int] = transform(vec1, root, mod)
	temp2: List[int] = [(x * y % mod) for (x, y) in zip(temp0, temp1)]
	return inverse_transform(temp2, root, mod)



# ---- Mid-level number theory functions for NTT ----

# Returns the smallest modulus mod such that mod = i * veclen + 1
# for some integer i >= 1, mod > veclen, and mod is prime.
# Although the loop might run for a long time and create arbitrarily large numbers,
# Dirichlet's theorem guarantees that such a prime number must exist.
def find_modulus(veclen: int, minimum: int) -> int:
	if veclen < 1 or minimum < 1:
		raise ValueError()
	start: int = (minimum - 1 + veclen - 1) // veclen
	for i in itertools.count(max(start, 1)):
		n: int = i * veclen + 1
		assert n >= minimum
		if is_prime(n):
			return n
	raise AssertionError("Unreachable")


# Returns an arbitrary generator of the multiplicative group of integers modulo mod.
# totient must equal the Euler phi function of mod. If mod is prime, an answer must exist.
def find_generator(totient: int, mod: int) -> int:
	if not (1 <= totient < mod):
		raise ValueError()
	for i in range(1, mod):
		if is_generator(i, totient, mod):
			return i
	raise ValueError("No generator exists")


# Returns an arbitrary primitive degree-th root of unity modulo mod.
# totient must be a multiple of degree. If mod is prime, an answer must exist.
def find_primitive_root(degree: int, totient: int, mod: int) -> int:
	if not (1 <= degree <= totient < mod):
		raise ValueError()
	if totient % degree != 0:
		raise ValueError()
	gen: int = find_generator(totient, mod)
	root: int = pow(gen, totient // degree, mod)
	assert 0 <= root < mod
	return root


# Tests whether val generates the multiplicative group of integers modulo mod. totient
# must equal the Euler phi function of mod. In other words, the set of numbers
# {val^0 % mod, val^1 % mod, ..., val^(totient-1) % mod} is equal to the set of all
# numbers in the range [0, mod) that are coprime to mod. If mod is prime, then
# totient = mod - 1, and powers of a generator produces all integers in the range [1, mod).
def is_generator(val: int, totient: int, mod: int) -> bool:
	if not (0 <= val < mod):
		raise ValueError()
	if not (1 <= totient < mod):
		raise ValueError()
	pf: List[int] = unique_prime_factors(totient)
	return pow(val, totient, mod) == 1 and \
		all((pow(val, totient // p, mod) != 1) for p in pf)


# Tests whether val is a primitive degree-th root of unity modulo mod.
# In other words, val^degree % mod = 1, and for each 1 <= k < degree, val^k % mod != 1.
def is_primitive_root(val: int, degree: int, mod: int) -> bool:
	if not (0 <= val < mod):
		raise ValueError()
	if not (1 <= degree < mod):
		raise ValueError()
	pf: List[int] = unique_prime_factors(degree)
	return pow(val, degree, mod) == 1 and \
		all((pow(val, degree // p, mod) != 1) for p in pf)



# ---- Low-level common number theory functions ----

# Returns the multiplicative inverse of n modulo mod. The inverse x has the property that
# 0 <= x < mod and (x * n) % mod = 1. The inverse exists if and only if gcd(n, mod) = 1.
def reciprocal(n: int, mod: int) -> int:
	if not (0 <= n < mod):
		raise ValueError()
	x, y = mod, n
	a, b = 0, 1
	while y != 0:
		a, b = b, a - x // y * b
		x, y = y, x % y
	if x == 1:
		return a % mod
	else:
		raise ValueError("Reciprocal does not exist")


# Returns a list of unique prime factors of the given integer in
# ascending order. For example, unique_prime_factors(60) = [2, 3, 5].
def unique_prime_factors(n: int) -> List[int]:
	if n < 1:
		raise ValueError()
	result: List[int] = []
	i: int = 2
	end: int = sqrt(n)
	while i <= end:
		if n % i == 0:
			n //= i
			result.append(i)
			while n % i == 0:
				n //= i
			end = sqrt(n)
		i += 1
	if n > 1:
		result.append(n)
	return result


# Tests whether the given integer n >= 2 is a prime number.
def is_prime(n: int) -> bool:
	if n <= 1:
		raise ValueError()
	return all((n % i != 0) for i in range(2, sqrt(n) + 1))


# Returns floor(sqrt(n)) for the given integer n >= 0.
def sqrt(n: int) -> int:
	if n < 0:
		raise ValueError()
	i: int = 1
	while i * i <= n:
		i *= 2
	result: int = 0
	while i > 0:
		if (result + i)**2 <= n:
			result += i
		i //= 2
	return result
