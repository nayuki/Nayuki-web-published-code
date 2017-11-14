/* 
 * Binomial heap test (C++)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/binomial-heap
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */

#include <algorithm>
#include <cstddef>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <random>
#include <queue>
#include <vector>
#include "BinomialHeap.hpp"

using std::size_t;


template <typename T>
static void assertEquals(T x, T y) {
	if (x != y)
		throw "Value mismatch";
}


static void testSize1() {
	BinomialHeap<int> h;
	h.push(3);
	h.checkStructure();
	assertEquals(h.size(), static_cast<size_t>(1));
	assertEquals(h.top(), 3);
	assertEquals(h.pop(), 3);
	h.checkStructure();
	assertEquals(h.size(), static_cast<size_t>(0));
}


static void testSize2() {
	BinomialHeap<int> h;
	h.push(4);
	h.push(2);
	h.checkStructure();
	assertEquals(h.size(), static_cast<size_t>(2));
	assertEquals(h.top(), 2);
	assertEquals(h.pop(), 2);
	h.checkStructure();
	assertEquals(h.size(), static_cast<size_t>(1));
	assertEquals(h.top(), 4);
	assertEquals(h.pop(), 4);
	h.checkStructure();
	assertEquals(h.size(), static_cast<size_t>(0));
}


static void testSize7() {
	BinomialHeap<int> h;
	h.push(2);
	h.push(7);
	h.push(1);
	h.push(8);
	h.push(3);
	h.checkStructure();
	h.push(1);
	h.push(4);
	h.checkStructure();
	assertEquals(h.size(), static_cast<size_t>(7));
	assertEquals(h.pop(), 1);  assertEquals(h.size(), static_cast<size_t>(6));
	assertEquals(h.pop(), 1);  assertEquals(h.size(), static_cast<size_t>(5));
	assertEquals(h.pop(), 2);  assertEquals(h.size(), static_cast<size_t>(4));
	assertEquals(h.pop(), 3);  assertEquals(h.size(), static_cast<size_t>(3));
	h.checkStructure();
	assertEquals(h.pop(), 4);  assertEquals(h.size(), static_cast<size_t>(2));
	assertEquals(h.pop(), 7);  assertEquals(h.size(), static_cast<size_t>(1));
	assertEquals(h.pop(), 8);  assertEquals(h.size(), static_cast<size_t>(0));
	h.checkStructure();
}


std::default_random_engine randGen((std::random_device())());


static void testAgainstVectorRandomly() {
	const long TRIALS = 10000;
	const size_t MAX_SIZE = 1000;
	const int RANGE = 1000;
	
	std::uniform_int_distribution<int> sizeDist(0, MAX_SIZE - 1);
	std::uniform_int_distribution<int> valueDist(0, RANGE - 1);
	
	BinomialHeap<int> heap;
	for (long i = 0; i < TRIALS; i++) {
		std::vector<int> values;
		size_t size = sizeDist(randGen);
		for (size_t j = 0; j < size; j++) {
			int val = valueDist(randGen);
			values.push_back(val);
			heap.push(val);
		}
		
		std::sort(values.begin(), values.end());
		for (int val : values)
			assertEquals(val, heap.pop());
		
		assertEquals(heap.empty(), true);
		heap.clear();
	}
}


static void testAgainstCppPriorityQueueRandomly() {
	const long TRIALS = 300000;
	const size_t ITER_OPS = 100;
	const int RANGE = 10000;
	
	std::uniform_int_distribution<int> operationDist(0, 99);
	std::uniform_int_distribution<size_t> opCountDist(1, ITER_OPS);
	std::uniform_int_distribution<int> valueDist(0, RANGE - 1);
	
	std::priority_queue<int,std::vector<int>,std::greater<int> > queue;  // std::greater effects a min-queue
	BinomialHeap<int> heap;
	size_t size = 0;
	for (int i = 0; i < TRIALS; i++) {
		int op = operationDist(randGen);
		
		if (op < 1) {  // Clear
			heap.checkStructure();
			for (size_t j = 0; j < size; j++) {
				assertEquals(queue.top(), heap.pop());
				queue.pop();
			}
			size = 0;
			
		} else if (op < 2) {  // Top
			heap.checkStructure();
			if (size > 0)
				assertEquals(heap.top(), queue.top());
			
		} else if (op < 70) {  // Enqueue/merge
			bool merge = !(op < 60);
			BinomialHeap<int> temp;
			size_t n = opCountDist(randGen);
			for (size_t j = 0; j < n; j++) {
				int val = valueDist(randGen);
				queue.push(val);
				(merge ? temp : heap).push(val);
			}
			if (merge) {
				heap.merge(temp);
				assertEquals(temp.size(), static_cast<size_t>(0));
			}
			size += n;
			
		} else if (op < 100) {  // Dequeue
			size_t n = std::min(opCountDist(randGen), size);
			for (size_t j = 0; j < n; j++) {
				assertEquals(heap.pop(), queue.top());
				queue.pop();
			}
			size -= n;
			
		} else
			throw "Invalid random operation";
		
		assertEquals(queue.size(), size);
		assertEquals(heap.size(), size);
		assertEquals(queue.empty(), size == 0);
		assertEquals(heap.empty(), size == 0);
	}
}


int main() {
	try {
		testSize1();
		testSize2();
		testSize7();
		testAgainstVectorRandomly();
		testAgainstCppPriorityQueueRandomly();
		
		std::cerr << "Test passed" << std::endl;
		return EXIT_SUCCESS;
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return EXIT_FAILURE;
	}
}
