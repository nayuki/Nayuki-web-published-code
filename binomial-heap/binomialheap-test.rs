/* 
 * Binomial heap test (Rust)
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

extern crate rand;
use rand::distributions::IndependentSample;
use rand::distributions::range::Range;
mod binomialheap;
use binomialheap::BinomialHeap;


fn main() {
	test_size_1();
	test_size_2();
	test_size_7();
	test_iterator();
	test_against_vec_randomly();
	test_against_rust_binary_heap_randomly();
	println!("Test passed");
}


fn test_size_1() {
	let mut h = BinomialHeap::<i32>::new();
	h.push(3);
	h.check_structure();
	assert_eq!(h.len(), 1);
	assert_eq!(*h.peek().unwrap(), 3);
	assert_eq!(h.pop(), Some(3));
	h.check_structure();
	assert_eq!(h.len(), 0);
}


fn test_size_2() {
	let mut h = BinomialHeap::<i32>::new();
	h.push(4);
	h.push(2);
	h.check_structure();
	assert_eq!(h.len(), 2);
	assert_eq!(*h.peek().unwrap(), 2);
	assert_eq!(h.pop(), Some(2));
	h.check_structure();
	assert_eq!(h.len(), 1);
	assert_eq!(*h.peek().unwrap(), 4);
	assert_eq!(h.pop(), Some(4));
	h.check_structure();
	assert_eq!(h.len(), 0);
}


fn test_size_7() {
	let mut h = BinomialHeap::<i32>::new();
	h.push(2);
	h.push(7);
	h.push(1);
	h.push(8);
	h.push(3);
	h.check_structure();
	h.push(1);
	h.push(4);
	h.check_structure();
	assert_eq!(h.len(), 7);
	assert_eq!(h.pop(), Some(1));  assert_eq!(h.len(), 6);
	assert_eq!(h.pop(), Some(1));  assert_eq!(h.len(), 5);
	assert_eq!(h.pop(), Some(2));  assert_eq!(h.len(), 4);
	assert_eq!(h.pop(), Some(3));  assert_eq!(h.len(), 3);
	h.check_structure();
	assert_eq!(h.pop(), Some(4));  assert_eq!(h.len(), 2);
	assert_eq!(h.pop(), Some(7));  assert_eq!(h.len(), 1);
	assert_eq!(h.pop(), Some(8));  assert_eq!(h.len(), 0);
	h.check_structure();
}


fn test_iterator() {
	const SEQUENCE: &[i32] = &[
		21, 62, 99, 22, 26, 48, 25, 33, 85, 58,
		57, 31, 47, 32, 59, 41, 27, 42, 95, 94,
		67, 90, 80, 52, 50, 13, 17, 19, 66, 11,
		44, 51, 68, 89, 64, 53, 65, 49, 34, 39,
		16, 37, 71, 96, 74, 46, 18, 36, 30, 38,
		75, 61, 29, 84, 87, 73, 15, 40, 82, 83,
		63, 86, 54, 77, 55, 14, 70, 45, 92, 93,
		43, 12, 24, 35, 23, 91, 10, 76, 98, 69,
		28, 88, 81, 79, 72, 97, 78, 56, 60, 20,
	];
	
	for i in 0 .. SEQUENCE.len() {
		let mut vec: Vec<i32> = SEQUENCE[ .. i].to_vec();
		let mut heap = BinomialHeap::<i32>::new();
		for &val in &vec {
			heap.push(val);
		}
		vec.sort();
		
		let mut iter0 = vec.into_iter();
		let mut iter1 = heap.into_iter();
		loop {
			match (iter0.next(), iter1.next()) {
				(None, None) => break,
				(Some(x), Some(y)) => assert_eq!(x, y),
				_ => panic!(),
			}
		}
	}
}


fn test_against_vec_randomly() {
	let trials = 10_000;
	let maxsize: usize = 1000;
	let range: i32 = 1000;
	
	let rng = &mut rand::thread_rng();
	let sizedist = Range::new(0, maxsize);
	let valuedist = Range::new(0, range);
	
	let mut heap = BinomialHeap::<i32>::new();
	for _ in 0 .. trials {
		let size = sizedist.ind_sample(rng);
		let mut values = Vec::<i32>::with_capacity(size);
		for _ in 0 .. size {
			let val = valuedist.ind_sample(rng);
			values.push(val);
			heap.push(val);
		}
		
		values.sort();
		for val in values {
			assert_eq!(heap.pop(), Some(val));
		}
		heap.clear();
	}
}


fn test_against_rust_binary_heap_randomly() {
	let trials = 100_000;
	let iterops: usize = 100;
	let range: i32 = 10_000;
	
	let rng = &mut rand::thread_rng();
	let opcountdist = Range::new(1, iterops + 1);
	let valuedist = Range::new(0, range);
	
	let mut heap = BinomialHeap::<i32>::new();
	let mut queue = std::collections::binary_heap::BinaryHeap::<i32>::new();
	let mut size: usize = 0;
	for _ in 0 .. trials {
		let op = Range::new(0, 100).ind_sample(rng);
		
		if op < 1 {  // Clear
			heap.check_structure();
			for _ in 0 .. size {
				assert_eq!(queue.pop().map(|x| -x), heap.pop());
			}
			size = 0;
			
		} else if op < 2 {  // Peek
			heap.check_structure();
			assert_eq!(queue.peek().map(|x| -x), heap.peek().cloned());
			
		} else if op < 70 {  // Enqueue/merge
			let merge = !(op < 60);
			let mut temp = BinomialHeap::<i32>::new();
			let n = opcountdist.ind_sample(rng);
			for _ in 0 .. n {
				let val = valuedist.ind_sample(rng);
				queue.push(-val);
				if merge {
					temp.push(val);
				} else {
					heap.push(val);
				}
			}
			if merge {
				heap.merge(temp);
			}
			size += n;
			
		} else if op < 100 {  // Dequeue
			let n = std::cmp::min(opcountdist.ind_sample(rng), size);
			for _ in 0 .. n {
				assert_eq!(queue.pop().map(|x| -x), heap.pop());
			}
			size -= n;
			
		} else {
			unreachable!();
		}
		
		assert_eq!(queue.len(), size);
		assert_eq!(heap.len(), size);
		assert_eq!(queue.is_empty(), size == 0);
		assert_eq!(heap.is_empty(), size == 0);
	}
}
