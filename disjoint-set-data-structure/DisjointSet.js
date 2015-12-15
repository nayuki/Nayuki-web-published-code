/* 
 * Disjoint-set data structure - Library (JavaScript)
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


/* 
 * Represents a set of disjoint sets. Also known as the union-find data structure.
 * Main operations are querying if two elements are in the same set, and merging two sets together.
 * Useful for testing graph connectivity, and is used in Kruskal's algorithm.
 */

// Constructs a new set containing the given number of singleton sets.
// For example, new DisjointSet(3) --> {{0}, {1}, {2}}.
function DisjointSet(numElems) {
	
	/*---- Fields and constructor ----*/
	
	// Global properties
	var numSets = numElems;
	
	// Per-node properties. This representation is more space-efficient than creating one node object per element.
	var parents = [];  // The index of the parent element. An element is a representative iff its parent is itself.
	var ranks   = [];  // Always in the range [0, floor(log2(numElems))].
	var sizes   = [];  // Positive number if the element is a representative, otherwise zero.
	
	if (numElems <= 0)
		throw "Number of elements must be positive";
	for (var i = 0; i < numElems; i++) {
		parents.push(i);
		ranks.push(0);
		sizes.push(1);
	}
	
	
	/*---- Methods ----*/
	
	// Returns the number of elements among the set of disjoint sets; this was the number passed
	// into the constructor and is constant for the lifetime of the object. All the other methods
	// require the argument elemIndex to satisfy 0 <= elemIndex < getNumberOfElements().
	this.getNumberOfElements = function() {
		return parents.length;
	};
	
	
	// Returns the number of disjoint sets overall. This number decreases monotonically as time progresses;
	// each call to mergeSets() either decrements the number by one or leaves it unchanged.
	this.getNumberOfSets = function() {
		return numSets;
	};
	
	
	// (Private) Returns the representative element for the set containing the given element. This method is also
	// known as "find" in the literature. Also performs path compression, which alters the internal state to
	// improve the speed of future queries, but has no externally visible effect on the values returned.
	function getRepr(elemIndex) {
		if (elemIndex < 0 || elemIndex >= parents.length)
			throw new "Element index out of bounds";
		// Follow parent pointers until we reach a representative
		var parent = parents[elemIndex];
		if (parent == elemIndex)
			return elemIndex;
		while (true) {
			var grandparent = parents[parent];
			if (grandparent == parent)
				return parent;
			parents[elemIndex] = grandparent;  // Partial path compression
			elemIndex = parent;
			parent = grandparent;
		}
	}
	
	
	// Returns the size of the set that the given element is a member of. 1 <= result <= getNumberOfElements().
	this.getSizeOfSet = function(elemIndex) {
		return sizes[getRepr(elemIndex)];
	};
	
	
	// Tests whether the given two elements are members of the same set. Note that the arguments are orderless.
	this.areInSameSet = function(elemIndex0, elemIndex1) {
		return getRepr(elemIndex0) == getRepr(elemIndex1);
	};
	
	
	// Merges together the sets that the given two elements belong to. This method is also known as "union" in the literature.
	// If the two elements belong to different sets, then the two sets are merged and the method returns true.
	// Otherwise they belong in the same set, nothing is changed and the method returns false. Note that the arguments are orderless.
	this.mergeSets = function(elemIndex0, elemIndex1) {
		// Get representatives
		var repr0 = getRepr(elemIndex0);
		var repr1 = getRepr(elemIndex1);
		if (repr0 == repr1)
			return false;
		
		// Compare ranks
		var cmp = ranks[repr0] - ranks[repr1];
		if (cmp == 0)  // Increment repr0's rank if both nodes have same rank
			ranks[repr0]++;
		else if (cmp < 0) {  // Swap to ensure that repr0's rank >= repr1's rank
			var temp = repr0;
			repr0 = repr1;
			repr1 = temp;
		}
		
		// Graft repr1's subtree onto node repr0
		parents[repr1] = repr0;
		sizes[repr0] += sizes[repr1];
		sizes[repr1] = 0;
		numSets--;
		return true;
	};
	
	
	// For unit tests. This detects many but not all invalid data structures, throwing an exception
	// if a structural invariant is known to be violated. This always returns silently on a valid object.
	this.checkStructure = function() {
		var numRepr = 0;
		for (var i = 0; i < parents.length; i++) {
			var parent = parents[i];
			var rank = ranks[i];
			var size = sizes[i];
			var isRepr = parent == i;
			if (isRepr)
				numRepr++;
			
			var ok = true;
			ok &= 0 <= parent && parent < parents.length;
			ok &= 0 <= rank && (isRepr || rank < ranks[parent]);
			ok &= !isRepr && size == 0 || isRepr && size >= (1 << rank);
			if (!ok)
				throw new "Assertion error";
		}
		if (!(1 <= numSets && numSets == numRepr && numSets <= parents.length))
			throw new "Assertion error";
	};
	
}
