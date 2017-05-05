/* 
 * Disjoint-set data structure - Library header (C++)
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

#include <cstddef>
#include <vector>


/* 
 * Represents a set of disjoint sets. Also known as the union-find data structure.
 * Main operations are querying if two elements are in the same set, and merging two sets together.
 * Useful for testing graph connectivity, and is used in Kruskal's algorithm.
 */
class DisjointSet final {
	
	/*---- Helper structure ----*/
	
	private: struct Node final {
		// The index of the parent element. An element is a representative iff its parent is itself. Mutable due to path compression.
		mutable std::size_t parent;
		// Always in the range [0, floor(log2(numElems))]. For practical computers, this has a maximum value of 64.
		// Note that signed char is guaranteed to cover at least the range [0, 127].
		signed char rank;
		// Positive number if the element is a representative, otherwise zero.
		std::size_t size;
	};
	
	
	/*---- Fields ----*/
	
	private: std::vector<Node> nodes;
	private: std::size_t numSets;
	
	
	/*---- Constructors ----*/
	
	// Constructs a new set containing the given number of singleton sets.
	// For example, DisjointSet(3) --> {{0}, {1}, {2}}.
	public: DisjointSet(std::size_t numElems);
	
	
	/*---- Methods ----*/
	
	// Returns the number of elements among the set of disjoint sets; this was the number passed
	// into the constructor and is constant for the lifetime of the object. All the other methods
	// require the argument elemIndex to satisfy 0 <= elemIndex < getNumberOfElements().
	public: std::size_t getNumberOfElements() const;
	
	
	// Returns the number of disjoint sets overall. This number decreases monotonically as time progresses;
	// each call to mergeSets() either decrements the number by one or leaves it unchanged. 1 <= result <= getNumberOfElements().
	public: std::size_t getNumberOfSets() const;
	
	
	// Returns the size of the set that the given element is a member of. 1 <= result <= getNumberOfElements().
	public: std::size_t getSizeOfSet(std::size_t elemIndex) const;
	
	
	// Tests whether the given two elements are members of the same set. Note that the arguments are orderless.
	public: bool areInSameSet(std::size_t elemIndex0, std::size_t elemIndex1) const;
	
	
	// Merges together the sets that the given two elements belong to. This method is also known as "union" in the literature.
	// If the two elements belong to different sets, then the two sets are merged and the method returns true.
	// Otherwise they belong in the same set, nothing is changed and the method returns false. Note that the arguments are orderless.
	public: bool mergeSets(std::size_t elemIndex0, std::size_t elemIndex1);
	
	
	// For unit tests. This detects many but not all invalid data structures, throwing an exception
	// if a structural invariant is known to be violated. This always returns silently on a valid object.
	public: void checkStructure() const;
	
	
	// (Private) Returns the representative element for the set containing the given element. This method is also
	// known as "find" in the literature. Also performs path compression, which alters the internal state to
	// improve the speed of future queries, but has no externally visible effect on the values returned.
	private: std::size_t getRepr(std::size_t elemIndex) const;
	
};
