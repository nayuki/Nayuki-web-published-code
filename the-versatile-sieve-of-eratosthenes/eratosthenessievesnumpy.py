# 
# Variants of the sieve of Eratosthenes (Python with NumPy)
# by Project Nayuki, 2017. Public domain.
# https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
# 

import numpy


# Given an integer limit, this returns a list of Booleans
# where result[k] indicates whether k is a prime number.
def sieve_primeness(limit):
	if limit < 0:
		raise ValueError("Limit must be non-negative")
	result = numpy.ones([limit + 1], dtype=numpy.bool_)
	result[0] = False
	if limit > 0:
		result[1] = False
	for i in range(2, _sqrt(limit) + 1):
		if result[i]:
			result[i * i : : i] = False
	return result


# Given an integer limit, this returns a list of integers
# where result[k] is the smallest prime factor of k.
def sieve_smallest_prime_factor(limit):
	if not (0 <= limit < 2**32 - 1):
		raise ValueError("Limit out of range")
	result = numpy.zeros([limit + 1], dtype=numpy.uint32)
	if limit > 0:
		result[1] = 1
	for i in range(2, _sqrt(limit) + 1):
		if result[i] == 0:
			result[i] = i
			temp = result[i * i : : i]
			temp[temp == 0] = i
	mask = result == 0
	result[mask] = numpy.arange(result.size, dtype=numpy.uint32)[mask]
	return result


# Given an integer limit, this returns a list of integers
# where result[k] is the totient (Euler phi function) of k.
def sieve_totient(limit):
	if not (0 <= limit < 2**32 - 1):
		raise ValueError("Limit out of range")
	result = numpy.arange(limit + 1, dtype=numpy.uint32)
	for i in range(2, len(result)):
		if result[i] == i:
			result[i : : i] -= result[i : : i] // i
	return result


# Given an integer limit, this returns a list of integers where result[k]
# is the number of unique prime factors (omega function) of k.
def sieve_omega(limit):
	if not (0 <= limit < 2**32 - 1):
		raise ValueError("Limit out of range")
	result = numpy.zeros([limit + 1], dtype=numpy.uint32)
	for i in range(2, len(result)):
		if result[i] == 0:
			result[i : : i] += 1
	return result


# Given an integer limit, this returns a list of integers where result[k]
# is the product of the unique prime factors (radical function) of k.
def sieve_radical(limit):
	if not (0 <= limit < 2**32 - 1):
		raise ValueError("Limit out of range")
	result = numpy.ones([limit + 1], dtype=numpy.uint32)
	result[0] = 0
	for i in range(2, len(result)):
		if result[i] == 1:
			result[i : : i] *= i
	return result


# (Private) Returns floor(sqrt(x)) for an integer x >= 0.
def _sqrt(x):
	y = 0
	i = 1 << (x.bit_length() // 2)
	while i > 0:
		y |= i
		if y * y > x:
			y ^= i
		i >>= 1
	return y
