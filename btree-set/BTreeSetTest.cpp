/* 
 * B-tree set test (C++)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
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
#include <cstddef>
#include <cstdlib>
#include <iostream>
#include <random>
#include <set>
#include "BTreeSet.hpp"

using std::size_t;
using std::uniform_int_distribution;


// Forward declarations
static void testSmallRandomly();
static void testInsertRandomly();
static void testLargeRandomly();
static void testRemoveAllRandomly();


// Random number generation global variables
std::default_random_engine randGen((std::random_device())());
std::uniform_real_distribution<double> realDist;


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


template <typename E>
static bool contains(std::set<E> &set, const E &val) {
	return set.find(val) != set.end();
}


static void testSmallRandomly() {
	const long TRIALS = 1000;
	const long OPERATIONS = 100;
	const int RANGE = 1000;
	uniform_int_distribution<int> valueDist(0, RANGE - 1);
	uniform_int_distribution<int> degreeDist(2, 6);
	
	for (long i = 0; i < TRIALS; i++) {
		std::set<int> set0;
		BTreeSet<int> set1(degreeDist(randGen));
		for (long j = 0; j < OPERATIONS; j++) {
			// Add/remove a random value
			int val = valueDist(randGen);
			if (realDist(randGen) < 0.001) {
				set0.clear();
				set1.clear();
			} else if (realDist(randGen) < 0.5) {
				set0.insert(val);
				set1.insert(val);
			} else {
				if (set0.erase(val) != set1.erase(val))
					throw "Erase mismatch";
			}
			set1.checkStructure();
			
			// Check size and check element membership over entire range
			if (set0.empty() != set1.empty())
				throw "Empty mismatch";
			if (set0.size() != set1.size())
				throw "Size mismatch";
			for (int k = -4; k < RANGE + 4; k++) {
				int val = k;
				if (contains(set0, val) != set1.contains(val))
					throw "Contain test mismatch";
			}
		}
	}
}


static void testInsertRandomly() {
	const long TRIALS = 100;
	const long OPERATIONS = 10'000;
	const long RANGE = 100'000;
	const long CHECKS = 10;
	uniform_int_distribution<long> valueDist(0, RANGE - 1);
	
	for (long i = 0; i < TRIALS; i++) {
		std::set<long> set0;
		BTreeSet<long> set1(2);
		for (long j = 0; j < OPERATIONS; j++) {
			// Add a random value
			long val = valueDist(randGen);
			set0.insert(val);
			set1.insert(val);
			if (realDist(randGen) < 0.003)
				set1.checkStructure();
			
			// Check size and random element membership
			if (set0.size() != set1.size())
				throw "Size mismatch";
			for (long k = 0; k < CHECKS; k++) {
				long val = valueDist(randGen);
				if (contains(set0, val) != set1.contains(val))
					throw "Contain test mismatch";
			}
		}
	}
}


static void testLargeRandomly() {
	const long TRIALS = 100;
	const long OPERATIONS = 30'000;
	const long RANGE = 100'000;
	const long CHECKS = 10;
	uniform_int_distribution<long> valueDist(0, RANGE - 1);
	uniform_int_distribution<int> degreeDist(2, 6);
	
	for (long i = 0; i < TRIALS; i++) {
		std::set<long> set0;
		BTreeSet<long> set1(degreeDist(randGen));
		for (long j = 0; j < OPERATIONS; j++) {
			// Add/remove a random value
			long val = valueDist(randGen);
			if (realDist(randGen) < 0.5) {
				set0.insert(val);
				set1.insert(val);
			} else {
				if (set0.erase(val) != set1.erase(val))
					throw "Erase mismatch";
			}
			if (realDist(randGen) < 0.001)
				set1.checkStructure();
			
			// Check size and random element membership
			if (set0.size() != set1.size())
				throw "Size mismatch";
			for (long k = 0; k < CHECKS; k++) {
				long val = valueDist(randGen);
				if (contains(set0, val) != set1.contains(val))
					throw "Contain test mismatch";
			}
		}
	}
}


static void testRemoveAllRandomly() {
	const long TRIALS = 100;
	const long LIMIT = 10'000;
	const long RANGE = 100'000;
	const long CHECKS = 10;
	uniform_int_distribution<long> valueDist(0, RANGE - 1);
	uniform_int_distribution<int> degreeDist(2, 6);
	
	for (long i = 0; i < TRIALS; i++) {
		std::set<long> set0;
		BTreeSet<long> set1(degreeDist(randGen));
		for (long j = 0; j < LIMIT; j++) {
			long val = valueDist(randGen);
			set0.insert(val);
			set1.insert(val);
		}
		set1.checkStructure();
		
		// Incrementally remove each value
		std::vector<long> temp(set0.begin(), set0.end());
		std::shuffle(temp.begin(), temp.end(), randGen);
		for (long val : temp) {
			if (set0.erase(val) != set1.erase(val))
				throw "Erase mismatch";
			if (realDist(randGen) < 1.0 / std::min(std::max(set1.size(), static_cast<size_t>(1)), static_cast<size_t>(1000)))
				set1.checkStructure();
			if (set0.size() != set1.size())
				throw "Size mismatch";
			for (long k = 0; k < CHECKS; k++) {
				long val = valueDist(randGen);
				if (contains(set0, val) != set1.contains(val))
					throw "Contain test mismatch";
			}
		}
	}
}
