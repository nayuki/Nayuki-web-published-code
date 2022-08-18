/* 
 * AA tree set test (Rust)
 * 
 * Copyright (c) 2022 Project Nayuki. (MIT License)
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

use std::collections::BTreeSet;
use std::convert::TryFrom;
extern crate rand;
use rand::Rng;
use rand::distributions::IndependentSample;
use rand::distributions::range::Range;
mod aatreeset;
use aatreeset::AaTreeSet;


fn main() {
	test_small_randomly();
	test_large_randomly();
	test_insert_randomly();
	test_iterator();
	test_ascending_operations();
	test_descending_operations();
	test_all_insertion_orders();
	test_remove_all_randomly();
	println!("Test passed");
}


fn test_small_randomly() {
	let trials = 300;
	let operations = 300;
	let range = 100;
	let valuedist = Range::new(0i32, range);
	let rng = &mut rand::thread_rng();
	
	for _ in 0 .. trials {
		let mut set0 = BTreeSet::<i32>::new();
		let mut set1 = AaTreeSet::<i32>::new();
		for _ in 0 .. operations {
			
			// Add/remove a random value
			let val = valuedist.ind_sample(rng);
			if rng.next_f64() < 0.001 {
				set0.clear();
				set1.clear();
			} else if rng.next_f64() < 0.5 {
				assert_eq!(set0.insert(val), set1.insert(val));
			} else {
				assert_eq!(set0.remove(&val), set1.remove(&val));
			}
			set1.check_structure();
			
			// Check size and check element membership over entire range
			assert_eq!(set0.is_empty(), set1.is_empty());
			assert_eq!(set0.len(), set1.len());
			for k in -10 .. range + 10 {
				assert_eq!(set0.contains(&k), set1.contains(&k));
			}
		}
	}
}


fn test_large_randomly() {
	let trials = 100;
	let operations = 10_000;
	let range = 100_000;
	let valuedist = Range::new(0i32, range);
	let checks = 10;
	let checkdist = Range::new(0i32 - 50, range + 50);
	let rng = &mut rand::thread_rng();
	
	for _ in 0 .. trials {
		let mut set0 = BTreeSet::<i32>::new();
		let mut set1 = AaTreeSet::<i32>::new();
		for _ in 0 .. operations {
			
			// Add/remove a random value
			let val = valuedist.ind_sample(rng);
			if rng.next_f64() < 0.5 {
				assert_eq!(set0.insert(val), set1.insert(val));
			} else {
				assert_eq!(set0.remove(&val), set1.remove(&val));
			}
			
			// Check size and random element membership
			assert_eq!(set0.len(), set1.len());
			for _ in 0 .. checks {
				let val = checkdist.ind_sample(rng);
				assert_eq!(set0.contains(&val), set1.contains(&val));
			}
			
			// Occasionally check entire set and iterator
			if rng.next_f64() < 0.001 {
				set1.check_structure();
				let mut iter0 = set0.iter().copied();
				let mut iter1 = set1.into_iter().copied();
				loop {
					let val = iter0.next();
					assert_eq!(val, iter1.next());
					if let None = val {
						break;
					}
				}
			}
		}
	}
}


fn test_insert_randomly() {
	let trials = 100;
	let operations = 10_000;
	let range = 100_000;
	let valuedist = Range::new(0i32, range);
	let checks = 10;
	let checkdist = Range::new(0i32 - 50, range + 50);
	let rng = &mut rand::thread_rng();
	
	for _ in 0 .. trials {
		let mut set0 = BTreeSet::<i32>::new();
		let mut set1 = AaTreeSet::<i32>::new();
		for _ in 0 .. operations {
			
			// Add a random value
			let val = valuedist.ind_sample(rng);
			assert_eq!(set0.insert(val), set1.insert(val));
			if rng.next_f64() < 0.003 {
				set1.check_structure();
			}
			
			// Check size and random element membership
			assert_eq!(set0.len(), set1.len());
			for _ in 0 .. checks {
				let val = checkdist.ind_sample(rng);
				assert_eq!(set0.contains(&val), set1.contains(&val));
			}
		}
	}
}


fn test_iterator() {
	let size = 1000;
	let mut set = AaTreeSet::<i32>::new();
	for i in 0 .. size {
		set.insert(i * i);
		let list: Vec<i32> = set.into_iter().copied().collect();
		assert_eq!(usize::try_from(i + 1).unwrap(), list.len());
		for (j, &val) in (0i32 .. ).zip(list.iter()) {
			assert_eq!(j * j, val);
		}
	}
}


fn test_ascending_operations() {
	let size = 300_000;
	let checks = 10;
	let rng = &mut rand::thread_rng();
	let mut set = AaTreeSet::<i32>::new();
	for i in 0 .. size {
		assert_eq!(usize::try_from(i).unwrap(), set.len());
		assert!(set.insert(i));
		for _ in 0 .. checks {
			let val = Range::new(-50i32, i + 50).ind_sample(rng);
			assert_eq!(set.contains(&val), 0 <= val && val <= i);
		}
	}
	for i in 0 .. size {
		assert_eq!(usize::try_from(size - i).unwrap(), set.len());
		assert!(set.remove(&i));
		for _ in 0 .. checks {
			let val = Range::new(-50i32, i + 50).ind_sample(rng);
			assert_eq!(set.contains(&val), i < val && val < size);
		}
	}
	assert_eq!(0, set.len());
}


fn test_descending_operations() {
	let size = 300_000;
	let checks = 10;
	let rng = &mut rand::thread_rng();
	let mut set = AaTreeSet::<i32>::new();
	for i in 0 .. size {
		assert_eq!(usize::try_from(i).unwrap(), set.len());
		assert!(set.insert(-i));
		for _ in 0 .. checks {
			let val = Range::new(-i - 50, 50i32).ind_sample(rng);
			assert_eq!(set.contains(&val), -i <= val && val <= 0);
		}
	}
	for i in 0 .. size {
		assert_eq!(usize::try_from(size - i).unwrap(), set.len());
		assert!(set.remove(&-i));
		for _ in 0 .. checks {
			let val = Range::new(-i - 50, 50i32).ind_sample(rng);
			assert_eq!(set.contains(&val), -size < val && val < -i);
		}
	}
	assert_eq!(0, set.len());
}


fn test_all_insertion_orders() {
	let limit = 10;
	let mut set = AaTreeSet::<i32>::new();
	
	for size in 0 .. limit + 1 {
		let mut values: Vec<i32> = (0 .. size).collect();
		loop {  // This runs factorial(size) iterations
			set.clear();
			for &val in &values {
				set.insert(val);
			}
			set.check_structure();
			
			let mut iter = set.into_iter().copied();
			for i in 0 .. size {
				assert_eq!(Some(i), iter.next());
			}
			assert_eq!(None, iter.next());
			if !next_permutation(&mut values) {
				break;
			}
		}
	}
}


fn test_remove_all_randomly() {
	let trials = 100;
	let limit = 10_000;
	let range = 100_000;
	let valuedist = Range::new(0i32, range);
	let checks = 10;
	let checkdist = Range::new(0i32 - 50, range + 50);
	let rng = &mut rand::thread_rng();
	
	for _ in 0 .. trials {
		// Create sets and add all values
		let mut set0 = BTreeSet::<i32>::new();
		let mut set1 = AaTreeSet::<i32>::new();
		for _ in 0 .. limit {
			let val = valuedist.ind_sample(rng);
			assert_eq!(set0.insert(val), set1.insert(val));
		}
		set1.check_structure();
		
		// Remove each value in random order
		let mut list: Vec<i32> = set0.iter().copied().collect();
		rng.shuffle(&mut list);
		for val in list {
			assert_eq!(set0.remove(&val), set1.remove(&val));
			if rng.next_f64() < (1.0 / (set1.len() as f64)).max(0.001) {
				set1.check_structure();
			}
			assert_eq!(set0.len(), set1.len());
			for _ in 0 .. checks {
				let val = checkdist.ind_sample(rng);
				assert_eq!(set0.contains(&val), set1.contains(&val));
			}
		}
		assert!(set0.is_empty());
		assert!(set1.is_empty());
	}
}


// Algorithm from https://www.nayuki.io/res/next-lexicographical-permutation-algorithm
fn next_permutation<T: std::cmp::Ord>(array: &mut [T]) -> bool {
	// Find non-increasing suffix
	if array.is_empty() {
		return false;
	}
	let mut i: usize = array.len() - 1;
	while i > 0 && array[i - 1] >= array[i] {
		i -= 1;
	}
	if i == 0 {
		return false;
	}
	
	// Find successor to pivot
	let mut j: usize = array.len() - 1;
	while array[j] <= array[i - 1] {
		j -= 1;
	}
	array.swap(i - 1, j);
	
	// Reverse suffix
	array[i .. ].reverse();
	true
}
