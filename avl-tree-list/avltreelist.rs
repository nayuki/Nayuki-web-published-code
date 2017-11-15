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
	root: Node<E>,
}


impl <E> AvlTreeList<E> {
	
	pub fn new() -> Self {
		AvlTreeList {
			root: Node::EmptyLeafNode,
		}
	}
	
	
	pub fn is_empty(&self) -> bool {
		match self.root {
			Node::EmptyLeafNode => true,
			_ => false,
		}
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
		let temp = std::mem::replace(&mut self.root, Node::EmptyLeafNode);
		self.root = temp.insert_at(index, val);
	}
	
	
	pub fn remove(&mut self, index: usize) -> E {
		assert!(index < self.len(), "Index out of bounds");
		let mut result: Option<E> = None;
		let temp = std::mem::replace(&mut self.root, Node::EmptyLeafNode);
		self.root = temp.remove_at(index, &mut result);
		result.unwrap()
	}
	
	
	pub fn clear(&mut self) {
		self.root = Node::EmptyLeafNode;
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
		&self.root.get_at(index)
	}
}


impl <E> std::ops::IndexMut<usize> for AvlTreeList<E> {
	fn index_mut(&mut self, index: usize) -> &mut E {
		assert!(index < self.len(), "Index out of bounds");
		self.root.get_at_mut(index)
	}
}



/*---- Helper struct: AVL tree node ----*/

enum Node<E> {
	EmptyLeafNode,
	
	InternalNode(
		// The object stored at this node.
		E,
		// The height of the tree rooted at this node. Empty nodes have height 0.
		// This node has height equal to max(left.height, right.height) + 1.
		i16,
		// The number of nodes in the tree rooted at this node, including this node.
		// Empty nodes have size 0. This node has size equal to left.size + right.size + 1.
		usize,
		// The root node of the left subtree.
		Box<Node<E>>,
		// The root node of the right subtree.
		Box<Node<E>>),
}


impl <E> Node<E> {
	
	fn new(val: E) -> Self {
		Node::InternalNode(val, 1, 1,
			Box::new(Node::EmptyLeafNode), Box::new(Node::EmptyLeafNode))
	}
	
	
	fn height(&self) -> i16 {
		match *self {
			Node::EmptyLeafNode => 0,
			Node::InternalNode(_, ht, _, _, _) => ht,
		}
	}
	
	
	fn size(&self) -> usize {
		match *self {
			Node::EmptyLeafNode => 0,
			Node::InternalNode(_, _, sz, _, _) => sz,
		}
	}
	
	
	fn get_at(&self, index: usize) -> &E {
		match *self {
			Node::EmptyLeafNode => panic!("Assertion error"),
			Node::InternalNode(ref value, _, size, ref left, ref right) => {
				assert!(index < size, "Assertion error");
				let leftsize = left.size();
				if index < leftsize {
					left.get_at(index)
				} else if index > leftsize {
					right.get_at(index - leftsize - 1)
				} else {
					value
				}
			},
		}
	}
	
	
	fn get_at_mut(&mut self, index: usize) -> &mut E {
		match *self {
			Node::EmptyLeafNode => panic!("Assertion error"),
			Node::InternalNode(ref mut value, _, size, ref mut left, ref mut right) => {
				assert!(index < size, "Assertion error");
				let leftsize = left.size();
				if index < leftsize {
					left.get_at_mut(index)
				} else if index > leftsize {
					right.get_at_mut(index - leftsize - 1)
				} else {
					value
				}
			},
		}
	}
	
	
	fn insert_at(mut self, index: usize, val: E) -> Self {
		assert!(index <= self.size(), "Assertion error");
		match self {
			Node::EmptyLeafNode => Node::new(val),
			Node::InternalNode(_, _, _, _, _) => {
				if let Node::InternalNode(_, _, _, ref mut left, ref mut right) = self {
					let leftsize = left.size();
					if index <= leftsize {
						let temp = std::mem::replace(left, Box::new(Node::EmptyLeafNode));
						*left = Box::new(temp.insert_at(index, val));
					} else {
						let temp = std::mem::replace(right, Box::new(Node::EmptyLeafNode));
						*right = Box::new(temp.insert_at(index - leftsize - 1, val));
					}
				}
				self.recalculate();
				self.balance()
			},
		}
	}
	
	
	fn remove_at(mut self, index: usize, outval: &mut Option<E>) -> Self {
		let recursed;
		if let Node::InternalNode(_, _, _, ref mut left, ref mut right) = self {
			let leftsize = left.size();
			if index < leftsize {
				let temp = std::mem::replace(left, Box::new(Node::EmptyLeafNode));
				*left = Box::new(temp.remove_at(index, outval));
				recursed = true;
			} else if index > leftsize {
				let temp = std::mem::replace(right, Box::new(Node::EmptyLeafNode));
				*right = Box::new(temp.remove_at(index - leftsize - 1, outval));
				recursed = true;
			} else {
				recursed = false;
			}
		} else {
			panic!("Index out of bounds");
		}
		if recursed {
			self.recalculate();
			return self.balance();
		}
		
		if let Node::InternalNode(val, _, _, left, right) = self {
			*outval = Some(val);
			if left.size() == 0 && right.size() == 0 {
				return Node::EmptyLeafNode;
			} else if right.size() == 0 {
				return *left;
			} else if left.size() == 0 {
				return *right;
			} else {
				let mut tempval: Option<E> = None;
				let newright = Box::new(right.remove_at(0, &mut tempval));
				let mut result = Node::InternalNode(tempval.unwrap(), 0, 0, left, newright);
				result.recalculate();
				return result.balance();
			}
		} else {
			panic!("Index out of bounds");
		}
	}
	
	
	fn balance(mut self) -> Self {
		if let Node::EmptyLeafNode = self {
			panic!("Assertion error");
		}
		let bal = self.get_balance();
		assert!(bal.abs() <= 2, "Assertion error");
		if bal == -2 {
			if let Node::InternalNode(_, _, _, ref mut left, _) = self {
				let childbal = left.get_balance();
				assert!(childbal.abs() <= 1, "Assertion error");
				if childbal == 1 {
					let temp = std::mem::replace(left, Box::new(Node::EmptyLeafNode));
					*left = Box::new(temp.rotate_left());
				}
			} else {
				panic!("Assertion error");
			}
			self = self.rotate_right();
		} else if bal == 2 {
			if let Node::InternalNode(_, _, _, _, ref mut right) = self {
				let childbal = right.get_balance();
				assert!(childbal.abs() <= 1, "Assertion error");
				if childbal == -1 {
					let temp = std::mem::replace(right, Box::new(Node::EmptyLeafNode));
					*right = Box::new(temp.rotate_right());
				}
			} else {
				panic!("Assertion error");
			}
			self = self.rotate_left();
		}
		assert!(self.get_balance().abs() <= 1, "Assertion error");
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
		if let Node::InternalNode(_, _, _, _, ref mut right) = self {
			root = *std::mem::replace(right, Box::new(Node::EmptyLeafNode));
			if let Node::InternalNode(_, _, _, ref mut left, _) = root {
				std::mem::swap(left, right);
			} else {
				panic!("Assertion error");
			}
		} else {
			panic!("Assertion error");
		}
		self.recalculate();
		if let Node::InternalNode(_, _, _, ref mut left, _) = root {
			*left = Box::new(self);
		} else {
			panic!("Assertion error");
		}
		root.recalculate();
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
		if let Node::InternalNode(_, _, _, ref mut left, _) = self {
			root = *std::mem::replace(left, Box::new(Node::EmptyLeafNode));
			if let Node::InternalNode(_, _, _, _, ref mut right) = root {
				std::mem::swap(right, left);
			} else {
				panic!("Assertion error");
			}
		} else {
			panic!("Assertion error");
		}
		self.recalculate();
		if let Node::InternalNode(_, _, _, _, ref mut right) = root {
			*right = Box::new(self);
		} else {
			panic!("Assertion error");
		}
		root.recalculate();
		root
	}
	
	
	fn recalculate(&mut self) {
		match *self {
			Node::EmptyLeafNode => panic!("Assertion error"),
			Node::InternalNode(_, ref mut height, ref mut size, ref left, ref right) => {
				assert!(left.height() >= 0 && right.height() >= 0, "Assertion error");
				*height = std::cmp::max(left.height(), right.height()) + 1;
				*size = left.size() + right.size() + 1;
				assert!(*height >= 0, "Assertion error");
			}
		}
	}
	
	
	fn get_balance(&self) -> i16 {
		match *self {
			Node::EmptyLeafNode => 0,
			Node::InternalNode(_, _, _, ref left, ref right) =>
				right.height() - left.height(),
		}
	}
	
	
	// For unit tests, invokable by AvlTreeList.
	fn check_structure(&self) {
		match *self {
			Node::EmptyLeafNode => (),
			Node::InternalNode(_, height, size, ref left, ref right) => {
				assert_eq!(height, std::cmp::max(left.height(), right.height()) + 1, "Assertion error");
				assert_eq!(size, left.size() + right.size() + 1, "Assertion error");
				assert!(self.get_balance().abs() <= 1, "Assertion error");
			},
		}
	}
	
}
