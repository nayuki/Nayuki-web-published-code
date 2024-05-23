/* 
 * Binary array set (Rust)
 * 
 * Copyright (c) 2024 Project Nayuki. (MIT License)
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

use std;
use std::convert::TryFrom;


#[derive(Clone,Default)]
pub struct BinaryArraySet<E> {
	
	// Each values[i]'s length is either 0 or 2^i, with elements in ascending order
	values: Vec<Vec<E>>,
	
	size: usize,
	
}


impl<E: Ord> BinaryArraySet<E> {
	
	pub fn new() -> Self {
		Self {
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
		self.values.iter().any(
			|vals| vals.binary_search(val).is_ok())
	}
	
	
	// Runs in average-case O((log n)^2) time, worst-case O(n) time
	pub fn insert(&mut self, val: E) -> bool {
		let result: bool = !self.contains(&val);  // Checking for duplicates is expensive
		if result {
			self.insert_unique(val);
		}
		result
	}
	
	
	// Runs in amortized O(log) time, worst-case O(n) time
	pub fn insert_unique(&mut self, val: E) {
		self.size = self.size.checked_add(1).expect("Maximum size reached");
		let mut toput: Vec<E> = vec![val];
		for vals in &mut self.values {
			if vals.is_empty() {
				*vals = toput;
				return;
			}
			
			// Merge two sorted arrays
			assert_eq!(vals.len(), toput.len());
			toput = Self::merge_vecs(vals, toput);
		}
		self.values.push(toput);
	}
	
	
	pub fn check_structure(&self) {
		let mut sum: usize = 0;
		for (i, vals) in self.values.iter().enumerate() {
			let len: usize = vals.len();
			assert!(len == 0 || len == 1usize.checked_shl(u32::try_from(i).unwrap()).unwrap(), "Invalid sub-vector length");
			for j in 1 .. len {
				assert!(vals[j - 1] < vals[j], "Invalid ordering of elements in vector");
			}
			sum = sum.checked_add(len).unwrap();
		}
		assert_eq!(sum, self.size, "Size mismatch between counter and sub-vectors");
	}
	
	
	// (Private) Assuming that xs and ys are both in ascending order, this
	// moves all their elements into a new sorted vector zs and returns it.
	fn merge_vecs(xs: &mut Vec<E>, ys: Vec<E>) -> Vec<E> {
		let mut result = Vec::<E>::with_capacity(xs.len().checked_add(ys.len()).unwrap());
		let mut xiter = xs.drain(..);
		let mut yiter = ys.into_iter();
		let mut xnext = xiter.next();
		let mut ynext = yiter.next();
		loop {
			let takex: bool = match (xnext.as_ref(), ynext.as_ref()) {
				(None, None) => break,
				(_, None) => true,
				(None, _) => false,
				(Some(x), Some(y)) => *x <= *y,
			};
			if takex {
				result.push(xnext.unwrap());
				xnext = xiter.next();
			} else {
				result.push(ynext.unwrap());
				ynext = yiter.next();
			}
		}
		result
	}
	
}



/*---- Helper structs ----*/

impl<E> IntoIterator for BinaryArraySet<E> {
	type Item = E;
	type IntoIter = MoveIter<E>;
	
	fn into_iter(self) -> Self::IntoIter {
		MoveIter::<E>::new(self)
	}
}


pub struct MoveIter<E> {
	values: std::vec::IntoIter<Vec<E>>,
	vals: std::vec::IntoIter<E>,
	count: usize,
}


impl<E> MoveIter<E> {
	// Runs in O(1) time
	fn new(set: BinaryArraySet<E>) -> Self {
		Self {
			values: set.values.into_iter(),
			vals: Vec::<E>::new().into_iter(),
			count: set.size,
		}
	}
}


impl<E> Iterator for MoveIter<E> {
	type Item = E;
	
	// Runs in amortized O(1) time, worst-case O(log n) time
	fn next(&mut self) -> Option<Self::Item> {
		loop {
			let result: Option<Self::Item> = self.vals.next();
			if result.is_some() {
				self.count -= 1;
				return result;
			}
			self.vals = self.values.next()?.into_iter();
		}
	}
	
	
	fn size_hint(&self) -> (usize,Option<usize>) {
		(self.count, Some(self.count))
	}
	
	fn count(self) -> usize {
		self.count
	}
	
}


impl<'a, E> IntoIterator for &'a BinaryArraySet<E> {
	type Item = &'a E;
	type IntoIter = RefIter<'a, E>;
	
	fn into_iter(self) -> Self::IntoIter {
		RefIter::<E>::new(&self)
	}
}


#[derive(Clone)]
pub struct RefIter<'a, E:'a> {
	values: std::slice::Iter<'a, Vec<E>>,
	vals: Option<std::slice::Iter<'a, E>>,
	count: usize,
}


impl<'a, E> RefIter<'a, E> {
	// Runs in O(log n) time
	fn new(set: &'a BinaryArraySet<E>) -> Self {
		let mut temp = set.values.iter();
		Self {
			vals: temp.next().map(|v| v.iter()),
			values: temp,
			count: set.size,
		}
	}
}


impl<'a, E> Iterator for RefIter<'a, E> {
	type Item = &'a E;
	
	// Runs in amortized O(1) time, worst-case O(log n) time
	fn next(&mut self) -> Option<Self::Item> {
		loop {
			let vals = self.vals.as_mut()?;
			if let result@Some(_) = vals.next() {
				self.count -= 1;
				return result;
			}
			self.vals = self.values.next().map(|v| v.iter());
		}
	}
	
	
	fn size_hint(&self) -> (usize,Option<usize>) {
		(self.count, Some(self.count))
	}
	
	fn count(self) -> usize {
		self.count
	}
	
}
