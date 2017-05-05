/* 
 * B-tree set test (C++)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/btree-set
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
#include <cstdlib>
#include <iostream>
#include <iterator>
#include <random>
#include <set>
#include "BTreeSet.hpp"

using std::size_t;


// Forward declarations
static void testSmallRandomly();
static void testInsertRandomly();
static void testLargeRandomly();
static void testRemoveAllRandomly();


// Random number generation global variables
std::default_random_engine randGen((std::random_device())());
std::uniform_real_distribution<double> realDist(0.0, 1.0);


int main() {
	try {
		testSmallRandomly();
		testInsertRandomly();
		testLargeRandomly();
		testRemoveAllRandomly();
		
		std::cerr << "Test passed" << std::endl;
		return EXIT_SUCCESS;
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return EXIT_FAILURE;
	}
}


static void testSmallRandomly() {
	const int trials = 1000;
	const int operations = 100;
	const int range = 1000;
	std::uniform_int_distribution<int> rangeDist(0, range - 1);
	std::uniform_int_distribution<int> degreeDist(2, 6);
	for (int i = 0; i < trials; i++) {
		std::set<int> set0;
		BTreeSet<int> set1(degreeDist(randGen));
		for (int j = 0; j < operations; j++) {
			// Add/remove a random value
			int val = rangeDist(randGen);
			if (realDist(randGen) < 0.5) {
				set0.insert(val);
				set1.insert(val);
			} else {
				set0.erase(val);
				set1.erase(val);
			}
			set1.checkStructure();
			
			// Check size and check element membership over entire range
			if (set0.size() != set1.size())
				throw "Size mismatch";
			for (int k = -4; k < range + 4; k++) {
				int val = k;
				if (set1.contains(val) != (set0.find(val) != set0.end()))
					throw "Contain test mismatch";
			}
		}
	}
}


static void testInsertRandomly() {
	const int trials = 100;
	const int operations = 10000;
	const int range = 100000;
	const int checks = 10;
	std::uniform_int_distribution<int> rangeDist(0, range - 1);
	for (int i = 0; i < trials; i++) {
		std::set<int> set0;
		BTreeSet<int> set1(2);
		for (int j = 0; j < operations; j++) {
			// Add a random value
			int val = rangeDist(randGen);
			set0.insert(val);
			set1.insert(val);
			if (realDist(randGen) < 0.003)
				set1.checkStructure();
			
			// Check size and random element membership
			if (set0.size() != set1.size())
				throw "Size mismatch";
			for (int k = 0; k < checks; k++) {
				int val = rangeDist(randGen);
				if (set1.contains(val) != (set0.find(val) != set0.end()))
					throw "Contain test mismatch";
			}
		}
	}
}


static void testLargeRandomly() {
	const int trials = 100;
	const int operations = 30000;
	const int range = 100000;
	const int checks = 10;
	std::uniform_int_distribution<int> rangeDist(0, range - 1);
	std::uniform_int_distribution<int> degreeDist(2, 6);
	for (int i = 0; i < trials; i++) {
		std::set<int> set0;
		BTreeSet<int> set1(degreeDist(randGen));
		for (int j = 0; j < operations; j++) {
			// Add/remove a random value
			int val = rangeDist(randGen);
			if (realDist(randGen) < 0.5) {
				set0.insert(val);
				set1.insert(val);
			} else {
				set0.erase(val);
				set1.erase(val);
			}
			if (realDist(randGen) < 0.001)
				set1.checkStructure();
			
			// Check size and random element membership
			if (set0.size() != set1.size())
				throw "Size mismatch";
			for (int k = 0; k < checks; k++) {
				int val = rangeDist(randGen);
				if (set1.contains(val) != (set0.find(val) != set0.end()))
					throw "Contain test mismatch";
			}
		}
	}
}


static void testRemoveAllRandomly() {
	const int trials = 100;
	const int limit = 10000;
	const int range = 100000;
	const int checks = 10;
	std::uniform_int_distribution<int> rangeDist(0, range - 1);
	std::uniform_int_distribution<int> degreeDist(2, 6);
	for (int i = 0; i < trials; i++) {
		std::set<int> set0;
		BTreeSet<int> set1(degreeDist(randGen));
		for (int j = 0; j < limit; j++) {
			int val = rangeDist(randGen);
			set0.insert(val);
			set1.insert(val);
		}
		set1.checkStructure();
		
		// Incrementally remove each value
		std::vector<int> temp(set0.begin(), set0.end());
		std::shuffle(temp.begin(), temp.end(), randGen);
		for (size_t j = 0; j < temp.size(); j++) {
			int val = temp.at(j);
			set0.erase(val);
			set1.erase(val);
			if (realDist(randGen) < 1.0 / std::min(std::max(set1.size(), static_cast<size_t>(1)), static_cast<size_t>(1000)))
				set1.checkStructure();
			if (set0.size() != set1.size())
				throw "Size mismatch";
			for (int k = 0; k < checks; k++) {
				int val = rangeDist(randGen);
				if (set1.contains(val) != (set0.find(val) != set0.end()))
					throw "Contain test mismatch";
			}
		}
	}
}
