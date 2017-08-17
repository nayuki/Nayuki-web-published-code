/* 
 * Binary array set (Rust)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/binary-array-set
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

extern crate std;


pub struct BinaryArraySet<E> {
	
	// Each values[i]'s length is either 0 or 2^i, with elements in ascending order
	values: Vec<Vec<E>>,
	
	size: usize,
	
}


impl <E: std::cmp::Ord> BinaryArraySet<E> {
	
	pub fn new() -> BinaryArraySet<E> {
		BinaryArraySet {
			values: Vec::new(),
			size: 0,
		}
	}
	
	
	// Runs in O(1) time
	pub fn is_empty(&self) -> bool {
		self.size == 0
	}
	
	
	// Runs in O(1) time
	pub fn len(&self) -> usize {
		self.size
	}
	
	
	pub fn clear(&mut self) {
		self.values.clear();
		self.size = 0;
	}
	
	
	// Runs in O((log n)^2) time
	pub fn contains(&self, val: &E) -> bool {
		for vals in &self.values {
			if let Ok(_) = vals.binary_search(val) {
				return true;
			}
		}
		false
	}
	
	
	// Runs in average-case O((log n)^2) time, worst-case O(n) time
	pub fn insert(&mut self, val: E) -> bool {
		// Checking for duplicates is expensive
		if self.contains(&val) {
			return false;
		} else {
			self.insert_unique(val);
			return true;
		}
	}
	
	
	// Runs in amortized O(1) time, worst-case O(n) time
	pub fn insert_unique(&mut self, val: E) {
		if self.size == std::usize::MAX {
			panic!("Maximum size reached");
		}
		let mut toput: Vec<E> = vec![val];
		let mut i: usize = 0;
		loop {
			if i >= self.values.len() {
				self.values.push(toput);
				break;
			}
			
			let vals: &mut Vec<E> = &mut self.values[i];
			if vals.is_empty() {
				*vals = toput;
				break;
			}
			
			// Merge two sorted arrays
			if vals.len() != toput.len() || vals.len() > std::usize::MAX / 2 {
				panic!("Assertion error");
			}
			toput = merge_vecs(vals, &mut toput);
			i += 1;
		}
		self.size += 1;
	}
	
	
	pub fn check_structure(&self) {
		let mut sum: usize = 0;
		for (i, vals) in self.values.iter().enumerate() {
			let len: usize = vals.len();
			if len != 0 && len != 1usize << i {
				panic!("Invalid sub-vector length");
			}
			for j in 1 .. vals.len() {
				if vals[j - 1] >= vals[j] {
					panic!("Invalid ordering of elements in vector");
				}
			}
			sum += len;
		}
		if sum != self.size {
			panic!("Size mismatch between counter and sub-vectors");
		}
	}
	
}


// (Private) Assuming that xs and ys are both in ascending order, this
// moves all their elements into a new sorted vector zs and returns it.
fn merge_vecs<E: std::cmp::Ord>(xs: &mut Vec<E>, ys: &mut Vec<E>) -> Vec<E> {
	let mut result: Vec<E> = Vec::with_capacity(xs.len() + ys.len());
	loop {
		let which: bool = if xs.is_empty() && ys.is_empty() {
			break;
		} else if xs.is_empty() {
			false
		} else if ys.is_empty() {
			true
		} else {
			xs.last().unwrap() > ys.last().unwrap()
		};
		result.push((if which { xs.pop() } else { ys.pop() }).unwrap());
	}
	result.reverse();
	result
}
