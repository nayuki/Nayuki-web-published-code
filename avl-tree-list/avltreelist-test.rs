/* 
 * AVL tree list test (Rust)
 * 
 * Copyright (c) 2019 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/avl-tree-list
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
mod avltreelist;
use avltreelist::AvlTreeList;


fn main() {
	test_add();
	test_add_list();
	test_set();
	test_insert_at_beginning();
	test_insert_at_end();
	test_insert_at_middle();
	test_insert_list();
	test_insert_many_beginning();
	test_insert_many_end();
	test_insert_many_everywhere();
	test_remove();
	test_clear();
	test_iterator();
	test_against_rust_vec_randomly();
	println!("Test passed");
}


fn test_add() {
	let mut list = AvlTreeList::<&'static str>::new();
	list.push("January");
	list.push("February");
	list.push("March");
	list.push("April");
	list.push("May");
	list.push("June");
	list.check_structure();
	assert_eq!(list.len(), 6);
	assert_eq!(list[0], "January" );
	assert_eq!(list[1], "February");
	assert_eq!(list[2], "March"   );
	assert_eq!(list[3], "April"   );
	assert_eq!(list[4], "May"     );
	assert_eq!(list[5], "June"    );
}


fn test_add_list() {
	let mut list = AvlTreeList::<&'static str>::new();
	list.append(&mut vec!["January"]);
	list.append(&mut vec!["February", "March", "April"]);
	list.append(&mut vec!["May", "June", "July", "August", "September", "October", "November", "December"]);
	assert_eq!(list.len(), 12);
	assert_eq!(list[ 0], "January"  );
	assert_eq!(list[ 1], "February" );
	assert_eq!(list[ 2], "March"    );
	assert_eq!(list[ 3], "April"    );
	assert_eq!(list[ 4], "May"      );
	assert_eq!(list[ 5], "June"     );
	assert_eq!(list[ 6], "July"     );
	assert_eq!(list[ 7], "August"   );
	assert_eq!(list[ 8], "September");
	assert_eq!(list[ 9], "October"  );
	assert_eq!(list[10], "November" );
	assert_eq!(list[11], "December" );
}


fn test_set() {
	let mut list = AvlTreeList::<&'static str>::new();
	for _ in 0 .. 10 {
		list.push("");
	}
	list[0] = "zero";
	list[1] = "ten";
	list[2] = "twenty";
	list[3] = "thirty";
	list[4] = "forty";
	list[5] = "fifty";
	list[6] = "sixty";
	list[7] = "seventy";
	list[8] = "eighty";
	list[9] = "ninety";
	assert_eq!(list.len(), 10);
	assert_eq!(list[0], "zero"   );
	assert_eq!(list[1], "ten"    );
	assert_eq!(list[2], "twenty" );
	assert_eq!(list[3], "thirty" );
	assert_eq!(list[4], "forty"  );
	assert_eq!(list[5], "fifty"  );
	assert_eq!(list[6], "sixty"  );
	assert_eq!(list[7], "seventy");
	assert_eq!(list[8], "eighty" );
	assert_eq!(list[9], "ninety" );
}


fn test_insert_at_beginning() {
	let mut list = AvlTreeList::<&'static str>::new();
	list.insert(0, "Sunday");
	list.insert(0, "Monday");
	list.insert(0, "Tuesday");
	assert_eq!(list.len(), 3);
	assert_eq!(list[0], "Tuesday");
	assert_eq!(list[1], "Monday" );
	assert_eq!(list[2], "Sunday" );
}


fn test_insert_at_end() {
	let mut list = AvlTreeList::<&'static str>::new();
	list.insert(0, "Saturday");
	list.insert(1, "Friday");
	list.insert(2, "Thursday");
	list.insert(3, "Wednesday");
	assert_eq!(list.len(), 4);
	assert_eq!(list[0], "Saturday" );
	assert_eq!(list[1], "Friday"   );
	assert_eq!(list[2], "Thursday" );
	assert_eq!(list[3], "Wednesday");
}


fn test_insert_at_middle() {
	let mut list = AvlTreeList::<&'static str>::new();
	list.insert(0, "Up");
	list.insert(1, "Down");
	list.insert(1, "Left");
	list.insert(2, "Right");
	list.insert(1, "Front");
	list.insert(2, "Back");
	assert_eq!(list.len(), 6);
	assert_eq!(list[0], "Up"   );
	assert_eq!(list[1], "Front");
	assert_eq!(list[2], "Back" );
	assert_eq!(list[3], "Left" );
	assert_eq!(list[4], "Right");
	assert_eq!(list[5], "Down" );
}


fn test_insert_list() {
	let mut list = AvlTreeList::<&'static str>::new();
	list.append_at(0, &mut vec!["1", "2", "3", "5"]);
	list.append_at(4, &mut vec!["377", "610", "987"]);
	list.append_at(4, &mut vec!["8", "13", "21", "144", "233"]);
	list.append_at(7, &mut vec!["34", "55", "89"]);
	assert_eq!(list.len(), 15);
	assert_eq!(list[ 0],  "1");
	assert_eq!(list[ 1],  "2");
	assert_eq!(list[ 2],  "3");
	assert_eq!(list[ 3],  "5");
	assert_eq!(list[ 4],  "8");
	assert_eq!(list[ 5], "13");
	assert_eq!(list[ 6], "21");
	assert_eq!(list[ 7], "34");
	assert_eq!(list[ 8], "55");
	assert_eq!(list[ 9], "89");
	assert_eq!(list[10], "144");
	assert_eq!(list[11], "233");
	assert_eq!(list[12], "377");
	assert_eq!(list[13], "610");
	assert_eq!(list[14], "987");
}


// Stresses the self-balancing mechanism
fn test_insert_many_beginning() {
	let n: i32 = 300000;
	let mut list = AvlTreeList::<i32>::new();
	for i in 0 .. n {
		list.push(i);
	}
	
	for (i, x) in (0i32 .. ).zip(list.into_iter()) {
		assert_eq!(*x, i);
	}
}


// Stresses the self-balancing mechanism
fn test_insert_many_end() {
	let n: i32 = 300000;
	let mut list = AvlTreeList::<i32>::new();
	for i in (0 .. n).rev() {
		list.insert(0, i);
	}
	
	for (i, x) in (0i32 .. ).zip(list.into_iter()) {
		assert_eq!(*x, i);
	}
}


// Adds in a weird binary pattern to stress arrays and linked lists
fn test_insert_many_everywhere() {
	let n: i32 = 18;
	let mut list = AvlTreeList::<i32>::new();
	list.push(0);
	for i in (0 .. n).rev() {
		let mut j: i32 = 1 << i;
		let mut k: usize = 1;
		while j < (1 << n) {
			list.insert(k, j);
			j += 2 << i;
			k += 2;
		}
	}
	
	for (i, x) in (0i32 .. ).zip(list.into_iter()) {
		assert_eq!(*x, i);
	}
}


fn test_remove() {
	let mut list = AvlTreeList::<char>::new();
	let s = "the quick brown fox jumped over the lazy dog";
	for c in s.chars() {
		list.push(c);
	}
	assert_eq!(list.len(), s.len());
	
	assert_eq!(list.remove( 2), 'e');
	assert_eq!(list.remove( 4), 'u');
	assert_eq!(list.remove( 3), 'q');
	assert_eq!(list.remove( 2), ' ');
	assert_eq!(list.remove(12), 'f');
	assert_eq!(list.remove(11), ' ');
	assert_eq!(list.remove(10), 'n');
	assert_eq!(list.remove( 9), 'w');
	assert_eq!(list.remove(11), ' ');
	assert_eq!(list.remove(11), 'j');
	assert_eq!(list.remove(11), 'u');
	assert_eq!(list.remove(10), 'x');
	assert_eq!(list.remove(11), 'p');
	assert_eq!(list.remove(12), 'd');
	assert_eq!(list.remove(11), 'e');
	assert_eq!(list.remove(13), 'v');
	assert_eq!(list.remove(13), 'e');
	assert_eq!(list.remove(19), 'l');
	assert_eq!(list.remove(20), 'z');
	assert_eq!(list.remove(19), 'a');
	assert_eq!(list.remove(18), ' ');
	assert_eq!(list.remove(22), 'g');
	
	let s = "thick broom or they do";
	assert_eq!(list.len(), s.len());
	for (i, c) in (0usize .. ).zip(s.chars()) {
		assert_eq!(list[i], c);
	}
	
	assert_eq!(list.remove(0), 't');
	assert_eq!(list.remove(2), 'c');
	assert_eq!(list.remove(2), 'k');
	assert_eq!(list.remove(2), ' ');
	assert_eq!(list.remove(2), 'b');
	assert_eq!(list.remove(2), 'r');
	assert_eq!(list.remove(2), 'o');
	assert_eq!(list.remove(2), 'o');
	assert_eq!(list.remove(4), 'o');
	assert_eq!(list.remove(7), 'h');
	assert_eq!(list.remove(5), ' ');
	assert_eq!(list.remove(5), 't');
	assert_eq!(list.remove(9), 'o');
	assert_eq!(list.remove(7), ' ');
	assert_eq!(list.remove(6), 'y');
	
	let s = "him red";
	for (i, c) in (0usize .. ).zip(s.chars()) {
		assert_eq!(list[i], c);
	}
}


fn test_clear() {
	let mut list = AvlTreeList::<i32>::new();
	for i in 0i32 .. 20 {
		list.push(i * i);
	}
	
	list.clear();
	assert_eq!(list.len(), 0);
	
	list.push(- 1);
	list.push(- 8);
	list.push(-27);
	assert_eq!(list.len(), 3);
	assert_eq!(list[0], - 1);
	assert_eq!(list[1], - 8);
	assert_eq!(list[2], -27);
}


fn test_iterator() {
	let mut list = AvlTreeList::<i32>::new();
	for i in 0 .. 50 {
		list.push(i * i);
	}
	
	let mut iter = list.into_iter();
	for i in 0 .. 50 {
		assert_eq!(*iter.next().unwrap(), i * i);
	}
	assert_eq!(iter.next(), None);
}


// Comprehensively tests all the defined methods.
fn test_against_rust_vec_randomly() {
	let trials = 100_000;
	let mut rng = rand::thread_rng();
	let opcountdist = Range::new(1, 101);
	let valuedist = Range::new(0i32, 1000000i32);
	
	let mut list0 = Vec::<i32>::new();
	let mut list1 = AvlTreeList::<i32>::new();
	let mut size: usize = 0;
	for _ in 0 .. trials {
		let op = Range::new(0, 100).ind_sample(&mut rng);
		
		if op < 1 {  // Clear
			list1.check_structure();
			list0.clear();
			list1.clear();
			size = 0;
			
		} else if op < 2 {  // Set
			if size > 0 {
				let index = Range::new(0, size).ind_sample(&mut rng);
				let val = valuedist.ind_sample(&mut rng);
				list0[index] = val;
				list1[index] = val;
			}
			
		} else if op < 30 {  // Random insertion
			let n = opcountdist.ind_sample(&mut rng);
			for _ in 0 .. n {
				let index = Range::new(0, size + 1).ind_sample(&mut rng);
				let val = valuedist.ind_sample(&mut rng);
				list0.insert(index, val);
				list1.insert(index, val);
			}
			size += n;
			
		} else if op < 50 {  // Ascending insertion
			let n = opcountdist.ind_sample(&mut rng);
			let offset =  Range::new(0, size + 1).ind_sample(&mut rng);
			for i in 0 .. n {
				let val = valuedist.ind_sample(&mut rng);
				list0.insert(offset + i, val);
				list1.insert(offset + i, val);
			}
			size += n;
			
		} else if op < 70 {  // Descending insertion
			let n = opcountdist.ind_sample(&mut rng);
			let offset = Range::new(0, size + 1).ind_sample(&mut rng);
			for _ in 0 .. n {
				let val = valuedist.ind_sample(&mut rng);
				list0.insert(offset, val);
				list1.insert(offset, val);
			}
			size += n;
			
		} else if op < 80 {  // Random deletion
			let n = std::cmp::min(opcountdist.ind_sample(&mut rng), size);
			for _ in 0 .. n {
				let index = Range::new(0, size).ind_sample(&mut rng);
				assert_eq!(list0.remove(index), list1.remove(index));
				size -= 1;
			}
			
		} else if op < 90 {  // Ascending deletion
			if size > 0 {
				let offset = Range::new(0, size).ind_sample(&mut rng);
				let n = std::cmp::min(opcountdist.ind_sample(&mut rng), size - offset);
				for _ in 0 .. n {
					assert_eq!(list0.remove(offset), list1.remove(offset));
				}
				size -= n;
			}
			
		} else if op < 100 {  // Descending deletion
			if size > 0 {
				let offset = Range::new(0, size).ind_sample(&mut rng);
				let n = std::cmp::min(opcountdist.ind_sample(&mut rng), offset + 1);
				for i in 0 .. n {
					assert_eq!(list0.remove(offset - i), list1.remove(offset - i));
				}
				size -= n;
			}
		} else {
			unreachable!();
		}
		
		assert_eq!(list0.len(), size);
		assert_eq!(list1.len(), size);
		if size > 0 {
			let indexdist = Range::new(0, size);
			for _ in 0 .. 10 {
				let index = indexdist.ind_sample(&mut rng);
				assert_eq!(list0[index], list1[index]);
			}
		}
	}
}
