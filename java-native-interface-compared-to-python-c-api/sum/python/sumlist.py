# 
# Sum list (Python version)
# 
# Copyright (c) 2016 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/java-native-interface-compared-to-python-c-api
# 

import sumlist_native


# Calls a native function and prints the result to standard output.
def main():
	data = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3]
	n = sumlist_native.get_sum32(data)
	if n >= (1 << 31):  # Convert from uint32 to int32 to match Java int
		n -= 1 << 32
	print("The sum is " + str(n))


if __name__ == "__main__":
	main()
