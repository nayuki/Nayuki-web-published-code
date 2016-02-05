# 
# Binary array set test (Python)
# 
# Copyright (c) 2014 Project Nayuki
# https://www.nayuki.io/page/binary-array-set
# 
# (MIT License)
# Permission is hereby granted, free of charge, to any person obtaining a copy of
# this software and associated documentation files (the "Software"), to deal in
# the Software without restriction, including without limitation the rights to
# use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
# the Software, and to permit persons to whom the Software is furnished to do so,
# subject to the following conditions:
# - The above copyright notice and this permission notice shall be included in
#   all copies or substantial portions of the Software.
# - The Software is provided "as is", without warranty of any kind, express or
#   implied, including but not limited to the warranties of merchantability,
#   fitness for a particular purpose and noninfringement. In no event shall the
#   authors or copyright holders be liable for any claim, damages or other
#   liability, whether in an action of contract, tort or otherwise, arising from,
#   out of or in connection with the Software or the use or other dealings in the
#   Software.
# 

import random
import binaryarrayset


# Comprehensively tests all the defined methods against Python's built-in set class
def main():
	ITERATIONS = 10000
	set0 = set()
	set1 = binaryarrayset.BinaryArraySet()
	length = 0
	for i in range(ITERATIONS):
		if i % 300 == 0:
			print("Progress: {:.0%}".format(float(i) / ITERATIONS))
		op = random.randint(0, 99)
		
		if op < 1:  # Fast clear
			set1.check_structure()
			set0.clear()
			set1.clear()
			length = 0
			
		elif op < 2:  # Clear with iterator and removal
			set1.check_structure()
			for val in set1:
				set0.remove(val)
			set1.clear()
			length = 0
			
		elif op < 3:  # Check iterator fully
			if sorted(set1) != sorted(set0):
				raise AssertionError()
			
		elif op < 70:  # Add
			n = random.randint(1, 100)
			for j in range(n):
				val = random.randint(0, 9999)
				if val not in set0:
					length += 1
				set0.add(val)
				set1.add(val)
			
		elif op < 100:  # Contains
			n = random.randint(1, 100)
			for j in range(n):
				val = random.randint(0, 9999)
				if (val in set1) != (val in set0):
					raise AssertionError()
			
		else:
			raise AssertionError()
		
		if len(set0) != length or len(set1) != length:
			raise AssertionError()
	
	print("Test passed")


if __name__ == "__main__":
	main()
