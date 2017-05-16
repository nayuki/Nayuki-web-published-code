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

#include <cstddef>
#include <deque>
#include <vector>


template <typename E>
std::vector<E> calcWindowMinOrMaxDeque(const std::vector<E> &array, std::size_t window, bool maximize) {
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


template <typename E>
std::vector<E> calcWindowMinOrMaxNaive(const std::vector<E> &array, std::size_t window, bool maximize) {
	if (window == 0)
		throw "Window size must be positive";
	std::vector<E> result;
	if (array.size() < window)
		return result;
	
	for (std::size_t i = 0; i < array.size() - window + 1; i++) {
		const E *temp = &array.at(i);
		for (std::size_t j = 1; j < window; j++) {
			const E &val = array.at(i + j);
			if ((!maximize && val < *temp) || (maximize && val > *temp))
				temp = &val;
		}
		result.push_back(*temp);
	}
	return result;
}
