/* 
 * Disjoint-set data structure - Test suite (C++)
 * 
 * Copyright (c) 2021 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/disjoint-set-data-structure
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
#include <iostream>
#include <random>
#include <vector>
#include "DisjointSet.hpp"

using std::size_t;


/*---- Helper definitions ----*/

class NaiveDisjointSet final {
	private: std::vector<size_t> representatives;
	
	public: explicit NaiveDisjointSet(size_t numElems) {
		for (size_t i = 0; i < numElems; i++)
			representatives.push_back(i);
	}
	
	public: size_t getNumSets() const {
		size_t result = 0;
		for (size_t i = 0; i < representatives.size(); i++) {
			if (representatives[i] == i)
				result++;
		}
		return result;
	}
	
	public: size_t getSizeOfSet(size_t elemIndex) const {
		size_t repr = representatives[elemIndex];
		size_t result = 0;
		for (size_t i = 0; i < representatives.size(); i++) {
			if (representatives[i] == repr)
				result++;
		}
		return result;
	}
	
	public: bool areInSameSet(size_t elemIndex0, size_t elemIndex1) const {
		return representatives[elemIndex0] == representatives[elemIndex1];
	}
	
	public: bool mergeSets(size_t elemIndex0, size_t elemIndex1) {
		size_t repr0 = representatives[elemIndex0];
		size_t repr1 = representatives[elemIndex1];
		for (size_t i = 0; i < representatives.size(); i++) {
			if (representatives[i] == repr1)
				representatives[i] = repr0;
		}
		return repr0 != repr1;
	}
};


// Random number generation global variables
std::default_random_engine randGen((std::random_device())());
std::uniform_real_distribution<double> realDist;


static void assertTrue(bool cond) {
	if (!cond)
		throw "Assertion error";
}


static void assertFalse(bool cond) {
	assertTrue(!cond);
}


static void assertEquals(std::int64_t expected, std::int64_t actual) {
	assertTrue(actual == expected);
}


/*---- Test suite ----*/

static void testNew() {
	DisjointSet<signed char> ds(10);
	assertEquals(10, ds.getNumSets());
	assertEquals(1, ds.getSizeOfSet(0));
	assertEquals(1, ds.getSizeOfSet(2));
	assertEquals(1, ds.getSizeOfSet(9));
	assertTrue(ds.areInSameSet(0, 0));
	assertFalse(ds.areInSameSet(0, 1));
	assertFalse(ds.areInSameSet(9, 3));
	ds.checkStructure();
}


static void testMerge() {
	DisjointSet<std::uint16_t> ds(10);
	assertTrue(ds.mergeSets(0, 1));
	ds.checkStructure();
	assertEquals(9, ds.getNumSets());
	assertTrue(ds.areInSameSet(0, 1));
	
	assertTrue(ds.mergeSets(2, 3));
	ds.checkStructure();
	assertEquals(8, ds.getNumSets());
	assertTrue(ds.areInSameSet(2, 3));
	
	assertFalse(ds.mergeSets(2, 3));
	ds.checkStructure();
	assertEquals(8, ds.getNumSets());
	assertFalse(ds.areInSameSet(0, 2));
	
	assertTrue(ds.mergeSets(0, 3));
	ds.checkStructure();
	assertEquals(7, ds.getNumSets());
	assertTrue(ds.areInSameSet(0, 2));
	assertTrue(ds.areInSameSet(3, 0));
	assertTrue(ds.areInSameSet(1, 3));
}


static void testBigMerge() {
	const int MAX_RANK = 20;
	const long TRIALS = 10000;
	
	const size_t numElems = static_cast<size_t>(1) << MAX_RANK;  // Grows exponentially
	DisjointSet<std::uint32_t> ds(numElems);
	for (int level = 0; level < MAX_RANK; level++) {
		size_t mergeStep = static_cast<size_t>(1) << level;
		size_t incrStep = mergeStep * 2;
		for (size_t i = 0; i < numElems; i += incrStep) {
			assertFalse(ds.areInSameSet(i, i + mergeStep));
			assertTrue(ds.mergeSets(i, i + mergeStep));
		}
		// Now we have a bunch of sets of size 2^(level+1)
		
		// Do random tests
		size_t mask = -incrStep;  // 0b11...100...00
		for (long i = 0; i < TRIALS; i++) {
			size_t j = (std::uniform_int_distribution<size_t>(0, numElems - 1))(randGen);
			size_t k = (std::uniform_int_distribution<size_t>(0, numElems - 1))(randGen);
			bool expect = (j & mask) == (k & mask);
			assertTrue(ds.areInSameSet(j, k) == expect);
		}
	}
}


static void testAgainstNaiveRandomly() {
	const long TRIALS = 1000;
	const long ITERATIONS = 3000;
	const size_t NUM_ELEMS = 300;
	
	for (long i = 0; i < TRIALS; i++) {
		NaiveDisjointSet nds(NUM_ELEMS);
		DisjointSet<size_t> ds(NUM_ELEMS);
		for (long j = 0; j < ITERATIONS; j++) {
			size_t k = (std::uniform_int_distribution<size_t>(0, NUM_ELEMS - 1))(randGen);
			size_t l = (std::uniform_int_distribution<size_t>(0, NUM_ELEMS - 1))(randGen);
			assertTrue(ds.getSizeOfSet(k) == nds.getSizeOfSet(k));
			assertTrue(ds.areInSameSet(k, l) == nds.areInSameSet(k, l));
			if (realDist(randGen) < 0.1)
				assertTrue(ds.mergeSets(k, l) == nds.mergeSets(k, l));
			assertEquals(nds.getNumSets(), ds.getNumSets());
			if (realDist(randGen) < 0.001)
				ds.checkStructure();
		}
		ds.checkStructure();
	}
}


/*---- Main runner ----*/

int main() {
	try {
		testNew();
		testMerge();
		testBigMerge();
		testAgainstNaiveRandomly();
		
		std::cerr << "Test passed" << std::endl;
		return EXIT_SUCCESS;
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return EXIT_FAILURE;
	}
}
