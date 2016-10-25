# 
# Test of variants of the sieve of Eratosthenes (Python)
# by Project Nayuki, 2016. Public domain.
# https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
# 

import eratosthenessieves, sys


def main():
	test_values()
	test_prefix_consistency()


def test_values():
	assert eratosthenessieves.sieve_primeness(30) == [False, False, True, True, False, True, False, True, False, False, False, True, False, True, False, False, False, True, False, True, False, False, False, True, False, False, False, False, False, True, False]
	assert eratosthenessieves.sieve_smallest_prime_factor(30) == [0, 1, 2, 3, 2, 5, 2, 7, 2, 3, 2, 11, 2, 13, 2, 3, 2, 17, 2, 19, 2, 3, 2, 23, 2, 5, 2, 3, 2, 29, 2]
	assert eratosthenessieves.sieve_totient(30) == [0, 1, 1, 2, 2, 4, 2, 6, 4, 6, 4, 10, 4, 12, 6, 8, 8, 16, 6, 18, 8, 12, 10, 22, 8, 20, 12, 18, 12, 28, 8]
	assert eratosthenessieves.sieve_omega(30) == [0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2, 1, 3]
	assert eratosthenessieves.sieve_radical(30) == [0, 1, 2, 3, 2, 5, 6, 7, 2, 3, 10, 11, 6, 13, 14, 15, 2, 17, 6, 19, 10, 21, 22, 23, 6, 5, 26, 3, 14, 29, 30]


def test_prefix_consistency():
	N = 3000
	FUNCS = [
		eratosthenessieves.sieve_primeness,
		eratosthenessieves.sieve_smallest_prime_factor,
		eratosthenessieves.sieve_totient,
		eratosthenessieves.sieve_omega,
		eratosthenessieves.sieve_radical,
	]
	for func in FUNCS:
		prev = []
		for i in range(N):
			cur = func(i)
			assert len(cur) == len(prev) + 1
			assert cur[ : -1] == prev
			prev = cur


if __name__ == "__main__":
	try:
		assert False
		sys.exit("Error: Need to run with assertions enabled")
	except AssertionError:
		main()
