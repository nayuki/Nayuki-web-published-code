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
	
	size: usize,
	
	min_keys: usize,  // At least 1, equal to degree-1
	max_keys: usize,  // At least 3, odd number, equal to min_keys*2+1
	
}


impl <E: std::cmp::Ord> BTreeSet<E> {
	
	// The degree is the minimum number of children each non-root internal node must have.
	pub fn new(degree: usize) -> Self {
		assert!(degree >= 2, "Degree must be at least 2");
		assert!(degree <= std::usize::MAX / 2, "Degree too large");  // In other words, need maxChildren <= USIZE_MAX
		let maxkeys = degree * 2 - 1;
		Self {
			root: Node::new(maxkeys, true),
			size: 0,
			min_keys: degree - 1,
			max_keys: maxkeys,
		}
	}
	
	
	pub fn is_empty(&self) -> bool {
		self.size == 0
	}
	
	
	pub fn len(&self) -> usize {
		self.size
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
			let (middlekey, rightnode) = leftnode.split(self.min_keys, self.max_keys);
			self.root.keys.push(middlekey);
			self.root.children.push(Box::new(leftnode));
			self.root.children.push(rightnode);
		}
		
		// Walk down the tree
		let result = self.root.insert(self.min_keys, self.max_keys, val, true, self.size < std::usize::MAX);
		if result {
			self.size += 1;
		}
		result
	}
	
	
	pub fn remove(&mut self, val: &E) -> bool {
		let (found, index) = self.root.search(val);
		let result = self.root.remove(val, found, index);
		if result {
			assert!(self.size > 0);
			self.size -= 1;
		}
		if self.root.keys.is_empty() && !self.root.is_leaf() {
			assert!(self.root.children.len() == 1);
			self.root = *self.root.children.pop().unwrap();  // Decrement tree height
		}
		result
	}
	
	
	// For unit tests
	pub fn check_structure(&self) {
		// Check size and root node properties
		if self.size <= self.min_keys * 2 {
			assert!(self.root.is_leaf() && self.root.keys.len() == self.size, "Invalid size or root type");
		} else if self.size > self.max_keys {
			assert!(!self.root.is_leaf(), "Invalid size or root type");
		}
		
		// Calculate height by descending into one branch
		let mut height: i8 = 0;
		let mut node = &self.root;
		while !node.is_leaf() {
			height = height.checked_add(1).unwrap();
			node = node.children[0].as_ref();
		}
		
		// Check all nodes and total size
		assert_eq!(self.root.check_structure(true, height, None, None), self.size, "Size mismatch");
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
	
	
	fn insert(&mut self, minkeys: usize, maxkeys: usize, val: E, hasroom: bool, isroot: bool) -> bool {
		// Search for index in current node
		assert!(self.keys.len() < maxkeys);
		assert!(isroot || self.keys.len() >= minkeys);
		let (found, mut index) = self.search(&val);
		if found {
			false  // Key already exists in tree
		} else if self.is_leaf() {  // Simple insertion into leaf
			assert!(hasroom, "Maximum size reached");
			self.keys.insert(index, val);
			true  // Successfully inserted
		} else {  // Handle internal node
			if self.children[index].keys.len() == maxkeys {  // Split child node
				let (middlekey, rightnode) = self.children[index].split(minkeys, maxkeys);
				let cmp = val.cmp(&middlekey);
				self.keys.insert(index, middlekey);
				self.children.insert(index + 1, rightnode);
				match cmp {
					Ordering::Equal   => return false,  // Key already exists in tree
					Ordering::Greater => index += 1,
					Ordering::Less    => {},
				}
			}
			self.children[index].insert(minkeys, maxkeys, val, hasroom, isroot)  // Recurse
		}
	}
	
	
	// Removes and returns the minimum key among the whole subtree rooted at this node.
	fn remove_min(&mut self) -> E {
		assert!(self.keys.len() > self.min_keys());
		if self.is_leaf() {
			self.keys.remove(0)
		} else {
			self.ensure_child_remove(0).remove_min()
		}
	}
	
	
	// Removes and returns the maximum key among the whole subtree rooted at this node.
	fn remove_max(&mut self) -> E {
		assert!(self.keys.len() > self.min_keys());
		if self.is_leaf() {
			self.keys.pop().unwrap()
		} else {
			let end = self.children.len() - 1;
			self.ensure_child_remove(end).remove_max()
		}
	}
	
	
	// Moves the right half of keys and children to a new node, yielding the pair of values
	// (promoted key, new node). The left half of data is still retained in this node.
	fn split(&mut self, minkeys: usize, maxkeys: usize) -> (E,Box<Self>) {
		// Manipulate numbers
		assert!(self.keys.len() == maxkeys);
		let half = minkeys + 1;
		
		// Handle children
		let mut rightnode = Node::<E>::new(maxkeys, self.is_leaf());
		if !self.is_leaf() {
			rightnode.children.extend(self.children.drain(half ..));
		}
		
		// Handle keys
		rightnode.keys.extend(self.keys.drain(half ..));
		(self.keys.pop().unwrap(), Box::new(rightnode))
	}
	
	
	// Merges the child node at index+1 into the child node at index,
	// assuming the current node is not empty and both children have min_keys.
	fn merge_children(&mut self, index: usize) {
		assert!(!self.is_leaf() && !self.keys.is_empty(), "Cannot merge children");
		let minkeys = self.min_keys();
		let middlekey = self.keys.remove(index);
		let mut right = *self.children.remove(index + 1);
		let left = self.children[index].as_mut();
		assert_eq!(left .keys.len(), minkeys, "Cannot merge children");
		assert_eq!(right.keys.len(), minkeys, "Cannot merge children");
		if !left.is_leaf() {
			left.children.extend(right.children.drain(..));
		}
		left.keys.push(middlekey);
		left.keys.extend(right.keys.drain(..));
	}
	
	
	// Performs modifications to ensure that this node's child at the given index has at least
	// min_keys+1 keys in preparation for a single removal. The child may gain a key and subchild
	// from its sibling, or it may be merged with a sibling, or nothing needs to be done.
	// A reference to the appropriate child is returned, which is helpful if the old child no longer exists.
	fn ensure_child_remove(&mut self, mut index: usize) -> &mut Self {
		// Preliminaries
		assert!(!self.is_leaf());
		let minkeys = self.min_keys();
		let childsize = self.children[index].keys.len();
		if childsize > minkeys {  // Already satisfies the condition
			return self.children[index].as_mut();
		}
		assert!(childsize == minkeys);
		
		let internal = !self.children[index].is_leaf();
		let mut leftsize  = 0;
		let mut rightsize = 0;
		if index >= 1 {
			let left = self.children[index - 1].as_ref();
			leftsize = left.keys.len();
			assert_eq!(!left.is_leaf(), internal);  // Sibling must be same type (internal/leaf) as child
		}
		if index < self.keys.len() {
			let right = self.children[index + 1].as_ref();
			rightsize = right.keys.len();
			assert_eq!(!right.is_leaf(), internal);  // Sibling must be same type (internal/leaf) as child
		}
		assert!(leftsize > 0 || rightsize > 0);  // At least one sibling exists because degree >= 2
		
		if leftsize > minkeys {  // Steal rightmost item from left sibling
			if internal {
				let temp = self.children[index - 1].children.pop().unwrap();
				self.children[index].children.insert(0, temp);
			}
			let temp = self.children[index - 1].keys.pop().unwrap();
			let temp = std::mem::replace(&mut self.keys[index - 1], temp);
			self.children[index].keys.insert(0, temp);
		} else if rightsize > minkeys {  // Steal leftmost item from right sibling
			if internal {
				let temp = self.children[index + 1].children.remove(0);
				self.children[index].children.push(temp);
			}
			let temp = self.children[index + 1].keys.remove(0);
			let temp = std::mem::replace(&mut self.keys[index], temp);
			self.children[index].keys.push(temp);
		} else if leftsize == minkeys {  // Merge child into left sibling
			self.merge_children(index - 1);
			index -= 1;  // This is the only case where the return value is different
		} else if rightsize == minkeys {  // Merge right sibling into child
			self.merge_children(index);
		} else {
			unreachable!();
		}
		self.children[index].as_mut()
	}
	
	
	fn remove(&mut self, val: &E, found: bool, index: usize) -> bool {
		assert!(self.keys.len() <= self.max_keys);
		let minkeys = self.min_keys();
		if self.is_leaf() {
			if found {  // Simple removal from leaf
				self.keys.remove(index);
			}
			found
		} else {  // Internal node
			if found {  // Key is stored at current node
				if self.children[index].keys.len() > minkeys {  // Replace key with predecessor
					self.keys[index] = self.children[index].remove_max();
					true
				} else if self.children[index + 1].keys.len() > minkeys {  // Replace key with successor
					self.keys[index] = self.children[index + 1].remove_min();
					true
				} else {  // Merge key and right node into left node, then recurse
					self.merge_children(index);
					self.children[index].remove(val, true, minkeys)  // Index known due to merging; no need to search
				}
			} else {  // Key might be found in some child
				let child = self.ensure_child_remove(index);
				let (found, index) = child.search(val);
				child.remove(val, found, index)
			}
		}
	}
	
	
	// Checks the structure recursively and returns the total number
	// of keys in the subtree rooted at this node. For unit tests.
	fn check_structure(&self, isroot: bool, leafdepth: i8, min: Option<&E>, max: Option<&E>) -> usize {
		// Check basic fields
		let numkeys = self.keys.len();
		assert_eq!(self.is_leaf(), leafdepth == 0, "Incorrect leaf/internal node type");
		assert!(numkeys <= self.max_keys, "Invalid number of keys");
		if isroot {
			assert!(self.is_leaf() || numkeys > 0, "Invalid number of keys");
		} else {
			assert!(numkeys >= self.min_keys(), "Invalid number of keys");
		}
		
		// Check keys for strict increasing order
		for (i, key) in self.keys.iter().enumerate() {
			let mut fail = i == 0 && min.is_some() && *key <= *min.unwrap();
			fail |= i >= 1 && *key <= self.keys[i - 1];
			fail |= i == numkeys - 1 && max.is_some() && *key >= *max.unwrap();
			assert!(!fail, "Invalid key ordering");
		}
		
		// Check children recursively and count keys in this subtree
		let mut count = numkeys;
		if self.is_leaf() {
			assert_eq!(self.children.len(), 0, "Invalid number of children");
		} else {
			assert_eq!(self.children.len(), numkeys + 1, "Invalid number of children");
			// Check children pointers and recurse
			for (i, child) in self.children.iter().enumerate() {
				let temp = child.check_structure(false, leafdepth - 1,
					if i == 0 { min } else { Some(&self.keys[i - 1]) },
					if i == numkeys { max } else { Some(&self.keys[i]) });
				count = count.checked_add(temp).unwrap();
			}
		}
		return count;
	}
	
}
