/* 
 * Disjoint-set data structure - Library (TypeScript)
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
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


/* 
 * Represents a set of disjoint sets. Also known as the union-find data structure.
 * Main operations are querying if two elements are in the same set, and merging two sets together.
 * Useful for testing graph connectivity, and is used in Kruskal's algorithm.
 */
class DisjointSet {
	
	// Global properties
	private numSets: number;
	
	// Per-node property arrays. This representation is more space-efficient than creating one node object per element.
	private parents: Array<number> = [];  // The index of the parent element. An element is a representative iff its parent is itself.
	private ranks  : Array<number> = [];  // Always in the range [0, floor(log2(numElems))].
	private sizes  : Array<number> = [];  // Positive number if the element is a representative, otherwise zero.
	
	
	// Constructs a new set containing the given number of singleton sets.
	// For example, new DisjointSet(3) --> {{0}, {1}, {2}}.
	public constructor(numElems: number) {
		if (numElems < 0)
			throw "Number of elements must be non-negative";
		this.numSets = numElems;
		for (let i = 0; i < numElems; i++) {
			this.parents.push(i);
			this.ranks  .push(0);
			this.sizes  .push(1);
		}
	}
	
	
	// Returns the number of elements among the set of disjoint sets; this was the number passed
	// into the constructor and is constant for the lifetime of the object. All the other methods
	// require the argument elemIndex to satisfy 0 <= elemIndex < getNumberOfElements().
	public getNumberOfElements(): number {
		return this.parents.length;
	}
	
	
	// Returns the number of disjoint sets overall. This number decreases monotonically as time progresses;
	// each call to mergeSets() either decrements the number by one or leaves it unchanged. 0 <= result <= getNumberOfElements().
	public getNumberOfSets(): number {
		return this.numSets;
	}
	
	
	// Returns the size of the set that the given element is a member of. 1 <= result <= getNumberOfElements().
	public getSizeOfSet(elemIndex: number): number {
		return this.sizes[this.getRepr(elemIndex)];
	}
	
	
	// Tests whether the given two elements are members of the same set. Note that the arguments are orderless.
	public areInSameSet(elemIndex0: number, elemIndex1: number): boolean {
		return this.getRepr(elemIndex0) == this.getRepr(elemIndex1);
	}
	
	
	// Merges together the sets that the given two elements belong to. This method is also known as "union" in the literature.
	// If the two elements belong to different sets, then the two sets are merged and the method returns true.
	// Otherwise they belong in the same set, nothing is changed and the method returns false. Note that the arguments are orderless.
	public mergeSets(elemIndex0: number, elemIndex1: number): boolean {
		// Get representatives
		let repr0: number = this.getRepr(elemIndex0);
		let repr1: number = this.getRepr(elemIndex1);
		if (repr0 == repr1)
			return false;
		
		// Compare ranks
		const cmp: number = this.ranks[repr0] - this.ranks[repr1];
		if (cmp == 0)  // Increment repr0's rank if both nodes have same rank
			this.ranks[repr0]++;
		else if (cmp < 0) {  // Swap to ensure that repr0's rank >= repr1's rank
			let temp: number = repr0;
			repr0 = repr1;
			repr1 = temp;
		}
		
		// Graft repr1's subtree onto node repr0
		this.parents[repr1] = repr0;
		this.sizes[repr0] += this.sizes[repr1];
		this.sizes[repr1] = 0;
		this.numSets--;
		return true;
	}
	
	
	// Returns the representative element for the set containing the given element. This method is also
	// known as "find" in the literature. Also performs path compression, which alters the internal state to
	// improve the speed of future queries, but has no externally visible effect on the values returned.
	private getRepr(elemIndex: number): number {
		if (elemIndex < 0 || elemIndex >= this.parents.length)
			throw "Element index out of bounds";
		// Follow parent pointers until we reach a representative
		let parent: number = this.parents[elemIndex];
		while (true) {
			const grandparent: number = this.parents[parent];
			if (grandparent == parent)
				return parent;
			this.parents[elemIndex] = grandparent;  // Partial path compression
			elemIndex = parent;
			parent = grandparent;
		}
	}
	
	
	// For unit tests. This detects many but not all invalid data structures, throwing an exception
	// if a structural invariant is known to be violated. This always returns silently on a valid object.
	public checkStructure(): void {
		let numRepr: number = 0;
		for (let i = 0; i < this.parents.length; i++) {
			const parent: number = this.parents[i];
			const rank  : number = this.ranks  [i];
			const size  : number = this.sizes  [i];
			const isRepr: boolean = parent == i;
			if (isRepr)
				numRepr++;
			
			let ok: boolean = true;
			ok = ok && 0 <= parent && parent < this.parents.length;
			ok = ok && 0 <= rank && (isRepr || rank < this.ranks[parent]);
			ok = ok && (!isRepr && size == 0 || isRepr && size >= (1 << rank));
			if (!ok)
				throw "Assertion error";
		}
		if (!(0 <= this.numSets && this.numSets == numRepr && this.numSets <= this.parents.length))
			throw "Assertion error";
	}
	
}
