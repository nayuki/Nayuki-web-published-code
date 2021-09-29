# 
# Disjoint-set data structure - Library (Python)
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

import itertools
from typing import List


# Represents a set of disjoint sets. Also known as the union-find data structure.
# Main operations are querying if two elements are in the same set, and merging two sets together.
# Useful for testing graph connectivity, and is used in Kruskal's algorithm.
class DisjointSet:
	
	num_sets: int
	parents: List[int]
	sizes: List[int]
	
	
	# Constructs a new set containing the given number of singleton sets.
	# For example, DisjointSet(3) --> {{0}, {1}, {2}}.
	def __init__(self, numelems: int):
		if numelems < 0:
			raise ValueError("Number of elements must be non-negative")
		
		# A global property
		self.num_sets = 0
		
		# Per-node properties (two):
		# The index of the parent element. An element is a representative iff its parent is itself.
		self.parents = []
		# Positive number if the element is a representative, otherwise zero.
		self.sizes = []
		
		for _ in range(numelems):
			self.add_set()
	
	
	# Returns the number of elements among the set of disjoint sets. All the other methods
	# require the argument elemindex to satisfy 0 <= elemindex < get_num_elements().
	def get_num_elements(self) -> int:
		return len(self.parents)
	
	
	# Returns the number of disjoint sets overall. 0 <= result <= get_num_elements().
	def get_num_sets(self) -> int:
		return self.num_sets
	
	
	# (Private) Returns the representative element for the set containing the given element. This method is also
	# known as "find" in the literature. Also performs path compression, which alters the internal state to
	# improve the speed of future queries, but has no externally visible effect on the values returned.
	def _get_repr(self, elemindex: int) -> int:
		if not (0 <= elemindex < len(self.parents)):
			raise IndexError()
		# Follow parent pointers until we reach a representative
		parent: int = self.parents[elemindex]
		while True:
			grandparent: int = self.parents[parent]
			if grandparent == parent:
				return parent
			self.parents[elemindex] = grandparent  # Partial path compression
			elemindex = parent
			parent = grandparent
	
	
	# Returns the size of the set that the given element is a member of. 1 <= result <= get_num_elements().
	def get_size_of_set(self, elemindex: int) -> int:
		return self.sizes[self._get_repr(elemindex)]
	
	
	# Tests whether the given two elements are members of the same set. Note that the arguments are orderless.
	def are_in_same_set(self, elemindex0: int, elemindex1: int) -> bool:
		return self._get_repr(elemindex0) == self._get_repr(elemindex1)
	
	
	# Adds a new singleton set, incrementing get_num_elements() and get_num_sets().
	# Returns the identity of the new element, which equals the old value of get_num_elements().
	def add_set(self) -> int:
		elemindex = self.get_num_elements()
		self.parents.append(elemindex)
		self.sizes.append(1)
		self.num_sets += 1
		return elemindex
	
	
	# Merges together the sets that the given two elements belong to. This method is also known as "union" in the literature.
	# If the two elements belong to different sets, then the two sets are merged and the method returns True.
	# Otherwise they belong in the same set, nothing is changed and the method returns False. Note that the arguments are orderless.
	def merge_sets(self, elemindex0: int, elemindex1: int) -> bool:
		# Get representatives
		repr0: int = self._get_repr(elemindex0)
		repr1: int = self._get_repr(elemindex1)
		if repr0 == repr1:
			return False
		
		# Compare sizes to choose parent node
		if self.sizes[repr0] < self.sizes[repr1]:
			repr0, repr1 = repr1, repr0
		# Now repr0's size >= repr1's size
		
		# Graft repr1's subtree onto node repr0
		self.parents[repr1] = repr0
		self.sizes[repr0] += self.sizes[repr1]
		self.sizes[repr1] = 0
		self.num_sets -= 1
		return True
	
	
	# For unit tests. This detects many but not all invalid data structures, raising an AssertionError
	# if a structural invariant is known to be violated. This always returns silently on a valid object.
	def check_structure(self) -> None:
		numrepr: int = 0
		for (i, parent, size) in zip(
				itertools.count(), self.parents, self.sizes):
			
			isrepr: bool = parent == i
			if isrepr:
				numrepr += 1
			
			ok: bool = True
			ok &= 0 <= parent < len(self.parents)
			ok &= ((not isrepr) and size == 0) or (isrepr and 1 <= size <= len(self.parents))
			if not ok:
				raise AssertionError()
		if not (0 <= self.num_sets == numrepr <= len(self.parents)):
			raise AssertionError()
