/* 
 * Sliding window min/max test (Rust)
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/sliding-window-minimum-maximum-algorithm
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
mod slidingwindowminmax;


fn main() {
	test_randomly();
	test_incremental();
	println!("Test passed");
}


fn test_randomly() {
	let trials = 100_000;
	let rng = &mut rand::thread_rng();
	let valuedist = Range::new(0u32, 100);
	let arraylendist = Range::new(0usize, 1000);
	let windowdist = Range::new(1usize, 31);
	
	for _ in 0 .. trials {
		let arraylen = arraylendist.ind_sample(rng);
		let array: Vec<u32> = (0 .. arraylen).map(
			|_| valuedist.ind_sample(rng)).collect();
		let window = windowdist.ind_sample(rng);
		let maximize: bool = rng.gen();
		
		let expect: Vec<u32> = compute_sliding_window_min_or_max_naive               (&array, window, maximize);
		let actual: Vec<u32> = slidingwindowminmax::compute_sliding_window_min_or_max(&array, window, maximize);
		assert_eq!(actual, expect, "Array mismatch");
	}
}


fn test_incremental() {
	let trials = 10_000;
	let rng = &mut rand::thread_rng();
	let valuedist = Range::new(0i8, 100);
	
	for _ in 0 .. trials {
		let arraylen: usize = 1000;
		let array: Vec<i8> = (0 .. arraylen).map(
			|_| valuedist.ind_sample(rng)).collect();
		
		let mut swm = slidingwindowminmax::SlidingWindowMinMax::new();
		let mut start: usize = 0;
		let mut end: usize = 0;
		while start < array.len() {
			if start == end || (end < array.len() && rng.gen::<bool>()) {
				swm.add_tail(&array[end]);
				end += 1;
			} else {
				swm.remove_head(&array[start]);
				start += 1;
			}
			assert!(start <= end);
			if start < end {
				let subarr = &array[start .. end];
				assert_eq!(*swm.get_minimum(), *subarr.iter().min().unwrap());
				assert_eq!(*swm.get_maximum(), *subarr.iter().max().unwrap());
			}
		}
	}
}


fn compute_sliding_window_min_or_max_naive<E: std::cmp::Ord + Clone>(array: &[E], window: usize, maximize: bool) -> Vec<E> {
	assert!(window > 0, "Window size must be positive");
	array.windows(window).map(|subarr| {
		let iter = subarr.iter();
		(if maximize { iter.max() } else { iter.min() }).unwrap().clone()
	}).collect()
}
