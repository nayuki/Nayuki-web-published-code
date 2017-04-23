/* 
 * AVL tree list test (C++)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/avl-tree-list
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

#include <cstdlib>
#include <iostream>
#include <random>
#include <vector>
#include "AvlTreeList.hpp"


// Random number generation global variables
std::default_random_engine randGen((std::random_device())());
std::uniform_int_distribution<int> operationDist(0, 99);
std::uniform_int_distribution<int> opCountDist(1, 100);
std::uniform_int_distribution<int> valueDist;  // 0 to INT_MAX


// Comprehensively tests all the defined methods against std::vector
int main() {
	try {
		std::vector<int> list0;
		AvlTreeList<int> list1;
		size_t size = 0;
		for (int i = 0; i < 100000; i++) {
			int op = operationDist(randGen);
			
			if (op < 1) {  // Clear
				list1.checkStructure();
				list0.clear();
				list1.clear();
				size = 0;
				
			} else if (op < 2) {  // Set
				if (size > 0) {
					size_t index = (std::uniform_int_distribution<int>(0, size - 1))(randGen);
					int val = valueDist(randGen);
					list0.at(index) = val;
					list1.at(index) = val;
				}
				
			} else if (op < 30) {  // Random insertion
				int n = opCountDist(randGen);
				for (int j = 0; j < n; j++) {
					size_t index = (std::uniform_int_distribution<int>(0, size))(randGen);
					int val = valueDist(randGen);
					list0.insert(list0.begin() + index, val);
					list1.insert(index, val);
				}
				size += n;
				
			} else if (op < 50) {  // Ascending insertion
				int n = opCountDist(randGen);
				size_t offset = (std::uniform_int_distribution<int>(0, size))(randGen);
				for (int j = 0; j < n; j++, offset++) {
					int val = valueDist(randGen);
					list0.insert(list0.begin() + offset, val);
					list1.insert(offset, val);
				}
				size += n;
				
			} else if (op < 70) {  // Descending insertion
				int n = opCountDist(randGen);
				size_t offset = (std::uniform_int_distribution<int>(0, size))(randGen);
				for (int j = 0; j < n; j++) {
					int val = valueDist(randGen);
					list0.insert(list0.begin() + offset, val);
					list1.insert(offset, val);
				}
				size += n;
				
			} else if (op < 80) {  // Random deletion
				int n = opCountDist(randGen);
				for (int j = 0; j < n && size > 0; j++, size--) {
					size_t index = (std::uniform_int_distribution<int>(0, size - 1))(randGen);
					list0.erase(list0.begin() + index);
					list1.erase(index);
				}
				
			} else if (op < 90) {  // Ascending deletion
				int n = opCountDist(randGen);
				if (size > 0) {
					size_t offset = (std::uniform_int_distribution<int>(0, size - 1))(randGen);
					for (int j = 0; j < n && offset < size; j++, size--) {
						list0.erase(list0.begin() + offset);
						list1.erase(offset);
					}
				}
				
			} else if (op < 100) {  // Descending deletion
				size_t n = opCountDist(randGen);
				if (size > 0) {
					size_t offset = (std::uniform_int_distribution<int>(0, size - 1))(randGen);
					for (size_t j = 0; j < n; j++, offset--) {
						list0.erase(list0.begin() + offset);
						list1.erase(offset);
						size--;
						if (offset == 0)
							break;
					}
				}
			} else
				throw "Assertion error";
			
			if (list0.size() != size || list1.size() != size)
				throw "List size mismatch";
			if (size > 0) {
				for (int j = 0; j < 10; j++) {
					size_t index = (std::uniform_int_distribution<int>(0, size - 1))(randGen);
					if (list0.at(index) != list1.at(index))
						throw "Element mismatch";
				}
			}
		}
		
		std::cerr << "Test passed" << std::endl;
		return EXIT_SUCCESS;
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return EXIT_FAILURE;
	}
}
