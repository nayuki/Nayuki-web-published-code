/* 
 * AVL tree list test (C++)
 * 
 * Copyright (c) 2022 Project Nayuki. (MIT License)
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

#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <exception>
#include <iostream>
#include <random>
#include <vector>
#include "AvlTreeList.hpp"

using std::size_t;


template <typename T>
static void assertEquals(T x, T y) {
	if (x != y)
		throw std::runtime_error("Value mismatch");
}


static void testAdd() {
	AvlTreeList<const char*> list;
	list.push_back("January");
	list.push_back("February");
	list.push_back("March");
	list.push_back("April");
	list.push_back("May");
	list.push_back("June");
	list.checkStructure();
	assertEquals(list.size(), static_cast<size_t>(6));
	assertEquals(list[0], "January" );
	assertEquals(list[1], "February");
	assertEquals(list[2], "March"   );
	assertEquals(list[3], "April"   );
	assertEquals(list[4], "May"     );
	assertEquals(list[5], "June"    );
}


static void testSet() {
	AvlTreeList<const char*> list;
	for (int i = 0; i < 10; i++)
		list.push_back(nullptr);
	list[0] = "zero";
	list[1] = "ten";
	list[2] = "twenty";
	list[3] = "thirty";
	list[4] = "forty";
	list[5] = "fifty";
	list[6] = "sixty";
	list[7] = "seventy";
	list[8] = "eighty";
	list[9] = "ninety";
	assertEquals(list.size(), static_cast<size_t>(10));
	assertEquals(list[0], "zero"   );
	assertEquals(list[1], "ten"    );
	assertEquals(list[2], "twenty" );
	assertEquals(list[3], "thirty" );
	assertEquals(list[4], "forty"  );
	assertEquals(list[5], "fifty"  );
	assertEquals(list[6], "sixty"  );
	assertEquals(list[7], "seventy");
	assertEquals(list[8], "eighty" );
	assertEquals(list[9], "ninety" );
}


static void testInsertAtBeginning() {
	AvlTreeList<const char*> list;
	list.insert(0, "Sunday");
	list.insert(0, "Monday");
	list.insert(0, "Tuesday");
	assertEquals(list.size(), static_cast<size_t>(3));
	assertEquals(list[0], "Tuesday");
	assertEquals(list[1], "Monday" );
	assertEquals(list[2], "Sunday" );
}


static void testInsertAtEnd() {
	AvlTreeList<const char*> list;
	list.insert(0, "Saturday");
	list.insert(1, "Friday");
	list.insert(2, "Thursday");
	list.insert(3, "Wednesday");
	assertEquals(list.size(), static_cast<size_t>(4));
	assertEquals(list[0], "Saturday" );
	assertEquals(list[1], "Friday"   );
	assertEquals(list[2], "Thursday" );
	assertEquals(list[3], "Wednesday");
}


static void testInsertAtMiddle() {
	AvlTreeList<const char*> list;
	list.insert(0, "Up");
	list.insert(1, "Down");
	list.insert(1, "Left");
	list.insert(2, "Right");
	list.insert(1, "Front");
	list.insert(2, "Back");
	assertEquals(list.size(), static_cast<size_t>(6));
	assertEquals(list[0], "Up"   );
	assertEquals(list[1], "Front");
	assertEquals(list[2], "Back" );
	assertEquals(list[3], "Left" );
	assertEquals(list[4], "Right");
	assertEquals(list[5], "Down" );
}


// Stresses the self-balancing mechanism
static void testInsertManyBeginning() {
	const long N = 300000;
	AvlTreeList<long> list;
	for (long i = 0; i < N; i++)
		list.push_back(i);
	for (long i = 0; i < N; i++)
		assertEquals(list[i], i);
}


// Stresses the self-balancing mechanism
static void testInsertManyEnd() {
	const long N = 300000;
	AvlTreeList<long> list;
	for (long i = N - 1; i >= 0; i--)
		list.insert(0, i);
	for (long i = 0; i < N; i++)
		assertEquals(list[i], i);
}


// Adds in a weird binary pattern to stress arrays and linked lists
static void testInsertManyEverywhere() {
	const int N = 18;
	static_assert(SIZE_MAX >= 1L << N, "N too big, or size_t too small");
	AvlTreeList<long> list;
	list.push_back(0);
	for (int i = N - 1; i >= 0; i--) {
		size_t k = 1;
		for (long j = 1L << i; j < (1L << N); j += 2 << i, k += 2)
			list.insert(k, j);
	}
	
	for (long i = 0; i < (1L << N); i++)
		assertEquals(list[static_cast<size_t>(i)], i);
}


static void testErase() {
	AvlTreeList<char> list;
	{
		const char *str = "the quick brown fox jumped over the lazy dog";
		for (const char *s = str; *s != '\0'; s++)
			list.push_back(*s);
		assertEquals(list.size(), std::strlen(str));
	}
	
	assertEquals(list[ 2], 'e');  list.erase( 2);
	assertEquals(list[ 4], 'u');  list.erase( 4);
	assertEquals(list[ 3], 'q');  list.erase( 3);
	assertEquals(list[ 2], ' ');  list.erase( 2);
	assertEquals(list[12], 'f');  list.erase(12);
	assertEquals(list[11], ' ');  list.erase(11);
	assertEquals(list[10], 'n');  list.erase(10);
	assertEquals(list[ 9], 'w');  list.erase( 9);
	assertEquals(list[11], ' ');  list.erase(11);
	assertEquals(list[11], 'j');  list.erase(11);
	assertEquals(list[11], 'u');  list.erase(11);
	assertEquals(list[10], 'x');  list.erase(10);
	assertEquals(list[11], 'p');  list.erase(11);
	assertEquals(list[12], 'd');  list.erase(12);
	assertEquals(list[11], 'e');  list.erase(11);
	assertEquals(list[13], 'v');  list.erase(13);
	assertEquals(list[13], 'e');  list.erase(13);
	assertEquals(list[19], 'l');  list.erase(19);
	assertEquals(list[20], 'z');  list.erase(20);
	assertEquals(list[19], 'a');  list.erase(19);
	assertEquals(list[18], ' ');  list.erase(18);
	assertEquals(list[22], 'g');  list.erase(22);
	
	{
		const char *str = "thick broom or they do";
		assertEquals(list.size(), std::strlen(str));
		for (size_t i = 0; i < list.size(); i++)
			assertEquals(list[i], str[i]);
	}
	
	assertEquals(list[0], 't');  list.erase(0);
	assertEquals(list[2], 'c');  list.erase(2);
	assertEquals(list[2], 'k');  list.erase(2);
	assertEquals(list[2], ' ');  list.erase(2);
	assertEquals(list[2], 'b');  list.erase(2);
	assertEquals(list[2], 'r');  list.erase(2);
	assertEquals(list[2], 'o');  list.erase(2);
	assertEquals(list[2], 'o');  list.erase(2);
	assertEquals(list[4], 'o');  list.erase(4);
	assertEquals(list[7], 'h');  list.erase(7);
	assertEquals(list[5], ' ');  list.erase(5);
	assertEquals(list[5], 't');  list.erase(5);
	assertEquals(list[9], 'o');  list.erase(9);
	assertEquals(list[7], ' ');  list.erase(7);
	assertEquals(list[6], 'y');  list.erase(6);
	
	{
		const char *str = "him red";
		assertEquals(std::strlen(str), list.size());
		for (size_t i = 0; i < list.size(); i++)
			assertEquals(list[i], str[i]);
	}
}


static void testClear() {
	AvlTreeList<int> list;
	for (int i = 0; i < 20; i++)
		list.push_back(i * i);
	
	list.clear();
	assertEquals(list.size(), static_cast<size_t>(0));
	
	list.push_back(- 1);
	list.push_back(- 8);
	list.push_back(-27);
	assertEquals(list.size(), static_cast<size_t>(3));
	assertEquals(list[0], - 1);
	assertEquals(list[1], - 8);
	assertEquals(list[2], -27);
}


// Comprehensively tests all the defined methods.
static void testAgainstCppVectorRandomly() {
	// Random number generation variables
	std::default_random_engine randGen((std::random_device())());
	std::uniform_int_distribution<int> operationDist(0, 99);
	std::uniform_int_distribution<int> opCountDist(1, 100);
	std::uniform_int_distribution<int> valueDist;  // 0 to INT_MAX
	
	const long TRIALS = 100000;
	std::vector<int> list0;
	AvlTreeList<int> list1;
	size_t size = 0;
	for (long i = 0; i < TRIALS; i++) {
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
				list1[index] = val;
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
			throw std::domain_error("Assertion error");
		
		assertEquals(list0.size(), size);
		assertEquals(list1.size(), size);
		if (size > 0) {
			for (int j = 0; j < 10; j++) {
				size_t index = (std::uniform_int_distribution<int>(0, size - 1))(randGen);
				assertEquals(list0.at(index), list1[index]);
			}
		}
	}
}


int main() {
	try {
		testAdd();
		testSet();
		testInsertAtBeginning();
		testInsertAtEnd();
		testInsertAtMiddle();
		testInsertManyBeginning();
		testInsertManyEnd();
		testInsertManyEverywhere();
		testErase();
		testClear();
		testAgainstCppVectorRandomly();
		
		std::cerr << "Test passed" << std::endl;
		return EXIT_SUCCESS;
	} catch (std::exception &e) {
		std::cerr << e.what() << std::endl;
		return EXIT_FAILURE;
	}
}
