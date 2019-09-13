/* 
 * Disjoint-set data structure - Test suite (Rust)
 * 
 * Copyright (c) 2019 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/disjoint-set-data-structure
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
use rand::Rng;
use rand::distributions::IndependentSample;
mod disjointset;
use disjointset::DisjointSet;


/*---- Main runner ----*/

fn main() {
	test_new();
	test_merge();
	test_big_merge();
	test_against_naive_randomly();
	println!("Test passed");
}



/*---- Test suite ----*/

fn test_new() {
	let mut ds = DisjointSet::new(10);
	assert_eq!(10, ds.number_of_sets());
	assert_eq!(1, ds.get_size_of_set(0));
	assert_eq!(1, ds.get_size_of_set(2));
	assert_eq!(1, ds.get_size_of_set(9));
	assert_eq!(true, ds.are_in_same_set(0, 0));
	assert_eq!(false, ds.are_in_same_set(0, 1));
	assert_eq!(false, ds.are_in_same_set(9, 3));
}


fn test_merge() {
	let mut ds = DisjointSet::new(10);
	assert_eq!(true, ds.merge_sets(0, 1));
	ds.check_structure();
	assert_eq!(9, ds.number_of_sets());
	assert_eq!(true, ds.are_in_same_set(0, 1));
	
	assert_eq!(true, ds.merge_sets(2, 3));
	ds.check_structure();
	assert_eq!(8, ds.number_of_sets());
	assert_eq!(true, ds.are_in_same_set(2, 3));
	
	assert_eq!(false, ds.merge_sets(2, 3));
	ds.check_structure();
	assert_eq!(8, ds.number_of_sets());
	assert_eq!(false, ds.are_in_same_set(0, 2));
	
	assert_eq!(true, ds.merge_sets(0, 3));
	ds.check_structure();
	assert_eq!(7, ds.number_of_sets());
	assert_eq!(true, ds.are_in_same_set(0, 2));
	assert_eq!(true, ds.are_in_same_set(3, 0));
	assert_eq!(true, ds.are_in_same_set(1, 3));
}


fn test_big_merge() {
	let maxrank: i8 = 20;
	let trials: i32 = 10000;
	
	let numelems: usize = 1 << maxrank;  // Grows exponentially
	let mut ds = DisjointSet::new(numelems);
	let rng = &mut rand::thread_rng();
	let range = rand::distributions::range::Range::new(0, numelems);
	for level in 0 .. maxrank {
		let mergestep: usize = 1 << level;
		let incrstep: usize = mergestep * 2;
		let mut i: usize = 0;
		while i < numelems {
			assert_eq!(false, ds.are_in_same_set(i, i + mergestep));
			assert_eq!(true, ds.merge_sets(i, i + mergestep));
			i += incrstep;
		}
		// Now we have a bunch of sets of size 2^(level+1)
		
		// Do random tests
		let mask: usize = incrstep.wrapping_neg();  // 0b11...100...00
		for _ in 0 .. trials {
			let j: usize = range.ind_sample(rng);
			let k: usize = range.ind_sample(rng);
			let expect: bool = (j & mask) == (k & mask);
			assert_eq!(expect, ds.are_in_same_set(j, k));
		}
	}
}


fn test_against_naive_randomly() {
	let trials: i32 = 1000;
	let iterations: i32 = 3000;
	let numelems: usize = 300;
	
	let rng = &mut rand::thread_rng();
	let range = rand::distributions::range::Range::new(0, numelems);
	for _ in 0 .. trials {
		let mut nds = NaiveDisjointSet::new(numelems);
		let mut ds = DisjointSet::new(numelems);
		for _ in 0 .. iterations {
			let i: usize = range.ind_sample(rng);
			let j: usize = range.ind_sample(rng);
			assert_eq!(nds.get_size_of_set(i), ds.get_size_of_set(i));
			assert_eq!(nds.are_in_same_set(i, j), ds.are_in_same_set(i, j));
			if rng.next_f64() < 0.1 {
				assert_eq!(nds.merge_sets(i, j), ds.merge_sets(i, j));
			}
			assert_eq!(nds.number_of_sets(), ds.number_of_sets());
			if rng.next_f64() < 0.001 {
				ds.check_structure();
			}
		}
		ds.check_structure();
	}
}



/*---- Helper definitions ----*/

struct NaiveDisjointSet {
	representatives: Vec<usize>,
}


impl NaiveDisjointSet {
	
	fn new(numelems: usize) -> Self {
		Self { representatives: (0usize .. numelems).collect() }
	}
	
	
	fn number_of_sets(&self) -> usize {
		self.representatives.iter().enumerate()
			.filter(|&(i, &repr)| repr == i).count()
	}
	
	
	fn get_size_of_set(&self, elemindex: usize) -> usize {
		let repr: usize = self.representatives[elemindex];
		self.representatives.iter().filter(|&r| *r == repr).count()
	}
	
	
	fn are_in_same_set(&self, elemindex0: usize, elemindex1: usize) -> bool {
		self.representatives[elemindex0] == self.representatives[elemindex1]
	}
	
	
	fn merge_sets(&mut self, elemindex0: usize, elemindex1: usize) -> bool {
		let repr0: usize = self.representatives[elemindex0];
		let repr1: usize = self.representatives[elemindex1];
		for c in self.representatives.iter_mut() {
			if *c == repr1 {
				*c = repr0;
			}
		}
		repr0 != repr1
	}
	
}
