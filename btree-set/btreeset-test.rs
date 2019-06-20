/* 
 * B-tree set test (Rust)
 * 
 * Copyright (c) 2019 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/btree-set
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

use std::collections::HashSet;
extern crate rand;
use rand::Rng;
use rand::distributions::IndependentSample;
use rand::distributions::range::Range;
mod btreeset;
use btreeset::BTreeSet;


fn main() {
	test_small_randomly();
	test_insert_randomly();
	test_large_randomly();
	test_remove_all_randomly();
	println!("Test passed");
}


fn test_small_randomly() {
	let trials = 1000;
	let operations = 100;
	let range = 1000;
	let mut rng = rand::thread_rng(); let rng = &mut rng;
	let degreedist = Range::new(2usize, 7);
	let valuedist = Range::new(0i32, range);
	
	for _ in 0 .. trials {
		let mut set0 = HashSet::<i32>::new();
		let mut set1 = BTreeSet::<i32>::new(degreedist.ind_sample(rng));
		for _ in 0 .. operations {
			// Add/remove a random value
			let val: i32 = valuedist.ind_sample(rng);
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
			for k in -4 .. range + 4 {
				assert_eq!(set0.contains(&k), set1.contains(&k));
			}
		}
	}
}


fn test_insert_randomly() {
	let trials = 100;
	let operations = 10_000;
	let range = 100_000;
	let checks = 10;
	let mut rng = rand::thread_rng(); let rng = &mut rng;
	let valuedist = Range::new(0i32, range);
	
	for _ in 0 .. trials {
		let mut set0 = HashSet::<i32>::new();
		let mut set1 = BTreeSet::<i32>::new(2);
		for _ in 0 .. operations {
			// Add a random value
			let val: i32 = valuedist.ind_sample(rng);
			assert_eq!(set0.insert(val), set1.insert(val));
			if rng.next_f64() < 0.003 {
				set1.check_structure();
			}
			
			// Check size and random element membership
			assert_eq!(set0.len(), set1.len());
			for _ in 0 .. checks {
				let val: i32 = valuedist.ind_sample(rng);
				assert_eq!(set0.contains(&val), set1.contains(&val));
			}
		}
	}
}


fn test_large_randomly() {
	let trials = 100;
	let operations = 30_000;
	let range = 100_000;
	let checks = 10;
	let mut rng = rand::thread_rng(); let rng = &mut rng;
	let degreedist = Range::new(2usize, 7);
	let valuedist = Range::new(0i32, range);
	
	for _ in 0 .. trials {
		let mut set0 = HashSet::<i32>::new();
		let mut set1 = BTreeSet::<i32>::new(degreedist.ind_sample(rng));
		for _ in 0 .. operations {
			// Add/remove a random value
			let val: i32 = valuedist.ind_sample(rng);
			if rng.next_f64() < 0.5 {
				assert_eq!(set0.insert(val), set1.insert(val));
			} else {
				assert_eq!(set0.remove(&val), set1.remove(&val));
			}
			if rng.next_f64() < 0.001 {
				set1.check_structure();
			}
			
			// Check size and random element membership
			assert_eq!(set0.len(), set1.len());
			for _ in 0 .. checks {
				let val: i32 = valuedist.ind_sample(rng);
				assert_eq!(set0.contains(&val), set1.contains(&val));
			}
		}
	}
}


fn test_remove_all_randomly() {
	let trials = 100;
	let limit = 10_000;
	let range = 100_000;
	let checks = 10;
	let mut rng = rand::thread_rng(); let rng = &mut rng;
	let degreedist = Range::new(2usize, 7);
	let valuedist = Range::new(0i32, range);
	
	for _ in 0 .. trials {
		// Create sets and add all values
		let mut set0 = HashSet::<i32>::new();
		let mut set1 = BTreeSet::<i32>::new(degreedist.ind_sample(rng));
		for _ in 0 .. limit {
			let val: i32 = valuedist.ind_sample(rng);
			assert_eq!(set0.insert(val), set1.insert(val));
		}
		set1.check_structure();
		
		// Remove each value in random order
		let mut list: Vec<i32> = set0.iter().map(|x| *x).collect();
		rng.shuffle(&mut list);
		for val in list {
			assert_eq!(set0.remove(&val), set1.remove(&val));
			if rng.next_f64() < (1.0 / (set1.len() as f64)).max(0.001) {
				set1.check_structure();
			}
			assert_eq!(set0.len(), set1.len());
			for _ in 0 .. checks {
				let val: i32 = valuedist.ind_sample(rng);
				assert_eq!(set0.contains(&val), set1.contains(&val));
			}
		}
	}
}
