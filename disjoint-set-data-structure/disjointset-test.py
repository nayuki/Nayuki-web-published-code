# 
# Disjoint-set data structure - Test suite (Python)
# 
# Copyright (c) 2021 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/disjoint-set-data-structure
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
from disjointset import DisjointSet


# ---- Test suite ----

class DisjointSetTest(unittest.TestCase):
	
	def test_new(self):
		ds = DisjointSet(10)
		self.assertEqual(ds.get_num_sets(), 10)
		self.assertEqual(ds.get_size_of_set(0), 1)
		self.assertEqual(ds.get_size_of_set(2), 1)
		self.assertEqual(ds.get_size_of_set(9), 1)
		self.assertTrue(ds.are_in_same_set(0, 0))
		self.assertFalse(ds.are_in_same_set(0, 1))
		self.assertFalse(ds.are_in_same_set(9, 3))
	
	
	def test_merge(self):
		ds = DisjointSet(10)
		self.assertTrue(ds.merge_sets(0, 1))
		ds.check_structure()
		self.assertEqual(ds.get_num_sets(), 9)
		self.assertTrue(ds.are_in_same_set(0, 1))
		
		self.assertTrue(ds.merge_sets(2, 3))
		ds.check_structure()
		self.assertEqual(ds.get_num_sets(), 8)
		self.assertTrue(ds.are_in_same_set(2, 3))
		
		self.assertFalse(ds.merge_sets(2, 3))
		ds.check_structure()
		self.assertEqual(ds.get_num_sets(), 8)
		self.assertFalse(ds.are_in_same_set(0, 2))
		
		self.assertTrue(ds.merge_sets(0, 3))
		ds.check_structure()
		self.assertEqual(ds.get_num_sets(), 7)
		self.assertTrue(ds.are_in_same_set(0, 2))
		self.assertTrue(ds.are_in_same_set(3, 0))
		self.assertTrue(ds.are_in_same_set(1, 3))
	
	
	def test_big_merge(self):
		maxRank = 20
		trials = 10000
		
		numElems = 1 << maxRank  # Grows exponentially
		ds = DisjointSet(numElems)
		for level in range(maxRank):
			mergeStep = 1 << level
			incrStep = mergeStep * 2
			for i in range(0, numElems, incrStep):
				self.assertFalse(ds.are_in_same_set(i, i + mergeStep))
				self.assertTrue(ds.merge_sets(i, i + mergeStep))
			# Now we have a bunch of sets of size 2^(level+1)
			
			# Do random tests
			mask = -incrStep
			for i in range(trials):
				j = random.randrange(numElems)
				k = random.randrange(numElems)
				expect = (j & mask) == (k & mask)
				self.assertTrue(ds.are_in_same_set(j, k) == expect)
	
	
	def test_against_naive_randomly(self):
		trials = 300
		iterations = 1000
		numElems = 100
		
		for _ in range(trials):
			nds = NaiveDisjointSet(numElems)
			ds = DisjointSet(numElems)
			for _ in range(iterations):
				i = random.randrange(numElems)
				j = random.randrange(numElems)
				self.assertEqual(ds.get_size_of_set(i), nds.get_size_of_set(i))
				self.assertTrue(ds.are_in_same_set(i, j) == nds.are_in_same_set(i, j))
				if random.random() < 0.1:
					self.assertTrue(ds.merge_sets(i, j) == nds.merge_sets(i, j))
				self.assertEqual(ds.get_num_sets(), nds.get_num_sets())
				if random.random() < 0.001:
					ds.check_structure()
			ds.check_structure()



# ---- Helper class ----

class NaiveDisjointSet:
	def __init__(self, numelems):
		self.representatives = list(range(numelems))
	
	def get_num_sets(self):
		return sum(1 for (i, repr) in enumerate(self.representatives) if repr == i)
	
	def get_size_of_set(self, elemindex):
		repr = self.representatives[elemindex]
		return sum(1 for r in self.representatives if r == repr)
	
	def are_in_same_set(self, elemindex0, elemindex1):
		return self.representatives[elemindex0] ==  self.representatives[elemindex1]
	
	def merge_sets(self, elemindex0, elemindex1):
		repr0 = self.representatives[elemindex0]
		repr1 = self.representatives[elemindex1]
		self.representatives = [(repr0 if (rp == repr1) else rp) for rp in self.representatives]
		return repr0 != repr1



# ---- Main runner ----

if __name__ == "__main__":
	unittest.main()
