# 
# Binomial heap test (Python)
# 
# Copyright (c) 2017 Project Nayuki. (MIT License)
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

import random, sys, unittest
if sys.version_info.major == 2:
	import Queue as queue
else:
	import queue
import binomialheap


class BinomialHeapTest(unittest.TestCase):
	
	def test_size_1(self):
		h = binomialheap.BinomialHeap()
		h.enqueue(3)
		self.assertEqual(1, len(h))
		self.assertEqual(3, h.peek())
		self.assertEqual(3, h.dequeue())
		self.assertEqual(0, len(h))
	
	
	def test_size_2(self):
		h = binomialheap.BinomialHeap()
		h.enqueue(4)
		h.enqueue(2)
		self.assertEqual(2, len(h))
		self.assertEqual(2, h.peek())
		self.assertEqual(2, h.dequeue())
		self.assertEqual(1, len(h))
		self.assertEqual(4, h.peek())
		self.assertEqual(4, h.dequeue())
		self.assertEqual(0, len(h))
	
	
	def test_size_7(self):
		h = binomialheap.BinomialHeap()
		h.enqueue(2)
		h.enqueue(7)
		h.enqueue(1)
		h.enqueue(8)
		h.enqueue(3)
		h.enqueue(1)
		h.enqueue(4)
		self.assertEqual(7, len(h))
		self.assertEqual(1, h.dequeue());  self.assertEqual(6, len(h))
		self.assertEqual(1, h.dequeue());  self.assertEqual(5, len(h))
		self.assertEqual(2, h.dequeue());  self.assertEqual(4, len(h))
		self.assertEqual(3, h.dequeue());  self.assertEqual(3, len(h))
		self.assertEqual(4, h.dequeue());  self.assertEqual(2, len(h))
		self.assertEqual(7, h.dequeue());  self.assertEqual(1, len(h))
		self.assertEqual(8, h.dequeue());  self.assertEqual(0, len(h))
	
	
	# Comprehensively tests all the defined methods
	def test_against_python_priority_queue_randomly(self):
		ITERATIONS = 10000
		que = queue.PriorityQueue()
		heap = binomialheap.BinomialHeap()
		length = 0
		for i in range(ITERATIONS):
			if i % 300 == 0:
				print("Progress: {:.0%}".format(float(i) / ITERATIONS))
			op = random.randrange(100)
			
			if op < 1:  # Clear
				heap.check_structure()
				for j in range(length):
					if heap.dequeue() != que.get(False):
						raise AssertionError()
				if not que.empty():
					raise AssertionError()
				length = 0
				
			elif op < 2:  # Peek
				heap.check_structure()
				if length > 0:
					val = que.get(False)
					if heap.peek() != val:
						raise AssertionError()
					que.put(val)
				
			elif op < 60:  # Add
				n = random.randint(1, 100)
				for j in range(n):
					val = random.randrange(10000)
					que.put(val)
					heap.enqueue(val)
				length += n
				
			elif op < 70:  # Merge
				n = random.randint(1, 100)
				temp = binomialheap.BinomialHeap()
				for j in range(n):
					val = random.randrange(10000)
					que.put(val)
					temp.enqueue(val)
				heap.merge(temp)
				if len(temp) != 0:
					raise AssertionError()
				length += n
				
			elif op < 100:  # Remove
				n = min(random.randint(1, 100), length)
				for j in range(n):
					if heap.dequeue() != que.get(False):
						raise AssertionError()
				length -= n
				
			else:
				raise AssertionError()
			
			if len(heap) != length:
				raise AssertionError()



if __name__ == "__main__":
	unittest.main()
