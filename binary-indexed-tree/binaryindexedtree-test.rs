/* 
 * Binary indexed tree test (Rust)
 * 
 * Copyright (c) 2019 Project Nayuki. (MIT License)
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

extern crate rand;
use rand::Rng;
use rand::distributions::IndependentSample;
use rand::distributions::range::Range;
mod binaryindexedtree;
use binaryindexedtree::BinaryIndexedTree;


fn main() {
	test_size_constructor();
	test_all_ones();
	test_array_constructor_randomly();
	test_add_and_set_randomly();
	println!("Test passed");
}


fn test_size_constructor() {
	let SIZELIMIT: usize = 10_000;
	let CHECKS = 10;
	type T = i8;
	let mut rng = rand::thread_rng();
	for len in 0 .. SIZELIMIT {
		
		let bt = BinaryIndexedTree::<T>::new_size(len);
		assert_eq!(len, bt.len());
		assert_eq!(0, bt.get_total());
		
		let indexdist = Range::new(0, len.max(1));
		let indexonedist = Range::new(0, len + 1);
		for _ in 0 .. CHECKS {
			if len > 0 {
				assert_eq!(0, bt.get(indexdist.ind_sample(&mut rng)));
			}
			assert_eq!(0, bt.get_prefix_sum(indexonedist.ind_sample(&mut rng)));
			
			let mut start = indexonedist.ind_sample(&mut rng);
			let mut end   = indexonedist.ind_sample(&mut rng);
			if start > end {
				std::mem::swap(&mut start, &mut end);
			}
			assert_eq!(0, bt.get_range_sum(start, end));
		}
	}
}


fn test_all_ones() {
	let SIZELIMIT: usize = 10_000;
	let CHECKS = 10;
	type T = u16;
	let mut rng = rand::thread_rng();
	let modedist = Range::new(0, 4);
	for len in 1 .. SIZELIMIT {
		
		let mut bt;
		let mode = modedist.ind_sample(&mut rng);
		if mode == 0 {
			bt = BinaryIndexedTree::<T>::new_array(&vec![1; len]);
		} else {
			bt = BinaryIndexedTree::<T>::new_size(len);
			let p: f64 = match mode {
				1 => 0.0,
				2 => 1.0,
				3 => rng.gen::<f64>(),
				_ => unreachable!(),
			};
			for i in 0 .. len {
				if rng.gen::<f64>() < p {
					bt.add(i, 1);
				} else {
					bt.set(i, 1);
				}
			}
		}
		
		assert_eq!(len, bt.len());
		assert_eq!(len as T, bt.get_total());
		let indexdist = Range::new(0, len.max(1));
		let indexonedist = Range::new(0, len + 1);
		for _ in 0 .. CHECKS {
			assert_eq!(1, bt.get(indexdist.ind_sample(&mut rng)));
			let k = indexonedist.ind_sample(&mut rng);
			assert_eq!(k as T, bt.get_prefix_sum(k));
			
			let mut start = indexonedist.ind_sample(&mut rng);
			let mut end   = indexonedist.ind_sample(&mut rng);
			if start > end {
				std::mem::swap(&mut start, &mut end);
			}
			assert_eq!((end - start) as T, bt.get_range_sum(start, end));
		}
	}
}


fn test_array_constructor_randomly() {
	let TRIALS = 10_000;
	let SIZELIMIT: usize = 10_000;
	let CHECKS = 100;
	type T = i64;
	let mut rng = rand::thread_rng();
	let lendist = Range::new(0, SIZELIMIT);
	for _ in 0 .. TRIALS {
		
		let len = lendist.ind_sample(&mut rng);
		let mut vals: Vec<T> = vec![];
		let mut cums: Vec<T> = vec![0];
		let valdist = Range::new(-1000, 1001);
		for _ in 0 .. len {
			let x = valdist.ind_sample(&mut rng);
			vals.push(x);
			let y = *cums.last().unwrap();
			cums.push(y + x);
		}
		
		let bt = BinaryIndexedTree::<T>::new_array(&vals);
		assert_eq!(len, bt.len());
		assert_eq!(cums[len], bt.get_total());
		
		let indexdist = Range::new(0, len.max(1));
		let indexonedist = Range::new(0, len + 1);
		for _ in 0 .. CHECKS {
			if len > 0 {
				let k = indexdist.ind_sample(&mut rng);
				assert_eq!(vals[k], bt.get(k));
			}
			let k = indexonedist.ind_sample(&mut rng);
			assert_eq!(cums[k], bt.get_prefix_sum(k));
			
			let mut start = indexonedist.ind_sample(&mut rng);
			let mut end   = indexonedist.ind_sample(&mut rng);
			if start > end {
				std::mem::swap(&mut start, &mut end);
			}
			assert_eq!(cums[end] - cums[start], bt.get_range_sum(start, end));
		}
	}
}


fn test_add_and_set_randomly() {
	let TRIALS = 10_000;
	let SIZELIMIT: usize = 10_000;
	let OPERATIONS = 10_000;
	let CHECKS = 100;
	type E = u64;
	type T = std::num::Wrapping<E>;
	let mut rng = rand::thread_rng();
	let lendist = Range::new(1, SIZELIMIT);
	for _ in 0 .. TRIALS {
		
		let len = lendist.ind_sample(&mut rng);
		let mut vals: Vec<T>;
		let mut bt: BinaryIndexedTree<T> = if rng.gen::<bool>() {
			vals = vec![std::num::Wrapping(0); len];
			BinaryIndexedTree::<T>::new_size(len)
		} else {
			vals = (0 .. len).map(|_| std::num::Wrapping(rng.gen::<E>())).collect();
			BinaryIndexedTree::<T>::new_array(&vals)
		};
		
		let indexdist = Range::new(0, len.max(1));
		for _ in 0 .. OPERATIONS {
			let k = indexdist.ind_sample(&mut rng);
			let x: T = std::num::Wrapping(rng.gen());
			if rng.gen::<bool>() {
				vals[k] += x;
				bt.add(k, x);
			} else {
				vals[k] = x;
				bt.set(k, x);
			}
		}
		
		let mut cums = vec![std::num::Wrapping(0)];
		for x in vals.iter() {
			let y = *cums.last().unwrap();
			cums.push(y + x);
		}
		
		let indexonedist = Range::new(0, len + 1);
		for _ in 0 .. CHECKS {
			let k = indexdist.ind_sample(&mut rng);
			assert_eq!(vals[k], bt.get(k));
			let k = indexonedist.ind_sample(&mut rng);
			assert_eq!(cums[k], bt.get_prefix_sum(k));
			
			let mut start = indexonedist.ind_sample(&mut rng);
			let mut end   = indexonedist.ind_sample(&mut rng);
			if start > end {
				std::mem::swap(&mut start, &mut end);
			}
			assert_eq!(cums[end] - cums[start], bt.get_range_sum(start, end));
		}
	}
}
