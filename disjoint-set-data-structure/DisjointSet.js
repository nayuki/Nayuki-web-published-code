/*
 * Disjoint-set data structure - Library (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki. (MIT License)
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
"use strict";
/*
 * Represents a set of disjoint sets. Also known as the union-find data structure.
 * Main operations are querying if two elements are in the same set, and merging two sets together.
 * Useful for testing graph connectivity, and is used in Kruskal's algorithm.
 */
class DisjointSet {
    // Constructs a new set containing the given number of singleton sets.
    // For example, new DisjointSet(3) --> {{0}, {1}, {2}}.
    constructor(numElems) {
        // Global properties
        this.numSets = 0;
        // Per-node property arrays. This representation is more space-efficient than creating one node object per element.
        this.parents = []; // The index of the parent element. An element is a representative iff its parent is itself.
        this.sizes = []; // Positive number if the element is a representative, otherwise zero.
        if (numElems < 0)
            throw new RangeError("Number of elements must be non-negative");
        for (let i = 0; i < numElems; i++)
            this.addSet();
    }
    // Returns the number of elements among the set of disjoint sets. All the other methods
    // require the argument elemIndex to satisfy 0 <= elemIndex < getNumElements().
    getNumElements() {
        return this.parents.length;
    }
    // Returns the number of disjoint sets overall. 0 <= result <= getNumElements().
    getNumSets() {
        return this.numSets;
    }
    // Returns the representative element for the set containing the given element. This method is also
    // known as "find" in the literature. Also performs path compression, which alters the internal state to
    // improve the speed of future queries, but has no externally visible effect on the values returned.
    getRepr(elemIndex) {
        if (elemIndex < 0 || elemIndex >= this.parents.length)
            throw new RangeError("Element index out of bounds");
        // Follow parent pointers until we reach a representative
        let parent = this.parents[elemIndex];
        while (true) {
            const grandparent = this.parents[parent];
            if (grandparent == parent)
                return parent;
            this.parents[elemIndex] = grandparent; // Partial path compression
            elemIndex = parent;
            parent = grandparent;
        }
    }
    // Returns the size of the set that the given element is a member of. 1 <= result <= getNumElements().
    getSizeOfSet(elemIndex) {
        return this.sizes[this.getRepr(elemIndex)];
    }
    // Tests whether the given two elements are members of the same set. Note that the arguments are orderless.
    areInSameSet(elemIndex0, elemIndex1) {
        return this.getRepr(elemIndex0) == this.getRepr(elemIndex1);
    }
    // Adds a new singleton set, incrementing getNumElements() and getNumSets().
    // Returns the identity of the new element, which equals the old value of getNumElements().
    addSet() {
        const elemIndex = this.getNumElements();
        this.parents.push(elemIndex);
        this.sizes.push(1);
        this.numSets++;
        return elemIndex;
    }
    // Merges together the sets that the given two elements belong to. This method is also known as "union" in the literature.
    // If the two elements belong to different sets, then the two sets are merged and the method returns true.
    // Otherwise they belong in the same set, nothing is changed and the method returns false. Note that the arguments are orderless.
    mergeSets(elemIndex0, elemIndex1) {
        // Get representatives
        let repr0 = this.getRepr(elemIndex0);
        let repr1 = this.getRepr(elemIndex1);
        if (repr0 == repr1)
            return false;
        // Compare sizes to choose parent node
        if (this.sizes[repr0] < this.sizes[repr1]) {
            let temp = repr0;
            repr0 = repr1;
            repr1 = temp;
        }
        // Now repr0's size >= repr1's size
        // Graft repr1's subtree onto node repr0
        this.parents[repr1] = repr0;
        this.sizes[repr0] += this.sizes[repr1];
        this.sizes[repr1] = 0;
        this.numSets--;
        return true;
    }
    // For unit tests. This detects many but not all invalid data structures, throwing an exception
    // if a structural invariant is known to be violated. This always returns silently on a valid object.
    checkStructure() {
        let numRepr = 0;
        let sizeSum = 0;
        for (let i = 0; i < this.parents.length; i++) {
            const parent = this.parents[i];
            const size = this.sizes[i];
            const isRepr = parent == i;
            if (isRepr)
                numRepr++;
            let ok = true;
            ok = ok && 0 <= parent && parent < this.parents.length;
            ok = ok && (!isRepr && size == 0 || isRepr && 1 <= size && size <= this.parents.length);
            if (!ok)
                throw new Error("Assertion error");
            sizeSum += size;
        }
        if (!(0 <= this.numSets && this.numSets == numRepr && this.numSets <= this.parents.length && this.parents.length == sizeSum))
            throw new Error("Assertion error");
    }
}
