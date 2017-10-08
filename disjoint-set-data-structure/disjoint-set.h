/* 
 * Disjoint-set data structure - Library header (C)
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

#pragma once

#include <stdbool.h>
#include <stddef.h>


/*---- Data structure types ----*/

// Private structure, for internal use only.
struct DisjointSetNode {
	
	// The index of the parent element. An element is a representative
	// iff its parent is itself. Mutable due to path compression.
	size_t parent;
	
	// Always in the range [0, floor(log2(numElems))]. For practical computers, this has a maximum
	// value of 64. Note that signed char is guaranteed to cover at least the range [0, 127].
	signed char rank;
	
	// Positive number if the element is a representative, otherwise zero.
	size_t size;
	
};


// Public structure.
struct DisjointSet {
	
	// The number of elements among the set of disjoint sets; this was the number passed
	// into the constructor and is constant for the lifetime of the object. The various
	// functions require the argument elemIndex to satisfy 0 <= elemIndex < numElements.
	// Publicly readable and never writable.
	size_t numElements;
	
	// The current number of disjoint sets overall. This number decreases monotonically as time
	// progresses; each call to mergeSets() either decrements the number by one or leaves it
	// unchanged. 0 <= numSets <= numElements(). Publicly readable but only privately writable.
	size_t numSets;
	
	// The internal nodes representing the disjoint-set data structure.
	// Only privately readable and writable. Flexible array member (C99 and above, unsupported in C++).
	struct DisjointSetNode nodes[];
	
};



/*---- Constructors/destructors ----*/

// Constructs a new set containing the given number of singleton sets.
// For example, DisjointSet_init(3) --> {{0}, {1}, {2}}.
struct DisjointSet *DisjointSet_init(size_t numElems);


// Releases the memory for a disjoint-set data structure object. The argument can be NULL.
// Do not attempt to call free() on the pointer, because there may be internal structures and other
// implementation details. This function returns NULL to facilitate this code idiom: ds = destroy(ds);
struct DisjointSet *DisjointSet_destroy(struct DisjointSet *this);



/*---- Object methods ----*/

// Note that most methods take a (struct DisjointSet *) instead of a (const struct DisjointSet *)
// because they use the private function getRepr() which performs path compression. Path compression
// mutates and optimizes the data structure, but without affecting the answers returned.

// Returns the size of the set that the given element is a member of. 1 <= result <= numElements.
size_t DisjointSet_getSizeOfSet(struct DisjointSet *this, size_t elemIndex);


// Tests whether the given two elements are members of the same set. Note that the arguments are orderless.
bool DisjointSet_areInSameSet(struct DisjointSet *this, size_t elemIndex0, size_t elemIndex1);


// Merges together the sets that the given two elements belong to. This method is also known as "union" in the literature.
// If the two elements belong to different sets, then the two sets are merged and the method returns true.
// Otherwise they belong in the same set, nothing is changed and the method returns false. Note that the arguments are orderless.
bool DisjointSet_mergeSets(struct DisjointSet *this, size_t elemIndex0, size_t elemIndex1);


// For unit tests. This detects many but not all invalid data structures, failing an assert() if
// a structural invariant is known to be violated. This always returns silently on a valid object.
void DisjointSet_checkStructure(const struct DisjointSet *this);
