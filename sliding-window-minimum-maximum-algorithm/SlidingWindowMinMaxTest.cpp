/* 
 * Sliding window min/max test (C++)
 * 
 * Copyright (c) 2022 Project Nayuki. (MIT License)
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

#include <algorithm>
#include <cstddef>
#include <cstdlib>
#include <exception>
#include <iostream>
#include <random>
#include <vector>
#include "SlidingWindowMinMax.hpp"

using std::size_t;
using std::vector;


// Forward declarations
static void testRandomly();
static void testIncremental();


// Random number generation global variables
std::default_random_engine randGen((std::random_device())());
std::uniform_int_distribution<int> valueDist(0, 99);
std::bernoulli_distribution boolDist;


int main() {
	try {
		testRandomly();
		testIncremental();
		
		std::cerr << "Test passed" << std::endl;
		return EXIT_SUCCESS;
	} catch (std::exception &e) {
		std::cerr << e.what() << std::endl;
		return EXIT_FAILURE;
	}
}


template <typename E>
vector<E> computeSlidingWindowMinOrMaxNaive(const vector<E> &array, size_t window, bool maximize) {
	if (window == 0)
		throw std::domain_error("Window size must be positive");
	vector<E> result;
	if (array.size() < window)
		return result;
	
	for (typename vector<E>::const_iterator start = array.cbegin(), end = array.cbegin() + window; ; ++start, ++end) {
		if (!maximize)
			result.push_back(*std::min_element(start, end));
		else
			result.push_back(*std::max_element(start, end));
		if (end == array.cend())
			break;
	}
	return result;
}


static void testRandomly() {
	const long TRIALS = 100000;
	std::uniform_int_distribution<size_t> arrayLenDist(0, 999);
	std::uniform_int_distribution<size_t> windowDist(1, 30);
	for (long i = 0; i < TRIALS; i++) {
		
		vector<int> array;
		size_t arrayLen = arrayLenDist(randGen);
		for (size_t j = 0; j < arrayLen; j++)
			array.push_back(valueDist(randGen));
		size_t window = windowDist(randGen);
		bool maximize = boolDist(randGen);
		
		vector<int> expect = computeSlidingWindowMinOrMaxNaive(array, window, maximize);
		vector<int> actual = computeSlidingWindowMinOrMax     (array, window, maximize);
		if (expect.size() != actual.size())
			throw std::runtime_error("Size mismatch");
		for (size_t j = 0; j < expect.size(); j++) {
			if (expect.at(j) != actual.at(j))
				throw std::runtime_error("Value mismatch");
		}
	}
}


static void testIncremental() {
	const long TRIALS = 10000;
	for (long i = 0; i < TRIALS; i++) {
		
		vector<int> array;
		size_t arrayLen = 1000;
		for (size_t j = 0; j < arrayLen; j++)
			array.push_back(valueDist(randGen));
		
		SlidingWindowMinMax<int> swm;
		vector<int>::const_iterator start = array.cbegin();
		vector<int>::const_iterator end = array.cbegin();
		while (start < array.end()) {
			if (start == end || (end < array.end() && boolDist(randGen))) {
				swm.addTail(*end);
				++end;
			} else {
				swm.removeHead(*start);
				++start;
			}
			if (start > end)
				throw std::logic_error("Assertion error");
			if (start < end) {
				int min = *std::min_element(start, end);
				int max = *std::max_element(start, end);
				if (swm.getMinimum() != min || swm.getMaximum() != max)
					throw std::runtime_error("Value mismatch");
			}
		}
	}
}
