/* 
 * B-tree set test (Rust)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
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

extern crate rand;
use rand::distributions::IndependentSample;
mod btreeset;


fn main() {
	test_insert_randomly();
}


fn test_insert_randomly() {
	let trials = 100;
	let operations = 10000;
	let checks = 10;
	let mut rng = rand::thread_rng();
	let valuedist = rand::distributions::range::Range::new(0i32, 100_000i32);
	
	for _ in 0 .. trials {
		let mut set0 = std::collections::HashSet::<i32>::new();
		let mut set1 = btreeset::BTreeSet::<i32>::new(2);
		for _ in 0 .. operations {
			// Add a random value
			let val: i32 = valuedist.ind_sample(&mut rng);
			assert_eq!(set0.insert(val), set1.insert(val));
			
			// Check size and random element membership
			assert_eq!(set0.len(), set1.len());
			for _ in 0 .. checks {
				let val: i32 = valuedist.ind_sample(&mut rng);
				assert_eq!(set0.contains(&val), set1.contains(&val));
			}
		}
	}
}
