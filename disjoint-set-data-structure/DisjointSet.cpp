/* 
 * Disjoint-set data structure - Library implementation (C++)
 * 
 * Copyright (c) 2015 Project Nayuki
 * https://www.nayuki.io/page/disjoint-set-data-structure
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

#include "DisjointSet.hpp"


DisjointSet::DisjointSet(size_t numElems) {
	if (numElems == 0)
		throw "Number of elements must be positive";
	nodes.reserve(numElems);
	for (size_t i = 0; i < numElems; i++) {
		Node node = {i, 0, 1};
		nodes.push_back(node);
	}
	numSets = numElems;
}


size_t DisjointSet::getNumberOfElements() const {
	return nodes.size();
}


size_t DisjointSet::getNumberOfSets() const {
	return numSets;
}


size_t DisjointSet::getRepr(size_t elemIndex) const {
	if (elemIndex >= nodes.size())
		throw "Element index out of bounds";
	// Follow parent pointers until we reach a representative
	size_t parent = nodes[elemIndex].parent;
	if (parent == elemIndex)
		return elemIndex;
	while (true) {
		size_t grandparent = nodes[parent].parent;
		if (grandparent == parent)
			return parent;
		nodes[elemIndex].parent = grandparent;  // Partial path compression
		elemIndex = parent;
		parent = grandparent;
	}
}


size_t DisjointSet::getSizeOfSet(size_t elemIndex) const {
	return nodes[getRepr(elemIndex)].size;
}


bool DisjointSet::areInSameSet(size_t elemIndex0, size_t elemIndex1) const {
	return getRepr(elemIndex0) == getRepr(elemIndex1);
}


bool DisjointSet::mergeSets(size_t elemIndex0, size_t elemIndex1) {
	// Get representatives
	size_t repr0 = getRepr(elemIndex0);
	size_t repr1 = getRepr(elemIndex1);
	if (repr0 == repr1)
		return false;
	
	// Compare ranks
	int cmp = nodes[repr0].rank - nodes[repr1].rank;
	// Note: The computation of cmp does not overflow. 0 <= ranks[i] <= SCHAR_MAX, so SCHAR_MIN <= -SCHAR_MAX <= ranks[i] - ranks[j] <= SCHAR_MAX.
	// The result actually fits in a signed char, and with sizeof(char) <= sizeof(int), the promotion to int still guarantees the result fits.
	if (cmp == 0)  // Increment repr0's rank if both nodes have same rank
		nodes[repr0].rank++;
	else if (cmp < 0) {  // Swap to ensure that repr0's rank >= repr1's rank
		size_t temp = repr0;
		repr0 = repr1;
		repr1 = temp;
	}
	
	// Graft repr1's subtree onto node repr0
	nodes[repr1].parent = repr0;
	nodes[repr0].size += nodes[repr1].size;
	nodes[repr1].size = 0;
	numSets--;
	return true;
}


void DisjointSet::checkStructure() const {
	size_t numRepr = 0;
	for (size_t i = 0; i < nodes.size(); i++) {
		const Node &node = nodes.at(i);
		bool isRepr = node.parent == i;
		if (isRepr)
			numRepr++;
		
		bool ok = true;
		ok &= node.parent < nodes.size();
		ok &= 0 <= node.rank && (isRepr || node.rank < nodes[node.parent].rank);
		ok &= (!isRepr && node.size == 0) || (isRepr && node.size >= ((size_t)1 << node.rank));
		if (!ok)
			throw "Assertion error";
	}
	if (!(1 <= numSets && numSets == numRepr && numSets <= nodes.size()))
		throw "Assertion error";
}
