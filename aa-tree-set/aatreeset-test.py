# 
# AA tree set test (Python)
# 
# Copyright (c) 2018 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/aa-tree-set
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

import random, unittest
import aatreeset


class AaTreeSetTest(unittest.TestCase):
	
	def test_small_randomly(self):
		TRIALS = 30
		OPERATIONS = 100
		RANGE = 1000
		
		for _ in range(TRIALS):
			set0 = set()
			set1 = aatreeset.AaTreeSet()
			for _ in range(OPERATIONS):
				
				# Add/remove a random value
				val = random.randrange(RANGE)
				if random.random() < 0.001:
					set0.clear()
					set1.clear()
				elif random.random() < 0.5:
					set0.add(val)
					set1.add(val)
				else:
					set0.discard(val)
					set1.discard(val)
				set1.check_structure()
				
				# Check size and check element membership over entire range
				self.assertEqual(len(set0), len(set1))
				for k in range(-10, RANGE + 10):
					self.assertEqual(k in set0, k in set1)
	
	
	def test_large_randomly(self):
		TRIALS = 10
		OPERATIONS = 10000
		RANGE = 100000
		CHECKS = 10
		
		for _ in range(TRIALS):
			set0 = set()
			set1 = aatreeset.AaTreeSet()
			for _ in range(OPERATIONS):
				
				# Add/remove a random value
				val = random.randrange(RANGE)
				if random.random() < 0.5:
					set0.add(val)
					set1.add(val)
				else:
					set0.discard(val)
					set1.discard(val)
				
				# Check size and random element membership
				self.assertEqual(len(set0), len(set1))
				for _ in range(CHECKS):
					val = random.randrange(-50, RANGE + 50)
					self.assertEqual(val in set0, val in set1)
				
				# Occasionally check entire set and iterator
				if random.random() < 0.001:
					set1.check_structure()
					self.assertEqual(sorted(list(set0)), list(set1))
	
	
	def test_insert_randomly(self):
		TRIALS = 30
		OPERATIONS = 3000
		RANGE = 100000
		CHECKS = 10
		
		for _ in range(TRIALS):
			set0 = set()
			set1 = aatreeset.AaTreeSet()
			for _ in range(OPERATIONS):
				
				# Add a random value
				val = random.randrange(RANGE)
				set0.add(val)
				set1.add(val)
				if random.random() < 0.003:
					set1.check_structure()
				
				# Check size and random element membership
				self.assertEqual(len(set0), len(set1))
				for _ in range(CHECKS):
					val = random.randrange(-50, RANGE + 50)
					self.assertEqual(val in set0, val in set1)
	
	
	def test_iterator(self):
		SIZE = 1000
		set = aatreeset.AaTreeSet()
		for i in range(SIZE):
			set.add(i**2)
			lst = list(set)
			self.assertEqual(i + 1, len(lst))
			expect = [j**2 for j in range(len(lst))]
			self.assertEqual(expect, lst)
	
	
	def test_ascending_operations(self):
		SIZE = 30000
		CHECKS = 10
		set = aatreeset.AaTreeSet()
		for i in range(SIZE):
			self.assertEqual(i, len(set))
			set.add(i)
			for _ in range(CHECKS):
				val = random.randrange(-50, i + 50)
				self.assertEqual(0 <= val <= i, val in set)
		for i in range(SIZE):
			self.assertEqual(SIZE - i, len(set))
			set.remove(i)
			for _ in range(CHECKS):
				val = random.randrange(-50, i + 50)
				self.assertEqual(i < val < SIZE, val in set)
		self.assertEqual(0, len(set))
	
	
	def test_descending_operations(self):
		SIZE = 30000
		CHECKS = 10
		set = aatreeset.AaTreeSet()
		for i in range(SIZE):
			self.assertEqual(i, len(set))
			set.add(-i)
			for _ in range(CHECKS):
				val = -random.randrange(-50, i + 50)
				self.assertEqual(-i <= val <= 0, val in set)
		for i in range(SIZE):
			self.assertEqual(SIZE - i, len(set))
			set.remove(-i)
			for _ in range(CHECKS):
				val = -random.randrange(-50, i + 50)
				self.assertEqual(-SIZE < val < -i, val in set)
		self.assertEqual(0, len(set))
	
	
	def test_all_insertion_orders(self):
		LIMIT = 8
		for size in range(1, LIMIT + 1):
			sortedvalues = list(range(size))
			values = list(sortedvalues)
			
			while True:  # This runs factorial(size) iterations
				set = aatreeset.AaTreeSet(values)
				set.check_structure()
				self.assertEqual(sortedvalues, list(set))
				if not _next_permutation(values):
					break
	
	
	def test_remove_all_randomly(self):
		TRIALS = 10
		LIMIT = 1000
		RANGE = 100000
		CHECKS = 10
		
		for _ in range(TRIALS):
			# Create sets and add all values
			set0 = set()
			set1 = aatreeset.AaTreeSet()
			for _ in range(LIMIT):
				val = random.randrange(RANGE)
				set0.add(val)
				set1.add(val)
			set1.check_structure()
			
			# Remove each value in random order
			lst = list(set0)
			random.shuffle(lst)
			for val in lst:
				set0.remove(val)
				set1.remove(val)
				if random.random() < max(1.0 / max(len(set1), 1), 0.001):
					set1.check_structure()
				self.assertEqual(len(set0), len(set1))
				for _ in range(CHECKS):
					val = random.randrange(-50, RANGE + 50)
					self.assertEqual(val in set0, val in set1)
			self.assertTrue(len(set0) == len(set1) == 0)


# Algorithm from https://www.nayuki.io/res/next-lexicographical-permutation-algorithm
def _next_permutation(arr):
	i = len(arr) - 1
	while i > 0 and arr[i - 1] >= arr[i]:
		i -= 1
	if i <= 0:
		return False
	j = len(arr) - 1
	while arr[j] <= arr[i - 1]:
		j -= 1
	arr[i - 1], arr[j] = arr[j], arr[i - 1]
	arr[i : ] = arr[len(arr) - 1 : i - 1 : -1]
	return True



if __name__ == "__main__":
	unittest.main()
