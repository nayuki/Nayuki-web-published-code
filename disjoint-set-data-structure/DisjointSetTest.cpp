/* 
 * Disjoint-set data structure - Test suite (C++)
 * 
 * Copyright (c) 2015 Project Nayuki
 * http://www.nayuki.io/page/disjoint-set-data-structure
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
#include "DisjointSet.hpp"


/*---- Helper definitions ----*/

class NaiveDisjointSet {
private:
	std::vector<size_t> representatives;
	
public:
	
	NaiveDisjointSet(size_t numElems) {
		for (size_t i = 0; i < numElems; i++)
			representatives.push_back(i);
	}
	
	size_t getNumberOfSets() const {
		size_t result = 0;
		for (size_t i = 0; i < representatives.size(); i++) {
			if (representatives[i] == i)
				result++;
		}
		return result;
	}
	
	size_t getSizeOfSet(size_t elemIndex) const {
		size_t repr = representatives[elemIndex];
		size_t result = 0;
		for (size_t i = 0; i < representatives.size(); i++) {
			if (representatives[i] == repr)
				result++;
		}
		return result;
	}
	
	bool areInSameSet(size_t elemIndex0, size_t elemIndex1) const {
		return representatives[elemIndex0] == representatives[elemIndex1];
	}
	
	bool mergeSets(size_t elemIndex0, size_t elemIndex1) {
		size_t repr0 = representatives[elemIndex0];
		size_t repr1 = representatives[elemIndex1];
		for (size_t i = 0; i < representatives.size(); i++) {
			if (representatives[i] == repr1)
				representatives[i] = repr0;
		}
		return repr0 != repr1;
	}
};


static void assertEquals(bool expected, bool actual) {
	if (expected != actual)
		throw "Assertion error";
}


static void assertEquals(size_t expected, size_t actual) {
	if (expected != actual)
		throw "Assertion error";
}


/*---- Test suite ----*/

static void testNew() {
	DisjointSet ds(10);
	assertEquals(10, ds.getNumberOfSets());
	assertEquals(1, ds.getSizeOfSet(0));
	assertEquals(1, ds.getSizeOfSet(2));
	assertEquals(1, ds.getSizeOfSet(9));
	assertEquals(true, ds.areInSameSet(0, 0));
	assertEquals(false, ds.areInSameSet(0, 1));
	assertEquals(false, ds.areInSameSet(9, 3));
	ds.checkStructure();
}


static void testMerge() {
	DisjointSet ds(10);
	ds.mergeSets(0, 1);
	ds.checkStructure();
	assertEquals(9, ds.getNumberOfSets());
	assertEquals(true, ds.areInSameSet(0, 1));
	
	ds.mergeSets(2, 3);
	ds.checkStructure();
	assertEquals(8, ds.getNumberOfSets());
	assertEquals(true, ds.areInSameSet(2, 3));
	
	ds.mergeSets(2, 3);
	ds.checkStructure();
	assertEquals(8, ds.getNumberOfSets());
	assertEquals(false, ds.areInSameSet(0, 2));
	
	ds.mergeSets(0, 3);
	ds.checkStructure();
	assertEquals(7, ds.getNumberOfSets());
	assertEquals(true, ds.areInSameSet(0, 2));
	assertEquals(true, ds.areInSameSet(3, 0));
	assertEquals(true, ds.areInSameSet(1, 3));
}


static void testBigMerge() {
	int maxRank = 20;
	int trials = 10000;
	
	int numElems = 1 << maxRank;  // Grows exponentially
	DisjointSet ds(numElems);
	for (int level = 0; level < maxRank; level++) {
		int mergeStep = 1 << level;
		int incrStep = mergeStep * 2;
		for (int i = 0; i < numElems; i += incrStep) {
			assertEquals(false, ds.areInSameSet(i, i + mergeStep));
			assertEquals(true, ds.mergeSets(i, i + mergeStep));
		}
		// Now we have a bunch of sets of size 2^(level+1)
		
		// Do random tests
		int mask = -incrStep;  // 0b11...100...00
		for (int i = 0; i < trials; i++) {
			int j = rand() % numElems;
			int k = rand() % numElems;
			bool expect = (j & mask) == (k & mask);
			assertEquals(true, ds.areInSameSet(j, k) == expect);
		}
	}
}


static void testAgainstNaiveRandomly() {
	int trials = 1000;
	int iterations = 3000;
	int numElems = 300;
	
	for (int i = 0; i < trials; i++) {
		NaiveDisjointSet nds(numElems);
		DisjointSet ds(numElems);
		for (int j = 0; j < iterations; j++) {
			int k = rand() % numElems;
			int l = rand() % numElems;
			assertEquals(true, ds.getSizeOfSet(k) == nds.getSizeOfSet(k));
			assertEquals(true, ds.areInSameSet(k, l) == nds.areInSameSet(k, l));
			if ((double)rand() / RAND_MAX < 0.1)
				assertEquals(true, ds.mergeSets(k, l) == nds.mergeSets(k, l));
			assertEquals(nds.getNumberOfSets(), ds.getNumberOfSets());
			if ((double)rand() / RAND_MAX < 0.001)
				ds.checkStructure();
		}
		ds.checkStructure();
	}
}


/*---- Main runner ----*/

int main(int argc, char **argv) {
	try {
		srand(time(NULL));
		testNew();
		testMerge();
		testBigMerge();
		testAgainstNaiveRandomly();
		std::cerr << "Test passed" << std::endl;
		return 0;
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return 1;
	}
}
