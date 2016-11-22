# 
# Variants of the sieve of Eratosthenes (Python)
# by Project Nayuki, 2016. Public domain.
# https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
# 


# Given an integer limit, this returns a list of Booleans
# where result[k] indicates whether k is a prime number.
def sieve_primeness(limit):
	if limit < 0:
		raise ValueError("Limit must be non-negative")
	result = [True] * (limit + 1)
	result[0] = False
	if limit > 0:
		result[1] = False
	for i in range(2, len(result)):
		if result[i]:
			for j in range(i * i, len(result), i):
				result[j] = False
	return result


# Given an integer limit, this returns a list of integers
# where result[k] is the smallest prime factor of k.
def sieve_smallest_prime_factor(limit):
	if limit < 0:
		raise ValueError("Limit must be non-negative")
	result = [0] * (limit + 1)
	if limit > 0:
		result[1] = 1
	for i in range(2, len(result)):
		if result[i] == 0:
			result[i] = i
			for j in range(i * i, len(result), i):
				if result[j] == 0:
					result[j] = i
	return result


# Given an integer limit, this returns a list of integers
# where result[k] is the totient (Euler phi function) of k.
def sieve_totient(limit):
	if limit < 0:
		raise ValueError("Limit must be non-negative")
	result = list(range(limit + 1))
	for i in range(2, len(result)):
		if result[i] == i:
			for j in range(i, len(result), i):
				result[j] -= result[j] // i
	return result


# Given an integer limit, this returns a list of integers where result[k]
# is the number of unique prime factors (omega function) of k.
def sieve_omega(limit):
	if limit < 0:
		raise ValueError("Limit must be non-negative")
	result = [0] * (limit + 1)
	for i in range(2, len(result)):
		if result[i] == 0:
			for j in range(i, len(result), i):
				result[j] += 1
	return result


# Given an integer limit, this returns a list of integers where result[k]
# is the product of the unique prime factors (radical function) of k.
def sieve_radical(limit):
	if limit < 0:
		raise ValueError("Limit must be non-negative")
	result = [1] * (limit + 1)
	result[0] = 0
	for i in range(2, len(result)):
		if result[i] == 1:
			for j in range(i, len(result), i):
				result[j] *= i
	return result
