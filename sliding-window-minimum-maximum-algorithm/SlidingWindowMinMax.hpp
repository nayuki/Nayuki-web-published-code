/* 
 * Sliding window min/max (C++)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
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
#include <vector>


/*---- Function for one-shot computation ----*/

template <typename E>
std::vector<E> computeSlidingWindowMinOrMax(const std::vector<E> &array, std::size_t window, bool maximize) {
	if (window == 0)
		throw "Window size must be positive";
	
	std::vector<E> result;
	std::deque<E> deque;
	typename std::vector<E>::const_iterator it(array.begin());
	typename std::vector<E>::const_iterator tail(array.begin());
	std::size_t countdown = window - 1;
	for (; it != array.end(); ++it) {
		
		const E &val = *it;
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
		minDeque.push_back(val);
		
		while (!maxDeque.empty() && val > maxDeque.back())
			maxDeque.pop_back();
		maxDeque.push_back(val);
	}
	
	
	public: void removeHead(const E &val) {
		if (val < minDeque.front())
			throw "Wrong value";
		else if (val == minDeque.front())
			minDeque.pop_front();
		
		if (val > maxDeque.front())
			throw "Wrong value";
		if (val == maxDeque.front())
			maxDeque.pop_front();
	}
	
};
