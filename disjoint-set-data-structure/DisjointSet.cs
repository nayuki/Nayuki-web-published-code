/* 
 * Disjoint-set data structure - Library (C#)
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

using System;


/* 
 * Represents a set of disjoint sets. Also known as the union-find data structure.
 * Main operations are querying if two elements are in the same set, and merging two sets together.
 * Useful for testing graph connectivity, and is used in Kruskal's algorithm.
 */
public sealed class DisjointSet {
	
	/*---- Fields ----*/
	
	// The number of disjoint sets overall. This number decreases monotonically as time progresses;
	// each call to MergeSets() either decrements the number by one or leaves it unchanged. 0 <= NumSets <= NumElements.
	public int NumSets {
		get;
		private set;
	}
	
	private Node[] nodes;
	
	
	
	/*---- Constructors ----*/
	
	// Constructs a new set containing the given number of singleton sets.
	// For example, new DisjointSet(3) --> {{0}, {1}, {2}}.
	public DisjointSet(int numElems) {
		if (numElems < 0)
			throw new ArgumentOutOfRangeException("Number of elements must be non-negative");
		nodes = new Node[numElems];
		for (int i = 0; i < numElems; i++) {
			nodes[i].Parent = i;
			nodes[i].Size = 1;
		}
		NumSets = numElems;
	}
	
	
	
	/*---- Methods ----*/
	
	// Returns the number of elements among the set of disjoint sets; this was the number passed
	// into the constructor and is constant for the lifetime of the object. All the other methods
	// require the argument elemIndex to satisfy 0 <= elemIndex < NumElements.
	public int NumElements {
		get {
			return nodes.Length;
		}
	}
	
	
	// (Private) Returns the representative element for the set containing the given element. This method is also
	// known as "find" in the literature. Also performs path compression, which alters the internal state to
	// improve the speed of future queries, but has no externally visible effect on the values returned.
	private int getRepr(int elemIndex) {
		if (elemIndex < 0 || elemIndex >= nodes.Length)
			throw new IndexOutOfRangeException();
		// Follow parent pointers until we reach a representative
		int parent = nodes[elemIndex].Parent;
		while (true) {
			int grandparent = nodes[parent].Parent;
			if (grandparent == parent)
				return parent;
			nodes[elemIndex].Parent = grandparent;  // Partial path compression
			elemIndex = parent;
			parent = grandparent;
		}
	}
	
	
	// Returns the size of the set that the given element is a member of. 1 <= result <= NumElements.
	public int GetSizeOfSet(int elemIndex) {
		return nodes[getRepr(elemIndex)].Size;
	}
	
	
	// Tests whether the given two elements are members of the same set. Note that the arguments are orderless.
	public bool AreInSameSet(int elemIndex0, int elemIndex1) {
		return getRepr(elemIndex0) == getRepr(elemIndex1);
	}
	
	
	// Merges together the sets that the given two elements belong to. This method is also known as "union" in the literature.
	// If the two elements belong to different sets, then the two sets are merged and the method returns true.
	// Otherwise they belong in the same set, nothing is changed and the method returns false. Note that the arguments are orderless.
	public bool MergeSets(int elemIndex0, int elemIndex1) {
		// Get representatives
		int repr0 = getRepr(elemIndex0);
		int repr1 = getRepr(elemIndex1);
		if (repr0 == repr1)
			return false;
		
		// Compare sizes to choose parent node
		if (nodes[repr0].Size < nodes[repr1].Size) {
			int temp = repr0;
			repr0 = repr1;
			repr1 = temp;
		}
		// Now repr0's size >= repr1's size
		
		// Graft repr1's subtree onto node repr0
		nodes[repr1].Parent = repr0;
		nodes[repr0].Size += nodes[repr1].Size;
		nodes[repr1].Size = 0;
		NumSets--;
		return true;
	}
	
	
	// For unit tests. This detects many but not all invalid data structures, throwing a SystemException
	// if a structural invariant is known to be violated. This always returns silently on a valid object.
	public void CheckStructure() {
		int numRepr = 0;
		for (int i = 0; i < nodes.Length; i++) {
			int parent = nodes[i].Parent;
			int size = nodes[i].Size;
			bool isRepr = parent == i;
			if (isRepr)
				numRepr++;
			
			bool ok = true;
			ok &= 0 <= parent && parent < nodes.Length;
			ok &= !isRepr && size == 0 || isRepr && 1 <= size && size <= nodes.Length;
			if (!ok)
				throw new SystemException();
		}
		if (!(0 <= NumSets && NumSets == numRepr && NumSets <= nodes.Length))
			throw new SystemException();
	}
	
	
	
	private struct Node {
		
		// The index of the parent element. An element is a representative iff its parent is itself.
		public int Parent;
		
		// Positive number if the element is a representative, otherwise zero.
		public int Size;
		
	}
	
}
