/* 
 * Binomial heap (Rust)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
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


impl <E: std::cmp::Ord> BinomialHeap<E> {
	
	/*-- Constructors --*/
	
	pub fn new() -> Self {
		Self {
			head: None,
		}
	}
	
	
	/*-- Methods --*/
	
	pub fn is_empty(&self) -> bool {
		self.head.is_none()
	}
	
	
	pub fn len(&self) -> usize {
		let mut result = 0;
		let mut node = &self.head;
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
		let minnodeindex: u32 = match self.find_min() {
			None => { return None; },
			Some((_, index)) => { index },
		};
		
		let mut minnode: Option<Node<E>> = None;
		{
			let mut node = &mut self.head;
			for index in 0u32 .. {
				if index < minnodeindex {
					match {node} {
						&mut Some(ref mut nd) => node = &mut nd.next,
						_ => unreachable!(),
					}
				} else if index == minnodeindex {
					let mut temp = *std::mem::replace(node, None).unwrap();
					std::mem::swap(node, &mut temp.next);
					minnode = Some(temp);
					break;
				} else {
					unreachable!();
				}
			}
		}
		
		let mut minnode = minnode.unwrap();
		self.merge_nodes(minnode.remove_root());
		Some(minnode.value)
	}
	
	
	fn find_min(&self) -> Option<(&E, u32)> {
		let mut minvalue: &E;
		let mut node: &Node<E>;
		match self.head {
			None => { return None; },
			Some(ref nd) => {
				minvalue = &nd.value;
				node = nd;
			},
		};
		
		let mut minindex = 0;
		for index in 1u32 .. {
			match node.next {
				None => break,
				Some(ref next) => {
					node = next.as_ref();
					if node.value < *minvalue {
						minvalue = &node.value;
						minindex = index;
					}
				},
			}
		}
		Some((minvalue, minindex))
	}
	
	
	// Moves all the values in the given heap into this heap
	pub fn merge(&mut self, other: &mut Self) {
		let othernodes = std::mem::replace(&mut other.head, None);
		self.merge_nodes(othernodes);
	}
	
	
	fn merge_nodes(&mut self, mut other: MaybeNode<E>) {
		let mut this = std::mem::replace(&mut self.head, None);
		let mut merged: MaybeNode<E> = None;
		
		while this.is_some() || other.is_some() {
			let mut node: Box<Node<E>>;
			if other.is_none() || this.is_some() && this.as_ref().unwrap().rank <= other.as_ref().unwrap().rank {
				node = this.unwrap();
				this = std::mem::replace(&mut node.next, None);
			} else {
				node = other.unwrap();
				other = std::mem::replace(&mut node.next, None);
			}
			
			if merged.is_none() || merged.as_ref().unwrap().rank < node.rank {
				node.next = merged;
				merged = Some(node);
			} else {
				let mut mrgd = merged.unwrap();
				if mrgd.rank == node.rank + 1 {
					std::mem::swap(&mut mrgd.next, &mut node.next);
					mrgd.next = Some(node);
				} else if mrgd.rank == node.rank {
					// Merge nodes
					if node.value < mrgd.value {
						std::mem::swap(&mut node.value, &mut mrgd.value);
						std::mem::swap(&mut node.down, &mut mrgd.down);
					}
					node.next = std::mem::replace(&mut mrgd.down, None);
					mrgd.down = Some(node);
					mrgd.rank += 1;
				} else {
					unreachable!();
				}
				merged = Some(mrgd);
			}
		}
		self.head = reverse_nodes(merged);
	}
	
	
	// For unit tests
	pub fn check_structure(&self) {
		match self.head {
			Some(ref node) => node.check_structure(true, None),
			_ => (),
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


impl <E: std::cmp::Ord> Node<E> {
	
	/*-- Constructors --*/
	
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
		let temp = std::mem::replace(&mut self.down, None);
		reverse_nodes(temp)
	}
		
		
	// For unit tests
	fn check_structure(&self, ismain: bool, lowerbound: Option<&E>) {
		// Basic checks
		assert_eq!(ismain, lowerbound.is_none(), "Invalid arguments");
		assert!(ismain || self.value >= *lowerbound.unwrap(), "Min-heap property violated");
		
		// Check children and non-main chains
		if self.rank > 0 {
			match self.down {
				None => panic!("Down node absent"),
				Some(ref down) => {
					assert_eq!(down.rank, self.rank - 1, "Down node has invalid rank");
					down.check_structure(false, Some(&self.value));
				},
			}
			if !ismain {
				match self.next {
					None => panic!("Next node absent"),
					Some(ref next) => {
						assert_eq!(next.rank, self.rank - 1, "Next node has invalid rank");
						next.check_structure(false, lowerbound);
					},
				}
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
	loop {
		match nodes {
			None => break,
			Some(mut node) => {
				nodes = std::mem::replace(&mut node.next, result);
				result = Some(node);
			},
		}
	}
	result
}
