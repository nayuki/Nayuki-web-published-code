# 
# Binary indexed tree test (Python)
# 
# Copyright (c) 2021 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/binary-indexed-tree
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
from typing import List, Tuple
from binaryindexedtree import BinaryIndexedTree


class BinaryIndexedTreeTest(unittest.TestCase):
	
	def test_size_constructor(self) -> None:
		SIZELIMIT: int = 1000
		CHECKS: int = 10
		for length in range(SIZELIMIT):
			
			bt: BinaryIndexedTree = BinaryIndexedTree(length)
			self.assertEqual(length, len(bt))
			self.assertEqual(0, bt.get_total())
			
			for _ in range(CHECKS):
				if length > 0:
					self.assertEqual(0, bt[random.randrange(length)])
				self.assertEqual(0, bt.get_prefix_sum(random.randrange(length + 1)))
				start, end = BinaryIndexedTreeTest._rand_start_end(length)
				self.assertEqual(0, bt.get_range_sum(start, end))
	
	
	def test_all_ones(self) -> None:
		SIZELIMIT: int = 1000
		CHECKS: int = 10
		for length in range(1, SIZELIMIT):
			
			mode: int = random.randrange(4)
			if mode == 0:
				bt: BinaryIndexedTree = BinaryIndexedTree([1] * length)
			else:
				bt = BinaryIndexedTree(length)
				p: float
				if   mode == 1:  p = 0.0
				elif mode == 2:  p = 1.0
				elif mode == 3:  p = random.random()
				else:  raise AssertionError()
				for i in range(length):
					if random.random() < p:
						bt.add(i, 1)
					else:
						bt[i] = 1
			
			self.assertEqual(length, len(bt))
			self.assertEqual(length, bt.get_total())
			for _ in range(CHECKS):
				self.assertEqual(1, bt[random.randrange(length)])
				k: int = random.randrange(length + 1)
				self.assertEqual(k, bt.get_prefix_sum(k))
				start, end = BinaryIndexedTreeTest._rand_start_end(length)
				self.assertEqual(end - start, bt.get_range_sum(start, end))
	
	
	def test_array_constructor_randomly(self) -> None:
		TRIALS: int = 300
		SIZELIMIT: int = 10000
		CHECKS: int = 100
		for _ in range(TRIALS):
			
			length: int = random.randrange(SIZELIMIT)
			vals: List[int] = [random.randrange(-1000, 1000) for _ in range(length)]
			cums: List[int] = [0]
			for x in vals:
				cums.append(cums[-1] + x)
			
			bt: BinaryIndexedTree = BinaryIndexedTree(vals)
			self.assertEqual(length, len(bt))
			self.assertEqual(cums[length], bt.get_total())
			
			for _ in range(CHECKS):
				if length > 0:
					k: int = random.randrange(length)
					self.assertEqual(vals[k], bt[k])
				k = random.randrange(length + 1)
				self.assertEqual(cums[k], bt.get_prefix_sum(k))
				start, end = BinaryIndexedTreeTest._rand_start_end(length)
				self.assertEqual(cums[end] - cums[start], bt.get_range_sum(start, end))
	
	
	def test_add_and_set_randomly(self) -> None:
		TRIALS: int = 100
		SIZELIMIT: int = 3000
		OPERATIONS: int = 3000
		CHECKS: int = 100
		for _ in range(TRIALS):
			
			length: int = random.randrange(1, SIZELIMIT)
			if random.randrange(2) == 0:
				vals: List[int] = [0] * length
				bt: BinaryIndexedTree = BinaryIndexedTree(length)
			else:
				vals = [random.randrange(-1000, 1000) for _ in range(length)]
				bt = BinaryIndexedTree(vals)
			
			for _ in range(OPERATIONS):
				k: int = random.randrange(length)
				x: int = random.randrange(-1000, 1000)
				if random.randrange(2) == 0:
					vals[k] += x
					bt.add(k, x)
				else:
					vals[k] = x
					bt[k] = x
			
			cums: List[int] = [0]
			for x in vals:
				cums.append(cums[-1] + x)
			
			for _ in range(CHECKS):
				k = random.randrange(length)
				self.assertEqual(vals[k], bt[k])
				k = random.randrange(length + 1)
				self.assertEqual(cums[k], bt.get_prefix_sum(k))
				start, end = BinaryIndexedTreeTest._rand_start_end(length)
				self.assertEqual(cums[end] - cums[start], bt.get_range_sum(start, end))
	
	
	@staticmethod
	def _rand_start_end(length: int) -> Tuple[int,int]:
		x: int = random.randrange(length + 1)
		y: int = random.randrange(length + 1)
		return (min(x, y), max(x, y))



if __name__ == "__main__":
	unittest.main()
