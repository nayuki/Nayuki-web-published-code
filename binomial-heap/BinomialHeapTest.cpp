/* 
 * Binomial heap test (C++)
 * 
 * Copyright (c) 2016 Project Nayuki
 * https://www.nayuki.io/page/binomial-heap
 * 
 * (MIT License)
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
#include <cstdlib>
#include <ctime>
#include <iostream>
#include <queue>
#include "BinomialHeap.hpp"


// Comprehensively tests all the defined methods against std::priority_queue
int main(int argc, char *argv[]) {
	try {
		srand(time(nullptr));
		std::priority_queue<int,std::vector<int>,std::greater<int> > queue;  // std::greater effects a min-queue
		BinomialHeap<int> heap;
		size_t size = 0;
		for (int i = 0; i < 300000; i++) {
			int op = rand() % 100;
			
			if (op < 1) {  // Clear
				heap.checkStructure();
				queue = std::priority_queue<int,std::vector<int>,std::greater<int> >();
				heap.clear();
				size = 0;
				
			} else if (op < 2) {  // Top
				heap.checkStructure();
				if (size > 0 && queue.top() != heap.top())
					throw "Peek mismatch";
				
			} else if (op < 70) {  // Push
				int n = rand() % 100 + 1;
				for (int j = 0; j < n; j++) {
					int val = rand() % 10000;
					queue.push(val);
					heap.push(val);
				}
				size += n;
				
			} else if (op < 100) {  // Pop
				int n = std::min(rand() % 100 + 1, (int)size);
				for (int j = 0; j < n; j++) {
					if (queue.top() != heap.pop())
						throw "Dequeue mismatch";
					queue.pop();
				}
				size -= n;
				
			} else
				throw "Invalid random operation";
			
			if (queue.size() != size || heap.size() != size)
				throw "Heap size mismatch";
		}
		std::cerr << "Test passed" << std::endl;
		return 0;
		
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return 1;
	}
}
