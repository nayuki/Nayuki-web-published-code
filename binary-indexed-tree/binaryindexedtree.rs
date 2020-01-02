/* 
 * Binary indexed tree (Rust)
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/binary-indexed-tree
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

extern crate num_traits;
use std;


#[derive(Clone)]
pub struct BinaryIndexedTree<T> {
	
	sum_tree: Vec<T>,
	
}


impl<T: num_traits::identities::Zero +
		std::ops::AddAssign +
		std::ops::Sub<Output=T> +
		std::ops::SubAssign +
		std::marker::Copy>
	BinaryIndexedTree<T> {
	
	
	pub fn new_size(len: usize) -> Self {
		Self { sum_tree: vec![T::zero(); len] }
	}
	
	
	pub fn new_array(vals: &[T]) -> Self {
		let mut sumtree = vals.to_vec();
		for i in 0 .. sumtree.len() {
			let mut val = sumtree[i];
			// For each consecutive 1 in the lowest order bits of i
			let mut j: usize = 1;
			while i & j != 0 {
				val += sumtree[i ^ j];
				j <<= 1;
			}
			sumtree[i] = val;
		}
		Self { sum_tree: sumtree }
	}
	
	
	pub fn len(&self) -> usize {
		self.sum_tree.len()
	}
	
	
	pub fn get(&self, index: usize) -> T {
		assert!(index < self.len());
		let mut result: T = self.sum_tree[index];
		// For each consecutive 1 in the lowest order bits of index
		let mut i: usize = 1;
		while index & i != 0 {
			result -= self.sum_tree[index ^ i];
			i <<= 1;
		}
		result
	}
	
	
	pub fn set(&mut self, index: usize, val: T) {
		assert!(index < self.len());
		let temp = self.get(index);
		self.add(index, val - temp);
	}
	
	
	pub fn add(&mut self, mut index: usize, delta: T) {
		assert!(index < self.len());
		loop {
			self.sum_tree[index] += delta;
			index |= index + 1;  // Set lowest 0 bit; strictly increasing
			if index >= self.len() {
				break;
			}
		}
	}
	
	
	pub fn get_total(&self) -> T {
		self.get_prefix_sum(self.len())
	}
	
	
	pub fn get_prefix_sum(&self, mut end: usize) -> T {
		assert!(end <= self.len());
		let mut result = T::zero();
		while end > 0 {
			result += self.sum_tree[end - 1];
			end &= end - 1;  // Clear lowest 1 bit; strictly decreasing
		}
		result
	}
	
	
	pub fn get_range_sum(&self, start: usize, end: usize) -> T {
		assert!(start <= end && end <= self.len());
		self.get_prefix_sum(end) - self.get_prefix_sum(start)
	}
	
}
