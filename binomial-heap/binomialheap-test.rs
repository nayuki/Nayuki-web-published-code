/* 
 * Binomial heap test (Rust)
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

extern crate rand;
use rand::distributions::IndependentSample;
use rand::distributions::range::Range;
mod binomialheap;
use binomialheap::BinomialHeap;


fn main() {
	test_size_1();
	test_size_2();
	test_size_7();
	test_against_rust_binary_heap_randomly();
}


fn test_size_1() {
	let mut h = BinomialHeap::<i32>::new();
	h.push(3);
	assert_eq!(h.len(), 1);
	assert_eq!(*h.peek().unwrap(), 3);
	assert_eq!(h.pop().unwrap(), 3);
	assert_eq!(h.len(), 0);
}


fn test_size_2() {
	let mut h = BinomialHeap::<i32>::new();
	h.push(4);
	h.push(2);
	assert_eq!(h.len(), 2);
	assert_eq!(*h.peek().unwrap(), 2);
	assert_eq!(h.pop().unwrap(), 2);
	assert_eq!(h.len(), 1);
	assert_eq!(*h.peek().unwrap(), 4);
	assert_eq!(h.pop().unwrap(), 4);
	assert_eq!(h.len(), 0);
}


fn test_size_7() {
	let mut h = BinomialHeap::<i32>::new();
	h.push(2);
	h.push(7);
	h.push(1);
	h.push(8);
	h.push(3);
	h.push(1);
	h.push(4);
	assert_eq!(h.len(), 7);
	assert_eq!(h.pop().unwrap(), 1);  assert_eq!(h.len(), 6);
	assert_eq!(h.pop().unwrap(), 1);  assert_eq!(h.len(), 5);
	assert_eq!(h.pop().unwrap(), 2);  assert_eq!(h.len(), 4);
	assert_eq!(h.pop().unwrap(), 3);  assert_eq!(h.len(), 3);
	assert_eq!(h.pop().unwrap(), 4);  assert_eq!(h.len(), 2);
	assert_eq!(h.pop().unwrap(), 7);  assert_eq!(h.len(), 1);
	assert_eq!(h.pop().unwrap(), 8);  assert_eq!(h.len(), 0);
}


// Comprehensively tests all the defined methods
fn test_against_rust_binary_heap_randomly() {
	let trials = 100_000;
	let mut rng = rand::thread_rng();
	let opcountdist = Range::new(1, 101);
	let valuedist = Range::new(0i32, 10000i32);
	
	let mut heap = BinomialHeap::<i32>::new();
	let mut queue = std::collections::binary_heap::BinaryHeap::<i32>::new();
	let mut size = 0usize;
	for _ in 0 .. trials {
		let op = Range::new(0, 100).ind_sample(&mut rng);
		
		if op < 1 {  // Clear
			heap.check_structure();
			for _ in 0 .. size {
				assert_eq!(-queue.pop().unwrap(), heap.pop().unwrap());
			}
			size = 0;
			
		} else if op < 2 {  // Peek
			heap.check_structure();
			if size > 0 {
				assert_eq!(-*queue.peek().unwrap(), *heap.peek().unwrap());
			}
			
		} else if op < 60 {  // push
			let n = opcountdist.ind_sample(&mut rng);
			for _ in 0 .. n {
				let val = valuedist.ind_sample(&mut rng);
				queue.push(-val);
				heap.push(val);
			}
			size += n;
			
		} else if op < 70 {  // Merge
			let n = opcountdist.ind_sample(&mut rng);
			let mut temp = BinomialHeap::<i32>::new();
			for _ in 0 .. n {
				let val = valuedist.ind_sample(&mut rng);
				queue.push(-val);
				temp.push(val);
			}
			heap.merge(&mut temp);
			assert_eq!(temp.len(), 0);
			size += n;
			
		} else if op < 100 {  // Remove
			let n = std::cmp::min(opcountdist.ind_sample(&mut rng), size);
			for _ in 0 .. n {
				assert_eq!(-queue.pop().unwrap(), heap.pop().unwrap());
			}
			size -= n;
			
		} else {
			panic!("Assertion error");
		}
		
		assert_eq!(queue.len(), size);
		assert_eq!(heap.len(), size);
	}
}
