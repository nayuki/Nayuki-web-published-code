# 
# Create dict (Python version)
# 
# Copyright (c) 2020 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/java-native-interface-compared-to-python-c-api
# 

import createdict_native


# Calls a native function and prints the result to standard output.
def main():
	data = createdict_native.create_dict(30)
	for (key, val) in sorted(data.items()):
		print(f"{key} -> {val}")


# Tests whether the given integer is a prime number. Called by the native function.
def is_prime(n):
	return n > 1 and all(n % i != 0 for i in range(2, n))


if __name__ == "__main__":
	main()
