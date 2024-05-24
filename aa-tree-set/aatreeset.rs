/* 
 * AA tree set (Rust)
 * 
 * Copyright (c) 2024 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/aa-tree-set
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


#[derive(Clone,Default)]
pub struct AaTreeSet<E> {
	root: MaybeNode<E>,
	size: usize,
}


impl<E: Ord> AaTreeSet<E> {
	
	pub fn new() -> Self {
		Self {
			root: MaybeNode(None),
			size: 0,
		}
	}
	
	
	pub fn is_empty(&self) -> bool {
		self.size == 0
	}
	
	
	pub fn len(&self) -> usize {
		self.size
	}
	
	
	pub fn clear(&mut self) {
		self.root.pop();
		self.size = 0;
	}
	
	
	pub fn contains(&self, val: &E) -> bool {
		let mut node = &self.root;
		while let Some(ref nd) = node.0 {
			use std::cmp::Ordering::*;
			match val.cmp(&nd.value) {
				Less => node = &nd.left,
				Greater => node = &nd.right,
				Equal => return true,
			}
		}
		false
	}
	
	
	pub fn insert(&mut self, val: E) -> bool {
		assert!(self.size < usize::MAX, "Maximum size reached");
		let (root, changed) = self.root.pop().insert(val);
		self.root = root;
		self.size += usize::from(changed);
		changed
	}
	
	
	pub fn remove(&mut self, val: &E) -> bool {
		let (root, changed) = self.root.pop().remove(val);
		self.root = root;
		self.size -= usize::from(changed);
		changed
	}
	
	
	pub fn check_structure(&self) {
		assert_eq!(self.root.check_structure(), self.size);
	}
	
}


#[derive(Clone,Default)]
struct MaybeNode<E>(Option<Box<Node<E>>>);


impl<E: Ord> MaybeNode<E> {
	
	fn exists(&self) -> bool {
		self.0.is_some()
	}
	
	
	fn level(&self) -> i8 {
		self.0.as_ref().map_or(0, |node| node.level)
	}
	
	
	fn node_ref(&self) -> &Node<E> {
		self.0.as_ref().unwrap().as_ref()
	}
	
	
	fn node_mut(&mut self) -> &mut Node<E> {
		self.0.as_mut().unwrap().as_mut()
	}
	
	
	fn pop(&mut self) -> Self {
		MaybeNode(self.0.take())
	}
	
	
	fn insert(mut self, val: E) -> (Self,bool) {
		match self.0 {
			None => (MaybeNode(Some(Box::new(Node::new(val)))), true),
			
			Some(ref mut node) => {
				let changed;
				use std::cmp::Ordering::*;
				match val.cmp(&node.value) {
					Less => (node.left, changed) = node.left.pop().insert(val),
					Greater => (node.right, changed) = node.right.pop().insert(val),
					Equal => return (self, false),
				}
				(self.skew().split(), changed)  // Rebalance this node
			},
		}
	}
	
	
	fn remove(mut self, val: &E) -> (Self,bool) {
		match self.0 {
			None => (self, false),
			
			Some(ref mut node) => {
				let changed;
				use std::cmp::Ordering::*;
				match val.cmp(&node.value) {
					Less => (node.left, changed) = node.left.pop().remove(val),
					Greater => (node.right, changed) = node.right.pop().remove(val),
					Equal => {  // Remove value at this node
						if let Some(ref mut temp) = node.left.0 {
							let mut temp = temp;
							// Find predecessor node
							while let Some(ref mut nd) = temp.right.0 {
								temp = nd;
							}
							std::mem::swap(&mut temp.value, &mut node.value);  // Replace value by predecessor
							(node.left, changed) = node.left.pop().remove(val);  // Remove predecessor node
						} else if let Some(ref mut temp) = node.right.0 {
							let mut temp = temp;
							// Find successor node
							while let Some(ref mut nd) = temp.left.0 {
								temp = nd;
							}
							std::mem::swap(&mut temp.value, &mut node.value);  // Replace value with successor
							(node.right, changed) = node.right.pop().remove(val);  // Remove successor node
						} else {
							assert_eq!(node.level, 1);
							return (MaybeNode(None), true);
						}
						assert!(changed);
					},
				}
				
				// Rebalance this node if a child was lowered
				let selfnode = self.node_mut();
				if selfnode.level == selfnode.left.level().min(selfnode.right.level()) + 1 {
					return (self, changed);
				}
				if selfnode.right.level() == selfnode.level {
					selfnode.right.node_mut().level -= 1;
				}
				selfnode.level -= 1;
				self = self.skew();
				let selfnode = self.node_mut();
				selfnode.right = selfnode.right.pop().skew();
				if selfnode.right.node_ref().right.exists() {
					selfnode.right.node_mut().right = selfnode.right.node_mut().right.pop().skew();
				}
				self = self.split();
				self.node_mut().right = self.node_mut().right.pop().split();
				(self, changed)
			},
		}
	}
	
	
	/* 
	 *       |          |
	 *   A - B    ->    A - B
	 *  / \   \        /   / \
	 * 0   1   2      0   1   2
	 */
	fn skew(mut self) -> Self {
		let selfnode = self.node_ref();
		if selfnode.left.level() < self.level() {
			return self;
		}
		let selfnode = self.node_mut();
		let mut result = selfnode.left.pop();
		let resultnode = result.node_mut();
		selfnode.left = resultnode.right.pop();
		resultnode.right = self;
		result
	}
	
	
	/* 
	 *   |                      |
	 *   |                    - B -
	 *   |                   /     \
	 *   A - B - C    ->    A       C
	 *  /   /   / \        / \     / \
	 * 0   1   2   3      0   1   2   3
	 */
	fn split(mut self) -> Self {
		let selfnode = self.node_ref();
		// Must short-circuit because if right.level < self.level, then right.right might be null
		if selfnode.right.level() < self.level() || selfnode.right.node_ref().right.level() < self.level() {
			return self;
		}
		let selfnode = self.node_mut();
		let mut result = selfnode.right.pop();
		let resultnode = result.node_mut();
		selfnode.right = resultnode.left.pop();
		resultnode.left = self;
		resultnode.level += 1;
		result
	}
	
	
	fn check_structure(&self) -> usize {
		match self.0 {
			None => 0,
			
			Some(ref selfnode) => {
				assert!(self.level() > 0 && self.level() == selfnode.left.level() + 1 && (self.level() == selfnode.right.level() + 1 || self.level() == selfnode.right.level()));
				assert!(self.level() != selfnode.right.level() || self.level() != selfnode.right.node_ref().right.level());  // Must short-circuit evaluate
				assert!(selfnode.left.0.as_ref().map_or(true, |node| node.value < selfnode.value));
				assert!(selfnode.right.0.as_ref().map_or(true, |node| node.value > selfnode.value));
				
				let size = 1usize
					.checked_add(selfnode.left.check_structure()).unwrap()
					.checked_add(selfnode.right.check_structure()).unwrap();
				assert!(size >= (1 << self.level()) - 1);
				// Not checked, but (size <= 3^level - 1) is also true
				size
			}
		}
	}
	
}



#[derive(Clone)]
struct Node<E> {
	value: E,
	level: i8,
	left: MaybeNode<E>,
	right: MaybeNode<E>,
}


impl<E> Node<E> {
	
	fn new(val: E) -> Self {
		Self {
			value: val,
			level: 1,
			left : MaybeNode(None),
			right: MaybeNode(None),
		}
	}
	
}



impl<E: Ord> IntoIterator for AaTreeSet<E> {
	type Item = E;
	type IntoIter = MoveIter<E>;
	
	fn into_iter(self) -> Self::IntoIter {
		MoveIter::<E>::new(self.root, self.size)
	}
}


pub struct MoveIter<E> {
	count: usize,
	stack: Vec<Node<E>>,
}


impl<E: Ord> MoveIter<E> {
	
	fn new(root: MaybeNode<E>, size: usize) -> Self {
		let mut result = Self {
			count: size,
			stack: Vec::new(),
		};
		result.push_left_path(root);
		result
	}
	
	
	fn push_left_path(&mut self, mut maybenode: MaybeNode<E>) {
		while let Some(node) = maybenode.0 {
			let mut node: Node<E> = *node;
			maybenode = node.left.pop();
			self.stack.push(node);
		}
	}
	
}


impl<E: Ord> Iterator for MoveIter<E> {
	type Item = E;
	
	fn next(&mut self) -> Option<Self::Item> {
		let mut node: Node<E> = self.stack.pop()?;
		self.push_left_path(node.right.pop());
		self.count -= 1;
		Some(node.value)
	}
	
	
	fn size_hint(&self) -> (usize,Option<usize>) {
		(self.count, Some(self.count))
	}
	
	fn count(self) -> usize {
		self.count
	}
	
}


impl<'a, E> IntoIterator for &'a AaTreeSet<E> {
	type Item = &'a E;
	type IntoIter = RefIter<'a, E>;
	
	fn into_iter(self) -> Self::IntoIter {
		RefIter::<E>::new(&self.root, self.size)
	}
}


#[derive(Clone)]
pub struct RefIter<'a, E:'a> {
	count: usize,
	stack: Vec<&'a Node<E>>,
}


impl<'a, E> RefIter<'a, E> {
	
	fn new(root: &'a MaybeNode<E>, size: usize) -> Self {
		let mut result = Self {
			count: size,
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


impl<'a, E> Iterator for RefIter<'a, E> {
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
