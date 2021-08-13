/* 
 * Sliding window min/max (C++)
 * 
 * Copyright (c) 2021 Project Nayuki. (MIT License)
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

#pragma once

#include <cstddef>
#include <deque>
#include <stdexcept>
#include <vector>


/*---- Function for one-shot computation ----*/

template <typename E>
std::vector<E> computeSlidingWindowMinOrMax(const std::vector<E> &array, std::size_t window, bool maximize) {
	if (window == 0)
		throw std::domain_error("Window size must be positive");
	
	std::vector<E> result;
	std::deque<E> deque;
	std::size_t countdown = window - 1;
	typename std::vector<E>::const_iterator tail = array.cbegin();
	for (const E &val : array) {
		while (!deque.empty() && ((!maximize && val < deque.back()) || (maximize && val > deque.back())))
			deque.pop_back();
		deque.push_back(val);
		
		if (countdown > 0)
			countdown--;
		else {
			result.push_back(deque.front());
			if (*tail == deque.front())
				deque.pop_front();
			++tail;
		}
	}
	return result;
}



/*---- Stateful instance for incremental computation ----*/

template <typename E>
class SlidingWindowMinMax final {
	
	/*-- Fields --*/
	
	private: std::deque<E> minDeque;
	private: std::deque<E> maxDeque;
	
	
	/*-- Methods --*/
	
	public: E getMinimum() {
		return minDeque.front();
	}
	
	
	public: E getMaximum() {
		return maxDeque.front();
	}
	
	
	public: void addTail(const E &val) {
		while (!minDeque.empty() && val < minDeque.back())
			minDeque.pop_back();
		minDeque.push_back(E(val));
		
		while (!maxDeque.empty() && val > maxDeque.back())
			maxDeque.pop_back();
		maxDeque.push_back(E(val));
	}
	
	
	public: void removeHead(const E &val) {
		if (val < minDeque.front())
			throw std::invalid_argument("Wrong value");
		else if (val == minDeque.front())
			minDeque.pop_front();
		
		if (val > maxDeque.front())
			throw std::invalid_argument("Wrong value");
		else if (val == maxDeque.front())
			maxDeque.pop_front();
	}
	
};
