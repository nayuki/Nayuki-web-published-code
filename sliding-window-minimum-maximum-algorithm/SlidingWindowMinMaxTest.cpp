/* 
 * Sliding window min/max test (C++)
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
#include <cstdlib>
#include <iostream>
#include <random>
#include <vector>
#include "SlidingWindowMinMax.hpp"

using std::size_t;


// Forward declarations
static void testRandomly();


// Random number generation global variables
std::default_random_engine randGen((std::random_device())());


int main() {
	try {
		testRandomly();
		std::cerr << "Test passed" << std::endl;
		return EXIT_SUCCESS;
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return EXIT_FAILURE;
	}
}


static void testRandomly() {
	const long trials = 100000;
	std::uniform_int_distribution<size_t> arrayLenDist(0, 999);
	std::uniform_int_distribution<int> valueDist(0, 99);
	std::uniform_int_distribution<size_t> windowDist(1, 30);
	std::bernoulli_distribution boolDist;
	for (long i = 0; i < trials; i++) {
		
		std::vector<int> array;
		size_t arrayLen = arrayLenDist(randGen);
		for (size_t i = 0; i < arrayLen; i++)
			array.push_back(valueDist(randGen));
		size_t window = windowDist(randGen);
		bool maximize = boolDist(randGen);
		
		std::vector<int> expect(calcWindowMinOrMaxNaive(array, window, maximize));
		std::vector<int> actual(calcWindowMinOrMaxDeque(array, window, maximize));
		if (expect.size() != actual.size())
			throw "Size mismatch";
		for (size_t i = 0; i < expect.size(); i++) {
			if (expect.at(i) != actual.at(i))
				throw "Value mismatch";
		}
	}
}
