/* 
 * Binary array set test (Rust)
 * 
 * Copyright (c) 2019 Project Nayuki. (MIT License)
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


extern crate rand;
use rand::distributions::IndependentSample;
mod binaryarrayset;


fn main() {
	test_blank();
	test_add_0();
	test_add_1();
	test_iterator();
	test_against_rust_set_randomly();
	println!("Test passed");
}


fn test_blank() {
	let set = binaryarrayset::BinaryArraySet::<i32>::new();
	assert!(!set.contains(&0));
	assert!(!set.contains(&-5));
	assert!(!set.contains(&2));
}


fn test_add_0() {
	let mut set = binaryarrayset::BinaryArraySet::<i32>::new();
	for i in 1 .. 101 {
		set.insert(i - 1);
		assert_eq!(set.len(), i as usize);
		assert!(!set.contains(&-7));
		assert!(!set.contains(&-1));
		for j in 0 .. i {
			assert!(set.contains(&j));
		}
		for j in i .. i + 10 {
			assert!(!set.contains(&j));
		}
	}
}


fn test_add_1() {
	let mut set = binaryarrayset::BinaryArraySet::<i32>::new();
	for i in 1 .. 31 {
		set.insert((i - 1) * (i - 1));
		for j in -3 .. i * i + 5 {
			assert_eq!(set.contains(&j), j <= (i - 1) * (i - 1) && is_perfect_square(j));
		}
	}
}


fn test_iterator() {
	let mut set = binaryarrayset::BinaryArraySet::<i32>::new();
	for i in 1i32 .. 101 {
		set.insert((i - 1) * (i - 1));
		
		let mut list: Vec<i32> = set.into_iter().cloned().collect();
		list.sort();
		assert_eq!(list.len(), i as usize);
		
		for j in 0 .. i {
			assert_eq!(j * j, list[j as usize]);
		}
	}
}


// Comprehensively tests all the defined methods
fn test_against_rust_set_randomly() {
	let trials = 100_000;
	let rng = &mut rand::thread_rng();
	let operationdist = rand::distributions::range::Range::new(0, 100);
	let opcountdist = rand::distributions::range::Range::new(1, 101);
	let valuedist = rand::distributions::range::Range::new(0i32, 10000i32);
	
	let mut set0 = std::collections::HashSet::<i32>::new();
	let mut set1 = binaryarrayset::BinaryArraySet::<i32>::new();
	let mut size: usize = 0;
	for _ in 0 .. trials {
		let op = operationdist.ind_sample(rng);
		
		if op < 1 {  // Clear
			set1.check_structure();
			set0.clear();
			set1.clear();
			size = 0;
			
		} else if op < 3 {  // Check iterator fully
			let mut list0: Vec<i32> = set0.     iter().cloned().collect();
			let mut list1: Vec<i32> = set1.into_iter().cloned().collect();
			list0.sort();
			list1.sort();
			assert_eq!(list0, list1);
			
		} else if op < 70 {  // Insert
			let n = opcountdist.ind_sample(rng);
			for _ in 0 .. n {
				let val: i32 = valuedist.ind_sample(rng);
				let added: bool = set0.insert(val);
				assert_eq!(added, set1.insert(val), "Insert mismatch");
				size += added as usize;
			}
			
		} else if op < 100 {  // Contains
			let n = opcountdist.ind_sample(rng);
			for _ in 0 .. n {
				let val: i32 = valuedist.ind_sample(rng);
				assert_eq!(set0.contains(&val), set1.contains(&val), "Contain test mismatch");
			}
			
		} else {
			unreachable!();
		}
		
		assert_eq!(set0.is_empty(), set1.is_empty(), "Emptiness mismatch");
		assert_eq!(set0.len(), size, "Set size mismatch");
		assert_eq!(set1.len(), size, "Set size mismatch");
	}
}


fn is_perfect_square(n: i32) -> bool {
	for i in 0 .. {
		if i * i == n {
			return true;
		} else if i * i > n {
			return false;
		}
	}
	unreachable!();
}
