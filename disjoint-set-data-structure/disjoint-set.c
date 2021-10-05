/* 
 * Disjoint-set data structure - Library implementation (C)
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

#include <assert.h>
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include "disjoint-set.h"


struct DisjointSet *DisjointSet_init(size_t numElems) {
	// Compute size carefully to avoid overflow
	size_t temp = sizeof(struct DisjointSetNode);
	if (SIZE_MAX / temp < numElems)
		return NULL;
	temp *= numElems;
	if (SIZE_MAX - temp < sizeof(struct DisjointSet))
		return NULL;
	temp += sizeof(struct DisjointSet);
	struct DisjointSet *result = malloc(temp);
	if (result == NULL)
		return NULL;
	
	// Initialize fields and nodes
	result->numElements = numElems;
	result->numSets = numElems;
	for (size_t i = 0; i < numElems; i++)
		result->nodes[i] = (struct DisjointSetNode){i, 1};
	return result;
}


struct DisjointSet *DisjointSet_destroy(struct DisjointSet this[static 1]) {
	free(this);
	return NULL;
}


// (Private) Returns the representative element for the set containing the given element. This method is also
// known as "find" in the literature. Also performs path compression, which alters the internal state to
// improve the speed of future queries, but has no externally visible effect on the values returned.
static size_t getRepr(struct DisjointSet this[static 1], size_t elemIndex) {
	assert(elemIndex < this->numElements);
	// Follow parent pointers until we reach a representative
	size_t parent = this->nodes[elemIndex].parent;
	while (true) {
		size_t grandparent = this->nodes[parent].parent;
		if (grandparent == parent)
			return parent;
		this->nodes[elemIndex].parent = grandparent;  // Partial path compression
		elemIndex = parent;
		parent = grandparent;
	}
}


size_t DisjointSet_getSizeOfSet(struct DisjointSet this[static 1], size_t elemIndex) {
	return this->nodes[getRepr(this, elemIndex)].size;
}


bool DisjointSet_areInSameSet(struct DisjointSet this[static 1], size_t elemIndex0, size_t elemIndex1) {
	return getRepr(this, elemIndex0) == getRepr(this, elemIndex1);
}


bool DisjointSet_mergeSets(struct DisjointSet this[static 1], size_t elemIndex0, size_t elemIndex1) {
	// Get representatives
	size_t repr0 = getRepr(this, elemIndex0);
	size_t repr1 = getRepr(this, elemIndex1);
	if (repr0 == repr1)
		return false;
	
	// Compare sizes to choose parent node
	if (this->nodes[repr0].size < this->nodes[repr1].size) {
		size_t temp = repr0;
		repr0 = repr1;
		repr1 = temp;
	}
	// Now repr0's size >= repr1's size
	
	// Graft repr1's subtree onto node repr0
	this->nodes[repr1].parent = repr0;
	this->nodes[repr0].size += this->nodes[repr1].size;
	this->nodes[repr1].size = 0;
	this->numSets--;
	return true;
}


void DisjointSet_checkStructure(const struct DisjointSet this[static 1]) {
	size_t numRepr = 0;
	size_t sizeSum = 0;
	for (size_t i = 0; i < this->numElements; i++) {
		const struct DisjointSetNode *node = &this->nodes[i];
		bool isRepr = node->parent == i;
		if (isRepr)
			numRepr++;
		
		assert(node->parent < this->numElements);
		assert((!isRepr && node->size == 0) || (isRepr && 1 <= node->size && node->size <= this->numElements && node->size <= SIZE_MAX - sizeSum));
		sizeSum += node->size;
	}
	assert(this->numSets == numRepr && this->numSets <= this->numElements && this->numElements == sizeSum);
}
