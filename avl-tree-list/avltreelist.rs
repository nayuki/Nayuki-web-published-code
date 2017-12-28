/* 
 * AVL tree list (Rust)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
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


pub struct AvlTreeList<E> {
	root: MaybeNode<E>,
}


impl <E> AvlTreeList<E> {
	
	pub fn new() -> Self {
		AvlTreeList {
			root: MaybeNode(None),
		}
	}
	
	
	pub fn is_empty(&self) -> bool {
		self.root.0.is_none()
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
		loop {
			match vals.pop() {
				None => break,
				Some(val) => self.insert(index, val),
			}
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


impl <E> std::ops::Index<usize> for AvlTreeList<E> {
	type Output = E;
	
	fn index(&self, index: usize) -> &E {
		assert!(index < self.len(), "Index out of bounds");
		&self.root.node_ref().get_at(index)
	}
}


impl <E> std::ops::IndexMut<usize> for AvlTreeList<E> {
	fn index_mut(&mut self, index: usize) -> &mut E {
		assert!(index < self.len(), "Index out of bounds");
		self.root.node_mut().get_at_mut(index)
	}
}



/*---- Helper structs: AVL tree nodes ----*/

struct MaybeNode<E>(Option<Box<Node<E>>>);


impl <E> MaybeNode<E> {
	
	fn size(&self) -> usize {
		match self.0 {
			None => 0,
			Some(ref node) => node.size,
		}
	}
	
	
	fn height(&self) -> i16 {
		match self.0 {
			None => 0,
			Some(ref node) => node.height,
		}
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
		match self.0 {
			None => {
				return MaybeNode(Some(Box::new(Node::new(val))));
			},
			Some(ref mut bx) => {
				let mut node = bx.as_mut();
				let leftsize = node.left.size();
				if index <= leftsize {
					node.left = node.left.pop().insert_at(index, val);
				} else {
					node.right = node.right.pop().insert_at(index - leftsize - 1, val);
				}
				node.recalculate();
			},
		}
		self.balance()
	}
	
	
	fn remove_at(mut self, index: usize, outval: &mut Option<E>) -> Self {
		let mut done: bool;
		
		// Recursively find and remove a node
		match self.0 {
			None => unreachable!(),
			Some(ref mut bx) => {
				let mut node = bx.as_mut();
				let leftsize = node.left.size();
				if index < leftsize {
					node.left = node.left.pop().remove_at(index, outval);
					done = true;
				} else if index > leftsize {
					node.right = node.right.pop().remove_at(index - leftsize - 1, outval);
					done = true;
				} else {
					done = false;
				}
			},
		}
		
		// If current node needs removal but has both children
		if !done {
			if let Some(ref mut bx) = self.0 {
				let mut node = bx.as_mut();
				if node.left.size() > 0 && node.right.size() > 0 {
					node.right = node.right.pop().remove_at(0, outval);
					std::mem::swap(outval.as_mut().unwrap(), &mut node.value);
					done = true;
				}
			}
		}
		
		// Rebalance and return
		if done {
			self.node_mut().recalculate();
			return self.balance();
		}
		
		// Remove current node and return a child or nothing
		if let Some(bx) = self.0 {
			let node = *bx;
			*outval = Some(node.value);
			return if node.left.size() > 0 {
				node.left
			} else if node.right.size() > 0 {
				node.right
			} else {
				MaybeNode(None)
			};
		}
		unreachable!();
	}
	
	
	fn balance(mut self) -> Self {
		let bal = self.node_ref().get_balance();
		assert!(bal.abs() <= 2);
		if bal == -2 {
			{
				let mut node = self.node_mut();
				let childbal = node.left.node_ref().get_balance();
				assert!(childbal.abs() <= 1);
				if childbal == 1 {
					node.left = node.left.pop().rotate_left();
				}
			}
			self = self.rotate_right();
		} else if bal == 2 {
			{
				let mut node = self.node_mut();
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
			let mut selfnode = self.node_mut();
			root = selfnode.right.pop();
			let rootnode = root.node_mut();
			std::mem::swap(&mut selfnode.right, &mut rootnode.left);
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
			let mut selfnode = self.node_mut();
			root = selfnode.left.pop();
			let rootnode = root.node_mut();
			std::mem::swap(&mut selfnode.left, &mut rootnode.right);
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


struct Node<E> {
	// The object stored at this node.
	value: E,
	
	// The height of the tree rooted at this node. Empty nodes have height 0.
	// This node has height equal to max(left.height, right.height) + 1.
	height: i16,
	
	// The number of nodes in the tree rooted at this node, including this node.
	// Empty nodes have size 0. This node has size equal to left.size + right.size + 1.
	size: usize,
	
	// The root node of the left subtree.
	left: MaybeNode<E>,
	
	// The root node of the right subtree.
	right: MaybeNode<E>,
}


impl <E> Node<E> {
	
	fn new(val: E) -> Self {
		Self {
			value: val,
			height: 1,
			size: 1,
			left: MaybeNode(None),
			right: MaybeNode(None),
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
		assert_eq!(self.height, std::cmp::max(self.left.height(), self.right.height()) + 1);
		assert_eq!(self.size, self.left.size() + self.right.size() + 1);
		assert!(self.get_balance().abs() <= 1);
	}
	
}
