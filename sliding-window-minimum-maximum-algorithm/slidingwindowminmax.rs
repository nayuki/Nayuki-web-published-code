/* 
 * Sliding window min/max (Rust)
 * 
 * Copyright (c) 2024 Project Nayuki. (MIT License)
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

use std;
use std::cmp::Ordering;
use std::collections::VecDeque;


/*---- Function for one-shot computation ----*/

pub fn compute_sliding_window_min_or_max
		<E: Ord + Clone>
		(array: &[E], window: usize, maximize: bool) -> Vec<E> {
	
	assert!(window > 0, "Window size must be positive");
	let mut result = Vec::<E>::new();
	let mut deque = VecDeque::<E>::new();
	let mut countdown: usize = window - 1;
	let mut tail = array.iter();
	for val in array {
		while deque.back().map_or(false, |x| !maximize && *val < *x || maximize && *val > *x) {
			deque.pop_back();
		}
		deque.push_back(val.clone());
		
		if countdown > 0 {
			countdown -= 1;
		} else {
			let pop: bool = {
				let front: &E = deque.front().unwrap();
				result.push(front.clone());
				*tail.next().unwrap() == *front
			};
			if pop {
				deque.pop_front();
			}
		}
	}
	result
}



/*---- Stateful instance for incremental computation ----*/

#[derive(Default)]
pub struct SlidingWindowMinMax<E> {
	
	min_deque: VecDeque<E>,
	max_deque: VecDeque<E>,
	
}


impl<E: Ord + Clone> SlidingWindowMinMax<E> {
	
	pub fn new() -> Self {
		Self {
			min_deque: VecDeque::new(),
			max_deque: VecDeque::new(),
		}
	}
	
	
	pub fn get_minimum(&self) -> &E {
		self.min_deque.front().unwrap()
	}
	
	
	pub fn get_maximum(&self) -> &E {
		self.max_deque.front().unwrap()
	}
	
	
	pub fn add_tail(&mut self, val: &E) {
		while self.min_deque.back().map_or(false, |x| *val < *x) {
			self.min_deque.pop_back();
		}
		self.min_deque.push_back(val.clone());
		
		while self.max_deque.back().map_or(false, |x| *val > *x) {
			self.max_deque.pop_back();
		}
		self.max_deque.push_back(val.clone());
	}
	
	
	pub fn remove_head(&mut self, val: &E) {
		match val.cmp(self.min_deque.front().unwrap()) {
			Ordering::Less => panic!("Wrong value"),
			Ordering::Equal => {self.min_deque.pop_front();},
			Ordering::Greater => (),
		}
		match val.cmp(self.max_deque.front().unwrap()) {
			Ordering::Greater => panic!("Wrong value"),
			Ordering::Equal => {self.max_deque.pop_front();},
			Ordering::Less => (),
		}
	}
	
}
