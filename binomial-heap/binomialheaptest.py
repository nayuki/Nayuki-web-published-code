# 
# Binomial heap test (Python)
# 
# Copyright (c) 2014 Project Nayuki
# http://www.nayuki.io/page/binomial-heap
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
if sys.version_info.major == 2:
	import Queue as queue
else:
	import queue
import binomialheap


# Comprehensively tests all the defined methods against Python's built-in queue.PriorityQueue class
def main():
	ITERATIONS = 10000
	que = queue.PriorityQueue()
	heap = binomialheap.BinomialHeap()
	length = 0
	for i in range(ITERATIONS):
		if i % 300 == 0:
			print("Progress: {:.0%}".format(float(i) / ITERATIONS))
		op = random.randint(0, 99)
		
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
				val = random.randint(0, 9999)
				que.put(val)
				heap.enqueue(val)
			length += n
			
		elif op < 70:  # Merge
			n = random.randint(1, 100)
			temp = binomialheap.BinomialHeap()
			for j in range(n):
				val = random.randint(0, 9999)
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
	
	print("Test passed")


if __name__ == "__main__":
	main()
