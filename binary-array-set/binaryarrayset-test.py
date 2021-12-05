# 
# Binary array set test (Python)
# 
# Copyright (c) 2021 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/binary-array-set
# 
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

import itertools, random, unittest
from binaryarrayset import BinaryArraySet


class BinaryArraySetTest(unittest.TestCase):
	
	def test_blank(self):
		s = BinaryArraySet()
		self.assertFalse(0 in s)
		self.assertFalse(-5 in s)
		self.assertFalse(2 in s)
	
	
	def test_construct_from_existing(self):
		s = BinaryArraySet([1, 5, 5, 8])
		self.assertEqual(3, len(s))
		self.assertTrue(1 in s)
		self.assertTrue(5 in s)
		self.assertTrue(8 in s)
		self.assertFalse(-2 in s)
		self.assertFalse(0 in s)
		self.assertFalse(4 in s)
		self.assertFalse(9 in s)
	
	
	def test_add_0(self):
		s = BinaryArraySet()
		for i in range(1, 101):
			s.add(i - 1)
			self.assertEqual(i, len(s))
			self.assertFalse(-7 in s)
			self.assertFalse(-1 in s)
			for j in range(i):
				self.assertTrue(j in s)
			for j in range(i, i + 10):
				self.assertFalse(j in s)
	
	
	def test_add_1(self):
		def is_perfect_square(n):
			for i in itertools.count():
				ii = i * i
				if ii == n:
					return True
				elif ii > n:
					return False
		
		s = BinaryArraySet()
		for i in range(1, 31):
			s.add((i - 1)**2)
			for j in range(-3, i**2 + 5):
				self.assertEqual(j in s, j <= (i - 1)**2 and is_perfect_square(j))
	
	
	def test_iterator(self):
		s = BinaryArraySet()
		for i in range(1, 101):
			s.add((i - 1)**2)
			
			lst = sorted(list(s))
			self.assertEqual(i, len(lst))
			
			for j in range(i):
				self.assertEqual(j**2, lst[j])
	
	
	# Comprehensively tests all the defined methods
	def test_against_python_set_randomly(self):
		ITERATIONS = 10000
		set0 = set()
		set1 = BinaryArraySet()
		length = 0
		for i in range(ITERATIONS):
			if i % 300 == 0:
				print(f"Progress: {i / ITERATIONS:.0%}")
			op = random.randrange(100)
			
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
				self.assertEqual(sorted(set0), sorted(set1))
				
			elif op < 70:  # Add
				n = random.randint(1, 100)
				for j in range(n):
					val = random.randrange(10000)
					if val not in set0:
						length += 1
					set0.add(val)
					set1.add(val)
				
			elif op < 100:  # Contains
				n = random.randint(1, 100)
				for j in range(n):
					val = random.randrange(10000)
					self.assertEqual(val in set0, val in set1)
				
			else:
				raise AssertionError()
			
			self.assertEqual(len(set0), len(set1))



if __name__ == "__main__":
	unittest.main()
