/* 
 * Binary array set test (Rust)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
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


// Comprehensively tests all the defined methods against std::collections::HashSet
fn main() {
	let trials = 100_000;
	let mut rng = rand::thread_rng();
	let operationdist = rand::distributions::range::Range::new(0, 100);
	let opcountdist = rand::distributions::range::Range::new(1, 101);
	let valuedist = rand::distributions::range::Range::new(0i32, 10000i32);
	
	let mut set0: std::collections::HashSet<i32> = std::collections::HashSet::new();
	let mut set1: binaryarrayset::BinaryArraySet<i32> = binaryarrayset::BinaryArraySet::new();
	let mut size: usize = 0;
	for _ in 0 .. trials {
		let op = operationdist.ind_sample(&mut rng);
		
		if op < 1 {  // Clear
			set1.check_structure();
			set0.clear();
			set1.clear();
			size = 0;
			
		} else if op < 70 {  // Insert
			let n = opcountdist.ind_sample(&mut rng);
			for _ in 0 .. n {
				let val: i32 = valuedist.ind_sample(&mut rng);
				let added: bool = set0.insert(val);
				assert_eq!(set1.insert(val), added, "Insert mismatch");
				size += added as usize;
			}
			
		} else if op < 100 {  // Contains
			let n = opcountdist.ind_sample(&mut rng);
			for _ in 0 .. n {
				let val: i32 = valuedist.ind_sample(&mut rng);
				assert_eq!(set1.contains(&val), set0.contains(&val), "Contain test mismatch");
			}
			
		} else {
			panic!("Invalid random operation");
		}
		
		assert_eq!(set0.is_empty(), set1.is_empty(), "Emptiness mismatch");
		assert_eq!(set1.len(), size, "Set size mismatch");
		assert_eq!(set1.len(), size, "Set size mismatch");
	}
	println!("Test passed");
}
