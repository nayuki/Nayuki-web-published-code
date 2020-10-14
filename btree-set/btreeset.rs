/* 
 * B-tree set (Rust)
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
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


#[derive(Clone)]
pub struct BTreeSet<E> {
	
	root: Node<E>,
	size: usize,
	
	min_keys: usize,  // At least 1, equal to degree-1, immutable
	max_keys: usize,  // At least 3, odd number, equal to min_keys*2+1, immutable
	
}


impl<E: std::cmp::Ord> BTreeSet<E> {
	
	// The degree is the minimum number of children each non-root internal node must have.
	pub fn new(degree: usize) -> Self {
		assert!(degree >= 2, "Degree must be at least 2");
		// In other words, need maxChildren <= USIZE_MAX
		assert!(degree <= std::usize::MAX / 2, "Degree too large");
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
		*self = Self::new(self.min_keys + 1);
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
				node = &node.children[index];
			}
		}
	}
	
	
	pub fn insert(&mut self, val: E) -> bool {
		// Special preprocessing to split root node
		if self.root.keys.len() == self.max_keys {
			let child = std::mem::replace(&mut self.root,
				Node::new(self.max_keys, false));  // Increment tree height
			self.root.children.push(child);
			self.root.split_child(self.min_keys, self.max_keys, 0);
		}
		
		// Walk down the tree
		let mut node = &mut self.root;
		let mut isroot = true;
		loop {
			// Search for index in current node
			assert!(node.keys.len() < self.max_keys);
			assert!(isroot || node.keys.len() >= self.min_keys);
			let (found, mut index) = node.search(&val);
			if found {
				return false;  // Key already exists in tree
			} else if node.is_leaf() {  // Simple insertion into leaf
				assert!(self.size < std::usize::MAX, "Maximum size reached");
				node.keys.insert(index, val);
				self.size += 1;
				return true;
			} else {  // Handle internal node
				if node.children[index].keys.len() == self.max_keys {  // Split child node
					node.split_child(self.min_keys, self.max_keys, index);
					match val.cmp(&node.keys[index]) {
						Ordering::Equal   => return false,  // Key already exists in tree
						Ordering::Greater => index += 1,
						Ordering::Less    => {},
					}
				}
				node = &mut node.children[index];
				isroot = false;
			}
		}
	}
	
	
	pub fn remove(&mut self, val: &E) -> bool {
		let result = self.remove_sub(val);
		if result {
			assert!(self.size > 0);
			self.size -= 1;
		}
		if self.root.keys.is_empty() && !self.root.is_leaf() {
			assert_eq!(self.root.children.len(), 1);
			self.root = self.root.children.pop().unwrap();  // Decrement tree height
		}
		result
	}
	
	
	fn remove_sub(&mut self, val: &E) -> bool {
		// Walk down the tree
		let (mut found, mut index) = self.root.search(val);
		let mut node = &mut self.root;
		let mut isroot = true;
		loop {
			assert!(node.keys.len() <= self.max_keys);
			assert!(isroot || node.keys.len() > self.min_keys);
			if node.is_leaf() {
				if found {  // Simple removal from leaf
					node.keys.remove(index);
				}
				return found;
			} else {  // Internal node
				if found {  // Key is stored at current node
					if node.children[index].keys.len() > self.min_keys {  // Replace key with predecessor
						node.keys[index] = node.children[index].remove_max(self.min_keys);
						return true;
					} else if node.children[index + 1].keys.len() > self.min_keys {  // Replace key with successor
						node.keys[index] = node.children[index + 1].remove_min(self.min_keys);
						return true;
					} else {  // Merge key and right node into left node, then recurse
						node.merge_children(self.min_keys, index);
						// Index known due to merging; no need to search
						node = &mut node.children[index];
						index = self.min_keys;
					}
				} else {  // Key might be found in some child
					node = {node}.ensure_child_remove(self.min_keys, index);
					let (f, i) = node.search(val);
					found = f;
					index = i;
				}
				isroot = false;
			}
		}
	}
	
	
	// For unit tests
	pub fn check_structure(&self) {
		// Check size and root node properties
		if self.size <= self.min_keys * 2 {
			assert!(self.root.is_leaf(), "Invalid size or root type");
			assert_eq!(self.root.keys.len(), self.size, "Invalid size or root type");
		} else if self.size > self.max_keys {
			assert!(!self.root.is_leaf(), "Invalid size or root type");
		}
		
		// Calculate height by descending into one branch
		let mut height: i8 = 0;
		let mut node = &self.root;
		while !node.is_leaf() {
			height = height.checked_add(1).unwrap();
			node = node.children.first().unwrap();
		}
		
		// Check all nodes and total size
		assert_eq!(self.root.check_structure(self.min_keys, self.max_keys, true, height, None, None),
			self.size, "Size mismatch");
	}
	
}



/*---- Helper struct: B-tree node ----*/

#[derive(Clone)]
struct Node<E> {
	
	// Size is in the range [0, max_keys] for root node, [min_keys, max_keys] for all other nodes.
	keys: Vec<E>,
	
	// If leaf then size is 0, otherwise if internal node then size always equals keys.len()+1.
	children: Vec<Node<E>>,
	
}


impl<E: std::cmp::Ord> Node<E> {
	
	/*-- Constructor --*/
	
	// Note: Once created, a node's structure never changes between a leaf and internal node.
	fn new(maxkeys: usize, leaf: bool) -> Self {
		assert!(maxkeys >= 3 && maxkeys % 2 == 1);
		Self {
			keys: Vec::with_capacity(maxkeys),
			children: Vec::with_capacity(if leaf { 0 } else { maxkeys + 1 }),
		}
	}
	
	
	/*-- Methods for getting info --*/
	
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
		assert!(i <= self.keys.len());
		(false, i)  // Not found, caller should recurse on child
	}
	
	
	/*-- Methods for insertion --*/
	
	// For the child node at the given index, this moves the right half of keys and children to a new node,
	// and adds the middle key and new child to this node. The left half of child's data is not moved.
	fn split_child(&mut self, minkeys: usize, maxkeys: usize, index: usize) {
		assert!(!self.is_leaf() && index <= self.keys.len() && self.keys.len() < maxkeys);
		let middlekey;
		let mut right;
		{
			let left = &mut self.children[index];
			assert_eq!(left.keys.len(), maxkeys);
			right = Self::new(maxkeys, left.is_leaf());
			if !left.is_leaf() {
				right.children.extend(left.children.drain(minkeys + 1 ..));
			}
			right.keys.extend(left.keys.drain(minkeys + 1 ..));
			middlekey = left.keys.pop().unwrap();
		}
		self.keys.insert(index, middlekey);
		self.children.insert(index + 1, right);
	}
	
	
	/*-- Methods for removal --*/
	
	// Performs modifications to ensure that this node's child at the given index has at least
	// min_keys+1 keys in preparation for a single removal. The child may gain a key and subchild
	// from its sibling, or it may be merged with a sibling, or nothing needs to be done.
	// A reference to the appropriate child is returned, which is helpful if the old child no longer exists.
	fn ensure_child_remove(&mut self, minkeys: usize, mut index: usize) -> &mut Self {
		// Preliminaries
		assert!(!self.is_leaf() && index <= self.keys.len());
		let childsize = self.children[index].keys.len();
		if childsize > minkeys {  // Already satisfies the condition
			return &mut self.children[index];
		}
		assert_eq!(childsize, minkeys);
		
		let internal = !self.children[index].is_leaf();
		let mut leftsize  = 0;
		let mut rightsize = 0;
		if index >= 1 {
			let left = &self.children[index - 1];
			leftsize = left.keys.len();
			assert_eq!(!left.is_leaf(), internal);  // Sibling must be same type (internal/leaf) as child
		}
		if index < self.keys.len() {
			let right = &self.children[index + 1];
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
			self.merge_children(minkeys, index - 1);
			index -= 1;  // This is the only case where the return value is different
		} else if rightsize == minkeys {  // Merge right sibling into child
			self.merge_children(minkeys, index);
		} else {
			unreachable!();
		}
		&mut self.children[index]
	}
	
	
	// Merges the child node at index+1 into the child node at index,
	// assuming the current node is not empty and both children have min_keys.
	fn merge_children(&mut self, minkeys: usize, index: usize) {
		assert!(!self.is_leaf() && index < self.keys.len());
		let middlekey = self.keys.remove(index);
		let mut right = self.children.remove(index + 1);
		let left = &mut self.children[index];
		assert_eq!(left .keys.len(), minkeys);
		assert_eq!(right.keys.len(), minkeys);
		if !left.is_leaf() {
			left.children.extend(right.children.drain(..));
		}
		left.keys.push(middlekey);
		left.keys.extend(right.keys.drain(..));
	}
	
	
	// Removes and returns the minimum key among the whole subtree rooted at this node.
	// Requires this node to be preprocessed to have at least minkeys+1 keys.
	fn remove_min(&mut self, minkeys: usize) -> E {
		let mut node = self;
		loop {
			assert!(node.keys.len() > minkeys);
			if node.is_leaf() {
				return node.keys.remove(0);
			} else {
				node = {node}.ensure_child_remove(minkeys, 0);
			}
		}
	}
	
	
	// Removes and returns the maximum key among the whole subtree rooted at this node.
	// Requires this node to be preprocessed to have at least minkeys+1 keys.
	fn remove_max(&mut self, minkeys: usize) -> E {
		let mut node = self;
		loop {
			assert!(node.keys.len() > minkeys);
			if node.is_leaf() {
				return node.keys.pop().unwrap();
			} else {
				let end = node.children.len() - 1;
				node = {node}.ensure_child_remove(minkeys, end);
			}
		}
	}
	
	
	/*-- Miscellaneous methods --*/
	
	// Checks the structure recursively and returns the total number
	// of keys in the subtree rooted at this node. For unit tests.
	fn check_structure(&self, minkeys: usize, maxkeys: usize,
			isroot: bool, leafdepth: i8, min: Option<&E>, max: Option<&E>) -> usize {
		// Check basic fields
		let numkeys = self.keys.len();
		assert_eq!(self.is_leaf(), leafdepth == 0, "Incorrect leaf/internal node type");
		assert!(numkeys <= maxkeys, "Invalid number of keys");
		if isroot {
			assert!(self.is_leaf() || numkeys > 0, "Invalid number of keys");
		} else {
			assert!(numkeys >= minkeys, "Invalid number of keys");
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
		if !self.is_leaf() {
			assert_eq!(self.children.len(), numkeys + 1, "Invalid number of children");
			// Check children pointers and recurse
			for (i, child) in self.children.iter().enumerate() {
				let temp = child.check_structure(
					minkeys, maxkeys, false, leafdepth - 1,
					if i > 0 { Some(&self.keys[i - 1]) } else { min },
					if i < numkeys { Some(&self.keys[i]) } else { max });
				count = count.checked_add(temp).unwrap();
			}
		}
		count
	}
	
}



/*---- Helper struct: B-tree iterator ----*/

impl<'a, E: std::cmp::Ord> IntoIterator for &'a BTreeSet<E> {
	type Item = &'a E;
	type IntoIter = Iter<'a, E>;
	
	fn into_iter(self) -> Self::IntoIter {
		Iter::<E>::new(&self)
	}
}


#[derive(Clone)]
pub struct Iter<'a, E:'a> {
	count: usize,
	stack: Vec<(&'a Node<E>,usize)>,
}


impl<'a, E: std::cmp::Ord> Iter<'a, E> {
	
	fn new(set: &'a BTreeSet<E>) -> Self {
		let mut result = Self {
			count: set.size,
			stack: Vec::new(),
		};
		if !set.root.keys.is_empty() {
			result.push_left_path(&set.root);
		}
		result
	}
	
	
	fn push_left_path(&mut self, mut node: &'a Node<E>) {
		loop {
			self.stack.push((node, 0));
			match node.children.first() {
				None => break,  // node.is_leaf() == true
				Some(nd) => node = nd,
			}
		}
	}
	
}


impl<'a, E: std::cmp::Ord> Iterator for Iter<'a, E> {
	type Item = &'a E;
	
	fn next(&mut self) -> Option<Self::Item> {
		let &mut (node, ref mut index) = self.stack.last_mut()?;
		let result = &node.keys[*index];
		*index += 1;
		let index = *index;
		if index >= node.keys.len() {
			self.stack.pop();
		}
		if index < node.children.len() {
			self.push_left_path(&node.children[index]);
		}
		self.count -= 1;
		Some(result)
	}
	
	
	fn size_hint(&self) -> (usize,Option<usize>) {
		(self.count, Some(self.count))
	}
	
	fn count(self) -> usize {
		self.count
	}
	
}
