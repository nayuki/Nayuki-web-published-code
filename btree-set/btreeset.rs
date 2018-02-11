/* 
 * B-tree set (Rust)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/btree-set
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
use std::cmp::Ordering;


pub struct BTreeSet<E> {
	
	root: Node<E>,
	
	count: usize,
	
	min_keys: usize,  // At least 1, equal to degree-1
	max_keys: usize,  // At least 3, odd number, equal to min_keys*2+1
	
}


impl <E: std::cmp::Ord> BTreeSet<E> {
	
	// The degree is the minimum number of children each non-root internal node must have.
	pub fn new(deg: usize) -> Self {
		assert!(deg >= 2, "Degree must be at least 2");
		assert!(deg <= std::usize::MAX / 2, "Degree too large");  // In other words, need maxChildren <= USIZE_MAX
		let maxkeys = deg * 2 - 1;
		Self {
			root: Node::new(maxkeys, true),
			count: 0,
			min_keys: deg - 1,
			max_keys: maxkeys,
		}
	}
	
	
	pub fn is_empty(&self) -> bool {
		self.count == 0
	}
	
	
	pub fn len(&self) -> usize {
		self.count
	}
	
	
	pub fn clear(&mut self) {
		*self = BTreeSet::new(self.min_keys + 1);
	}
	
	
	pub fn contains(&self, val: &E) -> bool {
		// Walk down the tree
		let mut node: &Node<E> = &self.root;
		loop {
			let (found, index) = node.search(val);
			if found {
				return true;
			} else if node.is_leaf() {
				return false;
			} else {  // Internal node
				node = node.children[index].as_ref();
			}
		}
	}
	
	
	pub fn insert(&mut self, val: E) -> bool {
		// Special preprocessing to split root node
		if self.root.keys.len() == self.max_keys {
			let mut leftnode = std::mem::replace(&mut self.root, Node::new(self.max_keys, false));  // Increment tree height
			let (middlekey, rightnode) = leftnode.split();
			self.root.keys.push(middlekey);
			self.root.children.push(Box::new(leftnode));
			self.root.children.push(rightnode);
		}
		
		// Walk down the tree
		let result = self.root.insert(val, true, self.count < std::usize::MAX);
		if result {
			self.count += 1;
		}
		result
	}
	
}



/*---- Helper class: B-tree node ----*/

struct Node<E> {
	
	// Size is in the range [0, max_keys] for root node, [min_keys, max_keys] for all other nodes.
	keys: Vec<E>,
	
	// If leaf then size is 0, otherwise if internal node then size always equals keys.len()+1.
	children: Vec<Box<Node<E>>>,
	
	max_keys: usize,
	
}


impl <E: std::cmp::Ord> Node<E> {
	
	// Note: Once created, a node's structure never changes between a leaf and internal node.
	fn new(maxkeys: usize, leaf: bool) -> Self {
		assert!(maxkeys >= 3 && maxkeys % 2 == 1);
		Self {
			keys: Vec::with_capacity(maxkeys),
			children: Vec::with_capacity(if leaf { 0 } else { maxkeys + 1 }),
			max_keys: maxkeys,
		}
	}
	
	
	fn min_keys(&self) -> usize {
		self.max_keys / 2
	}
	
	
	fn is_leaf(&self) -> bool {
		self.children.is_empty()
	}
	
	
	// Searches this node's keys vector and returns (true, i) if obj equals keys[i],
	// otherwise returns (false, i) if children[i] should be explored. For simplicity,
	// the implementation uses linear search. It's possible to replace it with binary search for speed.
	fn search(&self, val: &E) -> (bool,usize) {
		let mut i: usize = 0;
		while i < self.keys.len() {
			match val.cmp(&self.keys[i]) {
				Ordering::Equal   => return (true, i),  // Key found
				Ordering::Greater => i += 1,
				Ordering::Less    => break,
			}
		}
		(false, i)  // Not found, caller should recurse on child
	}
	
	
	fn insert(&mut self, val: E, hasroom: bool, isroot: bool) -> bool {
		// Search for index in current node
		assert!(self.keys.len() < self.max_keys);
		assert!(isroot || self.keys.len() >= self.min_keys());
		let (found, mut index) = self.search(&val);
		if found {
			false  // Key already exists in tree
		} else if self.is_leaf() {  // Simple insertion into leaf
			assert!(hasroom, "Maximum size reached");
			self.keys.insert(index, val);
			true  // Successfully inserted
		} else {  // Handle internal node
			if self.children[index].keys.len() == self.max_keys {  // Split child node
				let (middlekey, rightnode) = self.children[index].split();
				let cmp = val.cmp(&middlekey);
				self.keys.insert(index, middlekey);
				self.children.insert(index + 1, rightnode);
				match cmp {
					Ordering::Equal   => return false,  // Key already exists in tree
					Ordering::Greater => index += 1,
					Ordering::Less    => {},
				}
			}
			self.children[index].insert(val, hasroom, isroot)  // Recurse
		}
	}
	
	
	// Moves the right half of keys and children to a new node, yielding the pair of values
	// (promoted key, new node). The left half of data is still retained in this node.
	fn split(&mut self) -> (E,Box<Self>) {
		// Manipulate numbers
		assert!(self.keys.len() == self.max_keys);
		let minkeys = self.max_keys / 2;
		
		// Handle children
		let mut rightnode = Node::<E>::new(self.max_keys, self.is_leaf());
		if !self.is_leaf() {
			rightnode.children.extend(self.children.drain(minkeys + 1 ..));
		}
		
		// Handle keys
		rightnode.keys.extend(self.keys.drain(minkeys + 1 ..));
		(self.keys.pop().unwrap(), Box::new(rightnode))
	}
	
}
