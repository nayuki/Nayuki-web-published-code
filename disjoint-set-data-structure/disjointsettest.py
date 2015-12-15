# 
# Disjoint-set data structure - Test suite (Python)
# 
# Copyright (c) 2015 Project Nayuki
# http://www.nayuki.io/page/disjoint-set-data-structure
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

import random, sys
import disjointset


# ---- Test suite ----

def test_new():
	ds = disjointset.DisjointSet(10)
	assert ds.get_num_sets() == 10
	assert ds.get_size_of_set(0) == 1
	assert ds.get_size_of_set(2) == 1
	assert ds.get_size_of_set(9) == 1
	assert ds.are_in_same_set(0, 0)
	assert not ds.are_in_same_set(0, 1)
	assert not ds.are_in_same_set(9, 3)


def test_merge():
	ds = disjointset.DisjointSet(10)
	ds.merge_sets(0, 1)
	ds.check_structure()
	assert ds.get_num_sets() == 9
	assert ds.are_in_same_set(0, 1)
	
	ds.merge_sets(2, 3)
	ds.check_structure()
	assert ds.get_num_sets() == 8
	assert ds.are_in_same_set(2, 3)
	
	ds.merge_sets(2, 3)
	ds.check_structure()
	assert ds.get_num_sets() == 8
	assert not ds.are_in_same_set(0, 2)
	
	ds.merge_sets(0, 3)
	ds.check_structure()
	assert ds.get_num_sets() == 7
	assert ds.are_in_same_set(0, 2)
	assert ds.are_in_same_set(3, 0)
	assert ds.are_in_same_set(1, 3)


def test_big_merge():
	maxRank = 20
	trials = 10000
	
	numElems = 1 << maxRank  # Grows exponentially
	ds = disjointset.DisjointSet(numElems)
	for level in range(maxRank):
		mergeStep = 1 << level
		incrStep = mergeStep * 2
		for i in range(0, numElems, incrStep):
			assert not ds.are_in_same_set(i, i + mergeStep)
			assert ds.merge_sets(i, i + mergeStep)
		# Now we have a bunch of sets of size 2^(level+1)
		
		# Do random tests
		mask = -incrStep
		for i in range(trials):
			j = random.randrange(numElems)
			k = random.randrange(numElems)
			expect = (j & mask) == (k & mask)
			assert ds.are_in_same_set(j, k) == expect


def test_against_naive_randomly():
	trials = 300
	iterations = 1000
	numElems = 100
	
	for i in range(trials):
		nds = NaiveDisjointSet(numElems)
		ds = disjointset.DisjointSet(numElems)
		for j in range(iterations):
			k = random.randrange(numElems)
			l = random.randrange(numElems)
			assert ds.get_size_of_set(k) == nds.get_size_of_set(k)
			assert ds.are_in_same_set(k, l) == nds.are_in_same_set(k, l)
			if random.random() < 0.1:
				assert ds.merge_sets(k, l) == nds.merge_sets(k, l)
			assert nds.get_num_sets() == ds.get_num_sets()
			if random.random() < 0.001:
				ds.check_structure()
		ds.check_structure()


# ---- Helper class ----

class NaiveDisjointSet(object):
	def __init__(self, numElems):
		self.representatives = list(range(numElems))
	
	def get_num_sets(self):
		return sum((1 if repr == i else 0) for (i, repr) in enumerate(self.representatives))
	
	def get_size_of_set(self, elemIndex):
		repr = self.representatives[elemIndex]
		return sum((1 if r == repr else 0) for r in self.representatives)
	
	def are_in_same_set(self, elemIndex0, elemIndex1):
		return self.representatives[elemIndex0] ==  self.representatives[elemIndex1]
	
	def merge_sets(self, elemIndex0, elemIndex1):
		repr0 = self.representatives[elemIndex0]
		repr1 = self.representatives[elemIndex1]
		for i in range(len(self.representatives)):
			if self.representatives[i] == repr1:
				self.representatives[i] = repr0
		return repr0 != repr1


# ---- Main runner ----

if __name__ == "__main__":
	# Test that the 'assert' statement works
	try:
		assert False
		print("Error: Need to run with assertions enabled")
		sys.exit(1)
	except AssertionError:
		pass
	
	# Run test case functions
	test_new()
	test_merge()
	test_big_merge()
	test_against_naive_randomly()
