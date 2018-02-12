# 
# B-tree set test (Python)
# 
# Copyright (c) 2018 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/btree-set
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
import btreeset


class BTreeSetTest(unittest.TestCase):
	
	def test_small_randomly(self):
		TRIALS = 30
		OPERATIONS = 100
		VALRANGE = 1000
		for _ in range(TRIALS):
			set0 = set()
			set1 = btreeset.BTreeSet(random.randrange(5) + 2)
			for _ in range(OPERATIONS):
				# Add/remove a random value
				val = random.randrange(VALRANGE)
				if random.random() < 0.5:
					set0.add(val)
					set1.add(val)
				else:
					set0.discard(val)
					set1.discard(val)
				set1.check_structure()
				
				# Check size and check element membership over entire range
				self.assertEqual(len(set0), len(set1))
				for k in range(-4, VALRANGE + 4):
					self.assertEqual(k in set0, k in set1)
	
	
	def test_insert_randomly(self):
		TRIALS = 30
		OPERATIONS = 10000
		VALRANGE = 100000
		CHECKS = 10
		for _ in range(TRIALS):
			set0 = set()
			set1 = btreeset.BTreeSet(2)
			for _ in range(OPERATIONS):
				# Add a random value
				val = random.randrange(VALRANGE)
				if random.random() < 0.003:
					set1.check_structure()
				
				# Check size and random element membership
				self.assertEqual(len(set0), len(set1))
				for _ in range(CHECKS):
					val = random.randrange(VALRANGE)
					self.assertEqual(val in set0, val in set1)
	
	
	def test_large_randomly(self):
		TRIALS = 10
		OPERATIONS = 10000
		VALRANGE = 100000
		CHECKS = 10
		for _ in range(TRIALS):
			set0 = set()
			set1 = btreeset.BTreeSet(random.randrange(5) + 2)
			for _ in range(OPERATIONS):
				# Add/remove a random value
				val = random.randrange(VALRANGE)
				if random.random() < 0.5:
					set0.add(val)
					set1.add(val)
				else:
					set0.discard(val)
					set1.discard(val)
				if random.random() < 0.001:
					set1.check_structure()
				
				# Check size and random element membership
				self.assertEqual(len(set0), len(set1))
				for _ in range(CHECKS):
					val = random.randrange(VALRANGE)
					self.assertEqual(val in set0, val in set1)
	
	
	def test_remove_all_randomly(self):
		TRIALS = 10
		LIMIT = 10000
		VALRANGE = 100000
		CHECKS = 10
		for _ in range(TRIALS):
			# Create sets and add all values
			set0 = set(random.randrange(VALRANGE) for _ in range(LIMIT))
			set1 = btreeset.BTreeSet(random.randrange(5) + 2, set0)
			set1.check_structure()
			
			# Incrementally remove each value
			lst = list(set0)
			random.shuffle(lst)
			for val in lst:
				set0.discard(val)
				set1.discard(val)
				if random.random() < 1.0 / min(max(len(set1), 1), 1000):
					set1.check_structure()
				self.assertEqual(len(set0), len(set1))
				for _ in range(CHECKS):
					val = random.randrange(VALRANGE)
					self.assertEqual(val in set0, val in set1)
	
	
	def test_iterator_randomly(self):
		TRIALS = 1000
		OPERATIONS = 1000
		VALRANGE = 10000
		for _ in range(TRIALS):
			set0 = set()
			set1 = btreeset.BTreeSet(random.randrange(5) + 2)
			
			numinsert = random.randrange(OPERATIONS)
			for _ in range(numinsert):
				val = random.randrange(VALRANGE)
				set0.add(val)
				set1.add(val)
			self.assertEqual(set0, set(set1))
			
			numremove = random.randrange(len(set0) + 1)
			for val in random.sample(set0, numremove):
				set0.remove(val)
				set1.remove(val)
			self.assertEqual(set0, set(set1))



if __name__ == "__main__":
	unittest.main()
