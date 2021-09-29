/* 
 * Disjoint-set data structure - Library (Rust)
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

use std;


/* 
 * Represents a set of disjoint sets. Also known as the union-find data structure.
 * Main operations are querying if two elements are in the same set, and merging two sets together.
 * Useful for testing graph connectivity, and is used in Kruskal's algorithm.
 */
#[derive(Clone)]
pub struct DisjointSet {
	
	numberofsets: usize,
	
	nodes: Vec<DisjointSetNode>,
	
}


// Private helper structure.
#[derive(Clone, Copy)]
struct DisjointSetNode {
	
	// The index of the parent element. An element is a representative iff its parent is itself.
	parent: usize,
	
	// Positive number if the element is a representative, otherwise zero.
	size: usize,
	
}


impl DisjointSet {
	
	// Constructs a new set containing the given number of singleton sets.
	// For example, new DisjointSet(3) --> {{0}, {1}, {2}}.
	pub fn new(numelems: usize) -> Self {
		let mut result = Self {
			numberofsets: 0,
			nodes: Vec::new(),
		};
		for _ in 0 .. numelems {
			result.add_set();
		}
		result
	}
	
	
	// Returns the number of elements among the set of disjoint sets. All the other methods
	// require the argument elemindex to satisfy 0 <= elemindex < number_of_elements().
	pub fn number_of_elems(&self) -> usize {
		self.nodes.len()
	}
	
	
	// The number of disjoint sets overall. 0 <= number_of_sets() <= number_of_elements().
	pub fn number_of_sets(&self) -> usize {
		self.numberofsets
	}
	
	
	// (Private) Returns the representative element for the set containing the given element. This method is also
	// known as "find" in the literature. Also performs path compression, which alters the internal state to
	// improve the speed of future queries, but has no externally visible effect on the values returned.
	fn get_repr(&mut self, mut elemindex: usize) -> usize {
		// Follow parent pointers until we reach a representative
		let mut parent: usize = self.nodes[elemindex].parent;
		loop {
			let grandparent: usize = self.nodes[parent].parent;
			if grandparent == parent {
				return parent;
			}
			self.nodes[elemindex].parent = grandparent;  // Partial path compression
			elemindex = parent;
			parent = grandparent;
		}
	}
	
	
	// Returns the size of the set that the given element is a member of. 1 <= result <= number_of_elements().
	pub fn get_size_of_set(&mut self, elemindex: usize) -> usize {
		let repr = self.get_repr(elemindex);
		self.nodes[repr].size
	}
	
	
	// Tests whether the given two elements are members of the same set. Note that the arguments are orderless.
	pub fn are_in_same_set(&mut self, elemindex0: usize, elemindex1: usize) -> bool {
		self.get_repr(elemindex0) == self.get_repr(elemindex1)
	}
	
	
	// Adds a new singleton set, incrementing number_of_elems() and number_of_sets().
	// Returns the identity of the new element, which equals the old value of number_of_elements().
	pub fn add_set(&mut self) -> usize {
		let elemindex = self.number_of_elems();
		self.nodes.push(DisjointSetNode{parent: elemindex, size: 1});
		self.numberofsets += 1;
		elemindex
	}
	
	
	// Merges together the sets that the given two elements belong to. This method is also known as "union" in the literature.
	// If the two elements belong to different sets, then the two sets are merged and the method returns true.
	// Otherwise they belong in the same set, nothing is changed and the method returns false. Note that the arguments are orderless.
	pub fn merge_sets(&mut self, elemindex0: usize, elemindex1: usize) -> bool {
		// Get representatives
		let mut repr0: usize = self.get_repr(elemindex0);
		let mut repr1: usize = self.get_repr(elemindex1);
		if repr0 == repr1 {
			return false;
		}
		
		// Compare sizes to choose parent node
		if self.nodes[repr0].size < self.nodes[repr1].size {
			std::mem::swap(&mut repr0, &mut repr1);
		}
		// Now repr0's size >= repr1's size
		
		// Graft repr1's subtree onto node repr0
		self.nodes[repr1].parent = repr0;
		self.nodes[repr0].size += self.nodes[repr1].size;
		self.nodes[repr1].size = 0;
		self.numberofsets -= 1;
		true
	}
	
	
	// For unit tests. This detects many but not all invalid data structures, panicking if a
	// structural invariant is known to be violated. This always returns silently on a valid object.
	pub fn check_structure(&self) {
		let mut numrepr: usize = 0;
		for (i, node) in self.nodes.iter().enumerate() {
			let isrepr: bool = node.parent == i;
			numrepr = numrepr.checked_add(usize::from(isrepr)).unwrap();
			assert!(node.parent < self.nodes.len());
			assert!(!isrepr && node.size == 0 || isrepr && (1 ..= self.nodes.len()).contains(&node.size));
		}
		assert_eq!(self.numberofsets, numrepr);
		assert!(self.numberofsets <= self.nodes.len());
	}
	
}
