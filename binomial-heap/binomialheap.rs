/* 
 * Binomial heap (Rust)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
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


pub struct BinomialHeap<E> {
	head: Node<E>,
}


impl <E: std::cmp::Ord> BinomialHeap<E> {
	
	pub fn new() -> Self {
		BinomialHeap {
			head: Node::dummy(),
		}
	}
	
	
	pub fn len(&self) -> usize {
		let mut result = 0;
		let mut node = &self.head.next;
		loop {
			match *node {
				None => break,
				Some(ref nd) => {
					result |= 1 << nd.rank;
					node = &nd.next;
				},
			}
		}
		result
	}
	
	
	pub fn clear(&mut self) {
		self.head.next = None;
	}
	
	
	pub fn push(&mut self, val: E) {
		self.merge_nodes(Some(Box::new(Node::new(val))));
	}
	
	
	pub fn peek(&self) -> Option<&E> {
		let mut result = None;
		let mut node = &self.head.next;
		loop {
			match *node {
				None => break,
				Some(ref nd) => {
					match result {
						None => {
							result = nd.value.as_ref();
						},
						Some(val) => {
							if *nd.value.as_ref().unwrap() < *val {
								result = nd.value.as_ref();
							}
						},
					}
					node = &nd.next;
				},
			}
		}
		result
	}
	
	
	pub fn pop(&mut self) -> Option<E> {
		if self.head.next.is_none() {
			return None;
		}
		
		let mut minnodeindex: i32 = -1;
		{
			let mut min: Option<&E> = None;
			let mut node = &self.head.next;
			let mut nodeindex: i32 = 0;
			loop {
				match *node {
					None => break,
					Some(ref nd) => {
						if min.is_none() || *nd.value.as_ref().unwrap() < *min.unwrap() {
							min = nd.value.as_ref();
							minnodeindex = nodeindex;
						}
						node = &nd.next;
					},
				}
				nodeindex += 1;
			}
			assert!(min.is_some());
			assert!(minnodeindex >= 0);
		}
		
		let mut minnode = self.head.remove_at(minnodeindex);
		self.merge_nodes(minnode.remove_root());
		minnode.value
	}
	
	
	// Moves all the values in the given heap into this heap
	pub fn merge(&mut self, other: &mut Self) {
		let othernext = std::mem::replace(&mut other.head.next, None);
		self.merge_nodes(othernext);
	}
	
	
	// 'other' must not start with a dummy node
	fn merge_nodes(&mut self, mut other: Option<Box<Node<E>>>) {
		assert_eq!(self.head.rank, -1);
		assert!(other.is_none() || other.as_ref().unwrap().rank >= 0);
		let mut this = std::mem::replace(&mut self.head.next, None);
		let mut merged: Node<E> = Node::dummy();
		
		while this.is_some() || other.is_some() {
			let mut node: Node<E>;
			if other.is_none() || this.is_some() && this.as_ref().unwrap().rank <= other.as_ref().unwrap().rank {
				node = *this.unwrap();
				this = std::mem::replace(&mut node.next, None);
			} else {
				node = *other.unwrap();
				other = std::mem::replace(&mut node.next, None);
			}
			
			if merged.rank < node.rank {
				node.next = Some(Box::new(merged));
				merged = node;
			} else if merged.rank == node.rank + 1 {
				std::mem::swap(&mut merged.next, &mut node.next);
				merged.next = Some(Box::new(node));
			} else if merged.rank == node.rank {
				// Merge nodes
				if merged.value <= node.value {
					node.next = std::mem::replace(&mut merged.down, None);
					merged.down = Some(Box::new(node));
					merged.rank += 1;
				} else {
					let mergednext = std::mem::replace(&mut merged.next, None);
					merged.next = std::mem::replace(&mut node.down, None);
					node.down = Some(Box::new(merged));
					node.next = mergednext;
					node.rank += 1;
					merged = node;
				}
			} else {
				panic!("Assertion error");
			}
		}
		
		let mut reversed: Node<E> = merged;
		let mut merged: Option<Box<Node<E>>> = std::mem::replace(&mut reversed.next, None);
		while merged.is_some() {
			let mut node = *merged.unwrap();
			merged = std::mem::replace(&mut node.next, None);
			node.next = Some(Box::new(reversed));
			reversed = node;
		}
		self.head = reversed;
	}
	
	
	// For unit tests
	pub fn check_structure(&self) {
		assert!(self.head.value.is_none());
		assert_eq!(self.head.rank, -1);
		if let Some(ref next) = self.head.next {
			assert!(next.rank > self.head.rank);
			next.check_structure(true);
		}
	}
	
}


struct Node<E> {
	value: Option<E>,
	rank: i8,
	
	down: Option<Box<Node<E>>>,
	next: Option<Box<Node<E>>>,
}


impl <E: std::cmp::Ord> Node<E> {
	
	fn dummy() -> Self {
		Node {
			value: None,
			rank: -1,
			down: None,
			next: None,
		}
	}
	
	
	fn new(val: E) -> Self {
		Node {
			value: Some(val),
			rank: 0,
			down: None,
			next: None,
		}
	}
	
	
	fn remove_at(&mut self, index: i32) -> Self {
		if index < 0 {
			panic!("Assertion error");
		} else if index == 0 {
			let mut result = *std::mem::replace(&mut self.next, None).unwrap();
			std::mem::swap(&mut result.next, &mut self.next);
			result
		} else {
			self.next.as_mut().unwrap().remove_at(index - 1)
		}
	}
	
	
	fn remove_root(&mut self) -> Option<Box<Self>> {
		assert!(self.next.is_none());
		let mut result = None;
		let mut node = std::mem::replace(&mut self.down, None);
		while node.is_some() {  // Reverse the order of nodes from descending rank to ascending rank
			let mut nd = *node.unwrap();
			let next = std::mem::replace(&mut nd.next, None);
			nd.next = result;
			result = Some(Box::new(nd));
			node = next;
		}
		result
	}
		
		
	// For unit tests
	fn check_structure(&self, ismain: bool) {
		assert!(self.value.is_some() && self.rank >= 0);
		if self.rank >= 1 {
			match self.down {
				None => panic!("Assertion error"),
				Some(ref down) => {
					assert_eq!(down.rank, self.rank - 1);
					down.check_structure(false);
				},
			}
			if !ismain {
				match self.next {
					None => panic!("Assertion error"),
					Some(ref next) => {
						assert_eq!(next.rank, self.rank - 1);
						next.check_structure(false);
					},
				}
			}
		}
		if ismain {
			if let Some(ref next) = self.next {
				assert!(next.rank > self.rank);
				next.check_structure(true);
			}
		}
	}
	
}
