/* 
 * Disjoint-set data structure - Library (C++)
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

#pragma once

#include <cstddef>
#include <cstdint>
#include <limits>
#include <stdexcept>
#include <type_traits>
#include <utility>
#include <vector>


/* 
 * Represents a set of disjoint sets. Also known as the union-find data structure.
 * Main operations are querying if two elements are in the same set, and merging two sets together.
 * Useful for testing graph connectivity, and is used in Kruskal's algorithm.
 * The parameter S can be any integer type, such as size_t. For any given S, the maximum number
 * of sets is S_MAX. Using a smaller type like int8_t can help save memory compared to uint64_t.
 */
template <typename S>
class DisjointSet final {
	
	/*---- Helper structure ----*/
	
	private: struct Node final {
		// The index of the parent element. An element is a representative
		// iff its parent is itself. Mutable due to path compression.
		mutable S parent;
		
		// Positive number if the element is a representative, otherwise zero.
		S size;
	};
	
	
	
	/*---- Fields ----*/
	
	private: std::vector<Node> nodes;
	private: S numSets = 0;
	
	
	
	/*---- Constructors ----*/
	
	// Constructs a new set containing the given number of singleton sets.
	// For example, DisjointSet(3) --> {{0}, {1}, {2}}.
	// Even if S has a wider range than size_t, it is required that 1 <= numElems <= SIZE_MAX.
	public: explicit DisjointSet(S numElems) {
		if (numElems < 0)
			throw std::domain_error("Number of elements must be non-negative");
		if (!safeLessEquals(numElems, SIZE_MAX))
			throw std::length_error("Number of elements too large");
		nodes.reserve(static_cast<std::size_t>(numElems));
		for (S i = 0; i < numElems; i++)
			addSet();
	}
	
	
	public: explicit DisjointSet(const DisjointSet &other) = default;
	
	
	public: DisjointSet(DisjointSet &&other) = default;
	
	
	public: DisjointSet &operator=(DisjointSet other) {
		std::swap(nodes  , other.nodes  );
		std::swap(numSets, other.numSets);
		return *this;
	}
	
	
	
	/*---- Methods ----*/
	
	// Returns the number of elements among the set of disjoint sets. All the other methods
	// require the argument elemIndex to satisfy 0 <= elemIndex < getNumberOfElements().
	public: S getNumberOfElements() const {
		return static_cast<S>(nodes.size());
	}
	
	
	// Returns the number of disjoint sets overall. 0 <= result <= getNumberOfElements().
	public: S getNumberOfSets() const {
		return numSets;
	}
	
	
	// Returns the size of the set that the given element is a member of. 1 <= result <= getNumberOfElements().
	public: S getSizeOfSet(S elemIndex) const {
		return nodes.at(getRepr(elemIndex)).size;
	}
	
	
	// Tests whether the given two elements are members of the same set. Note that the arguments are orderless.
	public: bool areInSameSet(S elemIndex0, S elemIndex1) const {
		return getRepr(elemIndex0) == getRepr(elemIndex1);
	}
	
	
	// Adds a new singleton set, incrementing getNumberOfElements() and getNumberOfSets().
	// Returns the identity of the new element, which equals the old value of getNumberOfElements().
	public: S addSet() {
		S elemIndex = getNumberOfElements();
		if (elemIndex == std::numeric_limits<S>::max())
			throw std::overflow_error("Maximum set size reached");
		nodes.push_back(Node{elemIndex, 1});
		numSets++;
		return elemIndex;
	}
	
	
	// Merges together the sets that the given two elements belong to. This method is also known as "union" in the literature.
	// If the two elements belong to different sets, then the two sets are merged and the method returns true.
	// Otherwise they belong in the same set, nothing is changed and the method returns false. Note that the arguments are orderless.
	public: bool mergeSets(S elemIndex0, S elemIndex1) {
		// Get representatives
		std::size_t repr0 = getRepr(elemIndex0);
		std::size_t repr1 = getRepr(elemIndex1);
		if (repr0 == repr1)
			return false;
		
		// Compare sizes to choose parent node
		if (nodes.at(repr0).size < nodes.at(repr1).size)
			std::swap(repr0, repr1);
		// Now repr0's size >= repr1's size
		
		// Graft repr1's subtree onto node repr0
		nodes.at(repr1).parent = repr0;
		nodes.at(repr0).size += nodes.at(repr1).size;
		nodes.at(repr1).size = 0;
		numSets--;
		return true;
	}
	
	
	// For unit tests. This detects many but not all invalid data structures, throwing an exception
	// if a structural invariant is known to be violated. This always returns silently on a valid object.
	public: void checkStructure() const {
		S numRepr = 0;
		S i = 0;
		for (const Node &node : nodes) {
			bool isRepr = node.parent == i;
			if (isRepr)
				numRepr++;
			
			bool ok = true;
			ok &= 0 <= node.parent && safeLessThan(node.parent, nodes.size());
			ok &= 0 <= node.size && safeLessEquals(node.size, nodes.size());
			ok &= (!isRepr && node.size == 0) || (isRepr && 1 <= node.size && safeLessEquals(node.size, nodes.size()));
			if (!ok)
				throw std::logic_error("Assertion error");
			i++;
		}
		if (!(0 <= numSets && numSets == numRepr && safeLessEquals(numSets, nodes.size())))
			throw std::logic_error("Assertion error");
	}
	
	
	// Returns the representative element for the set containing the given element. This method is also
	// known as "find" in the literature. Also performs path compression, which alters the internal state to
	// improve the speed of future queries, but has no externally visible effect on the values returned.
	private: S getRepr(S elemIndex) const {
		// Follow parent pointers until we reach a representative
		S parent = nodes.at(static_cast<std::size_t>(elemIndex)).parent;
		while (true) {
			S grandparent = nodes.at(static_cast<std::size_t>(parent)).parent;
			if (grandparent == parent)
				return parent;
			nodes.at(static_cast<std::size_t>(elemIndex)).parent = grandparent;  // Partial path compression
			elemIndex = parent;
			parent = grandparent;
		}
	}
	
	
	private: static bool safeLessThan(S x, std::size_t y) {
		return (std::is_signed<S>::value && x < 0) ||
			static_cast<typename std::make_unsigned<S>::type>(x) < y;
	}
	
	
	private: static bool safeLessEquals(S x, std::size_t y) {
		return (std::is_signed<S>::value && x < 0) ||
			static_cast<typename std::make_unsigned<S>::type>(x) <= y;
	}
	
};
