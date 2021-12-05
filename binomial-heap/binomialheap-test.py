# 
# Binomial heap test (Python)
# 
# Copyright (c) 2021 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/binomial-heap
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

import queue, random, unittest
from typing import List
from binomialheap import BinomialHeap


class BinomialHeapTest(unittest.TestCase):
	
	def test_size_1(self) -> None:
		h: BinomialHeap[int] = BinomialHeap()
		h.enqueue(3)
		h.check_structure()
		self.assertEqual(1, len(h))
		self.assertEqual(3, h.peek())
		self.assertEqual(3, h.dequeue())
		h.check_structure()
		self.assertEqual(0, len(h))
	
	
	def test_size_2(self) -> None:
		h: BinomialHeap[int] = BinomialHeap()
		h.enqueue(4)
		h.enqueue(2)
		h.check_structure()
		self.assertEqual(2, len(h))
		self.assertEqual(2, h.peek())
		self.assertEqual(2, h.dequeue())
		h.check_structure()
		self.assertEqual(1, len(h))
		self.assertEqual(4, h.peek())
		self.assertEqual(4, h.dequeue())
		h.check_structure()
		self.assertEqual(0, len(h))
	
	
	def test_size_7(self) -> None:
		h: BinomialHeap[int] = BinomialHeap()
		h.enqueue(2)
		h.enqueue(7)
		h.enqueue(1)
		h.enqueue(8)
		h.enqueue(3)
		h.check_structure()
		h.enqueue(1)
		h.enqueue(4)
		h.check_structure()
		self.assertEqual(7, len(h))
		self.assertEqual(1, h.dequeue());  self.assertEqual(6, len(h))
		self.assertEqual(1, h.dequeue());  self.assertEqual(5, len(h))
		self.assertEqual(2, h.dequeue());  self.assertEqual(4, len(h))
		self.assertEqual(3, h.dequeue());  self.assertEqual(3, len(h))
		h.check_structure()
		self.assertEqual(4, h.dequeue());  self.assertEqual(2, len(h))
		self.assertEqual(7, h.dequeue());  self.assertEqual(1, len(h))
		self.assertEqual(8, h.dequeue());  self.assertEqual(0, len(h))
		h.check_structure()
	
	
	def test_against_list_randomly(self) -> None:
		TRIALS: int = 1000
		MAX_SIZE: int = 300
		RANGE: int = 1000
		
		heap: BinomialHeap[int] = BinomialHeap()
		for _ in range(TRIALS):
			size: int = random.randrange(MAX_SIZE)
			values: List[int] = [random.randrange(RANGE) for _ in range(size)]
			for val in values:
				heap.enqueue(val)
			
			values.sort()
			for val in values:
				self.assertEqual(val, heap.dequeue())
			
			self.assertTrue(heap.empty())
			heap.clear()
	
	
	def test_against_python_priority_queue_randomly(self) -> None:
		TRIALS: int = 10000
		ITER_OPS: int = 100
		RANGE: int = 10000
		
		que: queue.PriorityQueue[int] = queue.PriorityQueue()
		heap: BinomialHeap[int] = BinomialHeap()
		size: int = 0
		for i in range(TRIALS):
			if i % 300 == 0:
				print(f"Progress: {i / TRIALS:.0%}")
			op: int = random.randrange(100)
			
			if op < 1:  # Clear
				heap.check_structure()
				for _ in range(size):
					self.assertEqual(heap.dequeue(), que.get(False))
				size = 0
				
			elif op < 2:  # Peek
				heap.check_structure()
				if size > 0:
					val: int = que.get(False)
					self.assertEqual(heap.peek(), val)
					que.put(val)
				
			elif op < 70:  # Enqueue/merge
				merge: bool = not (op < 60)
				sink: BinomialHeap[int] = BinomialHeap() if merge else heap
				n: int = random.randint(1, ITER_OPS)
				for _ in range(n):
					val = random.randrange(RANGE)
					que.put(val)
					sink.enqueue(val)
				if merge:
					heap.merge(sink)
					self.assertEqual(len(sink), 0)
				size += n
				
			elif op < 100:  # Dequeue
				n = min(random.randint(1, ITER_OPS), size)
				for _ in range(n):
					self.assertEqual(heap.dequeue(), que.get(False))
				size -= n
				
			else:
				raise AssertionError()
			
			self.assertEqual(que.qsize(), size)
			self.assertEqual(len(heap), size)
			self.assertEqual(que.empty(), size == 0)
			self.assertEqual(heap.empty(), size == 0)



if __name__ == "__main__":
	unittest.main()
