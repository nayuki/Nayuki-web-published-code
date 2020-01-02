/* 
 * AVL tree list (Rust)
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/avl-tree-list
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


#[derive(Clone)]
pub struct AvlTreeList<E> {
	root: MaybeNode<E>,
}


impl<E> AvlTreeList<E> {
	
	pub fn new() -> Self {
		Self { root: MaybeNode(None) }
	}
	
	
	pub fn is_empty(&self) -> bool {
		!self.root.exists()
	}
	
	
	pub fn len(&self) -> usize {
		self.root.size()
	}
	
	
	pub fn push(&mut self, val: E) {
		let index = self.len();
		self.insert(index, val);
	}
	
	
	pub fn append(&mut self, vals: &mut Vec<E>) {
		let index = self.len();
		self.append_at(index, vals);
	}
	
	
	pub fn append_at(&mut self, index: usize, vals: &mut Vec<E>) {
		while let Some(val) = vals.pop() {
			self.insert(index, val);
		}
	}
	
	
	pub fn insert(&mut self, index: usize, val: E) {
		assert!(index <= self.len(), "Index out of bounds");  // Different constraint than the other methods
		assert!(self.len() < std::usize::MAX, "Maximum size reached");
		self.root = self.root.pop().insert_at(index, val);
	}
	
	
	pub fn remove(&mut self, index: usize) -> E {
		assert!(index < self.len(), "Index out of bounds");
		let mut result: Option<E> = None;
		self.root = self.root.pop().remove_at(index, &mut result);
		result.unwrap()
	}
	
	
	pub fn clear(&mut self) {
		self.root = MaybeNode(None);
	}
	
	
	// For unit tests.
	pub fn check_structure(&self) {
		self.root.check_structure();
	}
}


impl<E> Default for AvlTreeList<E> {
	fn default() -> Self {
		Self::new()
	}
}


impl<E> std::ops::Index<usize> for AvlTreeList<E> {
	type Output = E;
	
	fn index(&self, index: usize) -> &E {
		assert!(index < self.len(), "Index out of bounds");
		&self.root.node_ref().get_at(index)
	}
}


impl<E> std::ops::IndexMut<usize> for AvlTreeList<E> {
	fn index_mut(&mut self, index: usize) -> &mut E {
		assert!(index < self.len(), "Index out of bounds");
		self.root.node_mut().get_at_mut(index)
	}
}



/*---- Helper structs: AVL tree nodes ----*/

#[derive(Clone)]
struct MaybeNode<E>(Option<Box<Node<E>>>);


impl<E> MaybeNode<E> {
	
	fn exists(&self) -> bool {
		self.0.is_some()
	}
	
	
	fn size(&self) -> usize {
		self.0.as_ref().map_or(0, |node| node.size)
	}
	
	
	fn height(&self) -> i16 {
		self.0.as_ref().map_or(0, |node| node.height)
	}
	
	
	fn node_ref(&self) -> &Node<E> {
		self.0.as_ref().unwrap().as_ref()
	}
	
	
	fn node_mut(&mut self) -> &mut Node<E> {
		self.0.as_mut().unwrap().as_mut()
	}
	
	
	fn pop(&mut self) -> Self {
		std::mem::replace(self, MaybeNode(None))
	}
	
	
	fn insert_at(mut self, index: usize, val: E) -> Self {
		assert!(index <= self.size());
		if !self.exists() {  // Automatically implies index == 0, because MaybeNode(None).size() == 0
			return MaybeNode(Some(Box::new(Node::new(val))));
		} else {
			let node = self.node_mut();
			let leftsize = node.left.size();
			if index <= leftsize {
				node.left = node.left.pop().insert_at(index, val);
			} else {
				node.right = node.right.pop().insert_at(index - leftsize - 1, val);
			}
			node.recalculate();
		}
		self.balance()
	}
	
	
	fn remove_at(mut self, index: usize, outval: &mut Option<E>) -> Self {
		let mut done = true;
		{  // Modify the current object
			let node = self.node_mut();
			let leftsize = node.left.size();
			// Recursively find and remove a node
			if index < leftsize {
				node.left = node.left.pop().remove_at(index, outval);
			} else if index > leftsize {
				node.right = node.right.pop().remove_at(index - leftsize - 1, outval);
			} else if node.left.exists() && node.right.exists() {
				node.right = node.right.pop().remove_at(0, outval);  // Remove successor node
				std::mem::swap(outval.as_mut().unwrap(), &mut node.value);  // Replace value by successor
			} else {
				done = false;
			}
		}
		if done {
			self.node_mut().recalculate();
			return self.balance();
		}
		
		// Remove current node and return a child or nothing
		let node = *self.0.unwrap();
		*outval = Some(node.value);
		if node.left.exists() {
			node.left
		} else if node.right.exists() {
			node.right
		} else {
			MaybeNode(None)
		}
	}
	
	
	fn balance(mut self) -> Self {
		let bal = self.node_ref().get_balance();
		assert!(bal.abs() <= 2);
		if bal == -2 {
			{
				let node = self.node_mut();
				let childbal = node.left.node_ref().get_balance();
				assert!(childbal.abs() <= 1);
				if childbal == 1 {
					node.left = node.left.pop().rotate_left();
				}
			}
			self = self.rotate_right();
		} else if bal == 2 {
			{
				let node = self.node_mut();
				let childbal = node.right.node_ref().get_balance();
				assert!(childbal.abs() <= 1);
				if childbal == -1 {
					node.right = node.right.pop().rotate_right();
				}
			}
			self = self.rotate_left();
		}
		assert!(self.node_ref().get_balance().abs() <= 1);
		self
	}
	
	
	/* 
	 *   A            B
	 *  / \          / \
	 * 0   B   ->   A   2
	 *    / \      / \
	 *   1   2    0   1
	 */
	fn rotate_left(mut self) -> Self {
		let mut root;
		{
			let selfnode = self.node_mut();
			root = selfnode.right.pop();
			std::mem::swap(&mut selfnode.right, &mut root.node_mut().left);
			selfnode.recalculate();
		} {
			let rootnode = root.node_mut();
			rootnode.left = self;
			rootnode.recalculate();
		}
		root
	}
	
	
	/* 
	 *     B          A
	 *    / \        / \
	 *   A   2  ->  0   B
	 *  / \            / \
	 * 0   1          1   2
	 */
	fn rotate_right(mut self) -> Self {
		let mut root;
		{
			let selfnode = self.node_mut();
			root = selfnode.left.pop();
			std::mem::swap(&mut selfnode.left, &mut root.node_mut().right);
			selfnode.recalculate();
		} {
			let rootnode = root.node_mut();
			rootnode.right = self;
			rootnode.recalculate();
		}
		root
	}
	
	
	fn check_structure(&self) {
		if let Some(ref node) = self.0 {
			node.check_structure();
		}
	}
	
}


#[derive(Clone)]
struct Node<E> {
	// The object stored at this node.
	value: E,
	
	// The height of the tree rooted at this node. Empty nodes have height 0.
	// This node has height equal to max(left.height, right.height) + 1.
	height: i16,
	
	// The number of non-empty nodes in the tree rooted at this node, including this node.
	// Empty nodes have size 0. This node has size equal to left.size + right.size + 1.
	size: usize,
	
	// The root node of the left subtree.
	left: MaybeNode<E>,
	
	// The root node of the right subtree.
	right: MaybeNode<E>,
}


impl<E> Node<E> {
	
	fn new(val: E) -> Self {
		Self {
			value : val,
			height: 1,
			size  : 1,
			left  : MaybeNode(None),
			right : MaybeNode(None),
		}
	}
	
	
	fn get_at(&self, index: usize) -> &E {
		assert!(index < self.size);
		let leftsize = self.left.size();
		if index < leftsize {
			self.left.node_ref().get_at(index)
		} else if index > leftsize {
			self.right.node_ref().get_at(index - leftsize - 1)
		} else {
			&self.value
		}
	}
	
	
	fn get_at_mut(&mut self, index: usize) -> &mut E {
		assert!(index < self.size);
		let leftsize = self.left.size();
		if index < leftsize {
			self.left.node_mut().get_at_mut(index)
		} else if index > leftsize {
			self.right.node_mut().get_at_mut(index - leftsize - 1)
		} else {
			&mut self.value
		}
	}
	
	
	fn recalculate(&mut self) {
		assert!(self.left .height() >= 0);
		assert!(self.right.height() >= 0);
		self.height = std::cmp::max(self.left.height(), self.right.height()) + 1;
		self.size = self.left.size() + self.right.size() + 1;
		assert!(self.height >= 0);
	}
	
	
	fn get_balance(&self) -> i16 {
		self.right.height() - self.left.height()
	}
	
	
	fn check_structure(&self) {
		self.left .check_structure();
		self.right.check_structure();
		assert_eq!(self.height, std::cmp::max(self.left.height(), self.right.height()) + 1);
		assert_eq!(self.size, self.left.size() + self.right.size() + 1);
		assert!(self.get_balance().abs() <= 1);
	}
	
}



/*---- Helper struct: AVL tree iterator ----*/

impl<'a, E> IntoIterator for &'a AvlTreeList<E> {
	type Item = &'a E;
	type IntoIter = Iter<'a, E>;
	
	fn into_iter(self) -> Self::IntoIter {
		Iter::<E>::new(&self.root)
	}
}


#[derive(Clone)]
pub struct Iter<'a, E:'a> {
	count: usize,
	stack: Vec<&'a Node<E>>,
}


impl<'a, E> Iter<'a, E> {
	
	fn new(root: &'a MaybeNode<E>) -> Self {
		let mut result = Self {
			count: root.size(),
			stack: Vec::new(),
		};
		result.push_left_path(root);
		result
	}
	
	
	fn push_left_path(&mut self, mut maybenode: &'a MaybeNode<E>) {
		while let Some(ref node) = maybenode.0 {
			self.stack.push(node.as_ref());
			maybenode = &node.left;
		}
	}
	
}


impl<'a, E> Iterator for Iter<'a, E> {
	type Item = &'a E;
	
	fn next(&mut self) -> Option<Self::Item> {
		let node: &Node<E> = self.stack.pop()?;
		self.push_left_path(&node.right);
		self.count -= 1;
		Some(&node.value)
	}
	
	
	fn size_hint(&self) -> (usize,Option<usize>) {
		(self.count, Some(self.count))
	}
	
	fn count(self) -> usize {
		self.count
	}
	
}
