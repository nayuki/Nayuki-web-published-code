/* 
 * Disjoint-set data structure - Test suite (C)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
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

#include <assert.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "disjoint-set.h"


/*---- Helper definitions ----*/

struct NaiveDisjointSet {
	
	size_t numElements;
	size_t representatives[];
	
};


static struct NaiveDisjointSet *NaiveDisjointSet_init(size_t numElems) {
	size_t temp = sizeof(size_t);
	if (SIZE_MAX / temp < numElems)
		return NULL;
	temp *= numElems;
	if (SIZE_MAX - temp < sizeof(struct NaiveDisjointSet))
		return NULL;
	temp += sizeof(struct NaiveDisjointSet);
	struct NaiveDisjointSet *result = malloc(temp);
	result->numElements = numElems;
	for (size_t i = 0; i < numElems; i++)
		result->representatives[i] = i;
	return result;
}


static struct NaiveDisjointSet *NaiveDisjointSet_destroy(struct NaiveDisjointSet *this) {
	free(this);
	return NULL;
}


static size_t NaiveDisjointSet_getNumberOfSets(const struct NaiveDisjointSet this[static 1]) {
	size_t result = 0;
	for (size_t i = 0; i < this->numElements; i++) {
		if (this->representatives[i] == i)
			result++;
	}
	return result;
}


static size_t NaiveDisjointSet_getSizeOfSet(const struct NaiveDisjointSet this[static 1], size_t elemIndex) {
	size_t repr = this->representatives[elemIndex];
	size_t result = 0;
	for (size_t i = 0; i < this->numElements; i++) {
		if (this->representatives[i] == repr)
			result++;
	}
	return result;
}


static bool NaiveDisjointSet_areInSameSet(const struct NaiveDisjointSet this[static 1], size_t elemIndex0, size_t elemIndex1) {
	return this->representatives[elemIndex0] == this->representatives[elemIndex1];
}


static bool NaiveDisjointSet_mergeSets(struct NaiveDisjointSet this[static 1], size_t elemIndex0, size_t elemIndex1) {
	size_t repr0 = this->representatives[elemIndex0];
	size_t repr1 = this->representatives[elemIndex1];
	for (size_t i = 0; i < this->numElements; i++) {
		if (this->representatives[i] == repr1)
			this->representatives[i] = repr0;
	}
	return repr0 != repr1;
}


// Returns a uniformly random unsigned integer in the range [0, limit).
static size_t randSize(size_t limit) {
	size_t temp = (size_t)rand();
	if (RAND_MAX < SIZE_MAX) {
		temp = (size_t)RAND_MAX + 1;
		temp += (size_t)rand();
	}
	return temp % limit;
}



/*---- Test suite ----*/

static void testNew(void) {
	struct DisjointSet *ds = DisjointSet_init(10);
	assert(ds->numSets == 10);
	assert(DisjointSet_getSizeOfSet(ds, 0) == 1);
	assert(DisjointSet_getSizeOfSet(ds, 2) == 1);
	assert(DisjointSet_getSizeOfSet(ds, 9) == 1);
	assert(DisjointSet_areInSameSet(ds, 0, 0));
	assert(!DisjointSet_areInSameSet(ds, 0, 1));
	assert(!DisjointSet_areInSameSet(ds, 9, 3));
	DisjointSet_checkStructure(ds);
	DisjointSet_destroy(ds);
}


static void testMerge(void) {
	struct DisjointSet *ds = DisjointSet_init(10);
	assert(DisjointSet_mergeSets(ds, 0, 1));
	DisjointSet_checkStructure(ds);
	assert(ds->numSets == 9);
	assert(DisjointSet_areInSameSet(ds, 0, 1));
	
	assert(DisjointSet_mergeSets(ds, 2, 3));
	DisjointSet_checkStructure(ds);
	assert(ds->numSets == 8);
	assert(DisjointSet_areInSameSet(ds, 2, 3));
	
	assert(!DisjointSet_mergeSets(ds, 2, 3));
	DisjointSet_checkStructure(ds);
	assert(ds->numSets == 8);
	assert(!DisjointSet_areInSameSet(ds, 0, 2));
	
	assert(DisjointSet_mergeSets(ds, 0, 3));
	DisjointSet_checkStructure(ds);
	assert(ds->numSets == 7);
	assert(DisjointSet_areInSameSet(ds, 0, 2));
	assert(DisjointSet_areInSameSet(ds, 3, 0));
	assert(DisjointSet_areInSameSet(ds, 1, 3));
	DisjointSet_destroy(ds);
}


static void testBigMerge(void) {
	const int MAX_RANK = 20;
	const long TRIALS = 10000;
	
	const size_t numElems = (size_t)1 << MAX_RANK;  // Grows exponentially
	struct DisjointSet *ds = DisjointSet_init(numElems);
	for (int level = 0; level < MAX_RANK; level++) {
		size_t mergeStep = (size_t)1 << level;
		size_t incrStep = mergeStep * 2;
		for (size_t i = 0; i < numElems; i += incrStep) {
			assert(!DisjointSet_areInSameSet(ds, i, i + mergeStep));
			assert(DisjointSet_mergeSets(ds, i, i + mergeStep));
		}
		// Now we have a bunch of sets of size 2^(level+1)
		
		// Do random tests
		size_t mask = -incrStep;  // 0b11...100...00
		for (long i = 0; i < TRIALS; i++) {
			size_t j = randSize(numElems);
			size_t k = randSize(numElems);
			bool expect = (j & mask) == (k & mask);
			assert(DisjointSet_areInSameSet(ds, j, k) == expect);
		}
	}
	DisjointSet_destroy(ds);
}


static void testAgainstNaiveRandomly(void) {
	const long TRIALS = 1000;
	const long ITERATIONS = 3000;
	const size_t NUM_ELEMS = 300;
	
	for (long i = 0; i < TRIALS; i++) {
		struct NaiveDisjointSet *nds = NaiveDisjointSet_init(NUM_ELEMS);
		struct DisjointSet *ds = DisjointSet_init(NUM_ELEMS);
		for (long j = 0; j < ITERATIONS; j++) {
			size_t k = randSize(NUM_ELEMS);
			size_t l = randSize(NUM_ELEMS);
			assert(DisjointSet_getSizeOfSet(ds, k) == NaiveDisjointSet_getSizeOfSet(nds, k));
			assert(DisjointSet_areInSameSet(ds, k, l) == NaiveDisjointSet_areInSameSet(nds, k, l));
			if ((double)rand() / RAND_MAX < 0.1)
				assert(DisjointSet_mergeSets(ds, k, l) == NaiveDisjointSet_mergeSets(nds, k, l));
			assert(ds->numSets == NaiveDisjointSet_getNumberOfSets(nds));
			if ((double)rand() / RAND_MAX < 0.001)
				DisjointSet_checkStructure(ds);
		}
		DisjointSet_checkStructure(ds);
		DisjointSet_destroy(ds);
		NaiveDisjointSet_destroy(nds);
	}
}



/*---- Main runner ----*/

int main(void) {
	srand(time(NULL));
	
	testNew();
	testMerge();
	testBigMerge();
	testAgainstNaiveRandomly();
	
	fprintf(stderr, "Test passed\n");
	return EXIT_SUCCESS;
}
