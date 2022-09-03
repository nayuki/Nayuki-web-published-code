/* 
 * Binomial heap (Rust)
 * 
 * Copyright (c) 2022 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/binomial-heap
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


/*-- Fields --*/

#[derive(Clone)]
pub struct BinomialHeap<E> {
	head: MaybeNode<E>,
}


impl<E: Ord> BinomialHeap<E> {
	
	/*-- Constructors --*/
	
	pub fn new() -> Self {
		Self { head: None }
	}
	
	
	/*-- Methods --*/
	
	pub fn is_empty(&self) -> bool {
		self.head.is_none()
	}
	
	
	pub fn len(&self) -> usize {
		let mut result: usize = 0;
		let mut node: &MaybeNode<E> = &self.head;
		while let Some(ref nd) = *node {
			result |= 1usize.checked_shl(u32::from(nd.rank)).unwrap();
			node = &nd.next;
		}
		result
	}
	
	
	pub fn clear(&mut self) {
		self.head = None;
	}
	
	
	pub fn push(&mut self, val: E) {
		let other = Some(Box::new(Node::new(val)));
		self.merge_nodes(other);
	}
	
	
	pub fn peek(&self) -> Option<&E> {
		self.find_min().map(|x| x.0)
	}
	
	
	pub fn pop(&mut self) -> Option<E> {
		let mut minnode: Node<E>;
		{
			let minnodeindex: u32 = self.find_min()?.1;
			let mut node: &mut MaybeNode<E> = &mut self.head;
			for _ in 0 .. minnodeindex {
				node = &mut {node}.as_mut().unwrap().as_mut().next;
			}
			minnode = *node.take().unwrap();
			std::mem::swap(node, &mut minnode.next);
		}
		self.merge_nodes(minnode.remove_root());
		Some(minnode.value)
	}
	
	
	fn find_min(&self) -> Option<(&E, u32)> {
		let mut node: &Node<E> = self.head.as_ref()?;
		let mut minvalue: &E = &node.value;
		
		let mut minindex: u32 = 0;
		let mut index: u32 = 1;
		while let Some(ref next) = node.next {
			node = next.as_ref();
			if node.value < *minvalue {
				minvalue = &node.value;
				minindex = index;
			}
			index += 1;
		}
		Some((minvalue, minindex))
	}
	
	
	// Moves all the values in the given heap into this heap
	pub fn merge(&mut self, mut other: Self) {
		self.merge_nodes(other.head.take());
	}
	
	
	fn merge_nodes(&mut self, mut other: MaybeNode<E>) {
		let mut this: MaybeNode<E> = self.head.take();
		let mut merged: MaybeNode<E> = None;
		
		while this.is_some() || other.is_some() {
			let mut node: Box<Node<E>>;
			if other.is_none() || this.is_some() && this.as_ref().unwrap().rank <= other.as_ref().unwrap().rank {
				node = this.unwrap();
				this = node.next.take();
			} else {
				node = other.unwrap();
				other = node.next.take();
			}
			
			if merged.is_none() || merged.as_ref().unwrap().rank < node.rank {
				node.next = merged;
				merged = Some(node);
			} else {
				let mut mrgd = merged.unwrap();
				if mrgd.rank == node.rank + 1 {
					node.next = mrgd.next.take();
					mrgd.next = Some(node);
				} else {
					// Merge nodes
					assert_eq!(mrgd.rank, node.rank);
					if node.value < mrgd.value {
						std::mem::swap(&mut node.value, &mut mrgd.value);
						std::mem::swap(&mut node.down, &mut mrgd.down);
					}
					node.next = mrgd.down.take();
					mrgd.down = Some(node);
					mrgd.rank += 1;
				}
				merged = Some(mrgd);
			}
		}
		self.head = reverse_nodes(merged);
	}
	
	
	// For unit tests
	pub fn check_structure(&self) {
		if let Some(ref node) = self.head {
			node.check_structure(true, None);
		}
	}
	
}



/*---- Helper struct: Binomial heap node ----*/

type MaybeNode<E> = Option<Box<Node<E>>>;


/*-- Fields --*/

#[derive(Clone)]
struct Node<E> {
	value: E,
	rank: u8,
	
	down: MaybeNode<E>,
	next: MaybeNode<E>,
}


impl<E: Ord> Node<E> {
	
	/*-- Constructor --*/
	
	fn new(val: E) -> Self {
		Self {
			value: val,
			rank: 0,
			down: None,
			next: None,
		}
	}
	
	
	/*-- Methods --*/
	
	fn remove_root(&mut self) -> MaybeNode<E> {
		assert!(self.next.is_none());
		reverse_nodes(self.down.take())
	}
	
	
	// For unit tests
	fn check_structure(&self, ismain: bool, lowerbound: Option<&E>) {
		// Basic checks
		assert_eq!(ismain, lowerbound.is_none(), "Invalid arguments");
		assert!(ismain || self.value >= *lowerbound.unwrap(), "Min-heap property violated");
		
		// Check children and non-main chains
		if self.rank > 0 {
			let down = self.down.as_ref().expect("Down node absent");
			assert_eq!(down.rank, self.rank - 1, "Down node has invalid rank");
			down.check_structure(false, Some(&self.value));
			if !ismain {
				let next = self.next.as_ref().expect("Next node absent");
				assert_eq!(next.rank, self.rank - 1, "Next node has invalid rank");
				next.check_structure(false, lowerbound);
			}
		} else {
			assert!(self.down.is_none(), "Down node must be absent");
		}
		
		// Check main chain
		if ismain {
			if let Some(ref next) = self.next {
				assert!(next.rank > self.rank);
				next.check_structure(true, None);
			}
		}
	}
	
}


fn reverse_nodes<E>(mut nodes: MaybeNode<E>) -> MaybeNode<E> {
	let mut result: MaybeNode<E> = None;
	while let Some(mut node) = nodes {
		nodes = std::mem::replace(&mut node.next, result);
		result = Some(node);
	}
	result
}
