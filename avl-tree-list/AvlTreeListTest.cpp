/* 
 * AVL tree list test (C++)
 * 
 * Copyright (c) 2014 Project Nayuki
 * http://www.nayuki.io/page/avl-tree-list
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

#include <cstdlib>
#include <ctime>
#include <iostream>
#include <vector>
#include "AvlTreeList.hpp"


// Comprehensively tests all the defined methods against std::vector
int main(int argc, char *argv[]) {
	try {
		srand(time(NULL));
		std::vector<int> list0;
		AvlTreeList<int> list1;
		size_t size = 0;
		for (int i = 0; i < 100000; i++) {
			int op = rand() % 100;
			
			if (op < 1) {  // Clear
				list1.checkStructure();
				list0.clear();
				list1.clear();
				size = 0;
				
			} else if (op < 2) {  // Set
				if (size > 0) {
					size_t index = rand() % size;
					int val = rand();
					list0.at(index) = val;
					list1.at(index) = val;
				}
				
			} else if (op < 30) {  // Random insertion
				int n = rand() % 100 + 1;
				for (int j = 0; j < n; j++) {
					size_t index = rand() % (size + 1);
					int val = rand();
					list0.insert(list0.begin() + index, val);
					list1.insert(index, val);
				}
				size += n;
				
			} else if (op < 50) {  // Ascending insertion
				int n = rand() % 100 + 1;
				size_t offset = rand() % (size + 1);
				for (int j = 0; j < n; j++, offset++) {
					int val = rand();
					list0.insert(list0.begin() + offset, val);
					list1.insert(offset, val);
				}
				size += n;
				
			} else if (op < 70) {  // Descending insertion
				int n = rand() % 100 + 1;
				size_t offset = rand() % (size + 1);
				for (int j = 0; j < n; j++) {
					int val = rand();
					list0.insert(list0.begin() + offset, val);
					list1.insert(offset, val);
				}
				size += n;
				
			} else if (op < 80) {  // Random deletion
				int n = rand() % 100 + 1;
				for (int j = 0; j < n && size > 0; j++, size--) {
					size_t index = rand() % size;
					list0.erase(list0.begin() + index);
					list1.erase(index);
				}
				
			} else if (op < 90) {  // Ascending deletion
				int n = rand() % 100 + 1;
				if (size > 0) {
					size_t offset = rand() % size;
					for (int j = 0; j < n && offset < size; j++, size--) {
						list0.erase(list0.begin() + offset);
						list1.erase(offset);
					}
				}
				
			} else if (op < 100) {  // Descending deletion
				size_t n = rand() % 100 + 1;
				if (size > 0) {
					size_t offset = rand() % size;
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
					size_t index = rand() % size;
					if (list0.at(index) != list1.at(index))
						throw "Element mismatch";
				}
			}
		}
		std::cerr << "Test passed" << std::endl;
		return 0;
		
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return 1;
	}
}
