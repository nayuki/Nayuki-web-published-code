/* 
 * Binary indexed tree test (C++)
 * 
 * Copyright (c) 2022 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/binary-indexed-tree
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
#include <cstdint>
#include <cstdlib>
#include <exception>
#include <iostream>
#include <limits>
#include <random>
#include <vector>
#include "BinaryIndexedTree.hpp"

using std::size_t;
using std::vector;
using std::uniform_int_distribution;


// Forward declarations
static void testSizeConstructor();
static void testAllOnes();
static void testArrayConstructorRandomly();
static void testAddAndSetRandomly();


// Random number generation global variables
std::default_random_engine randGen((std::random_device())());


int main() {
	try {
		testSizeConstructor();
		testAllOnes();
		testArrayConstructorRandomly();
		testAddAndSetRandomly();
		
		std::cerr << "Test passed" << std::endl;
		return EXIT_SUCCESS;
	} catch (std::exception &e) {
		std::cerr << e.what() << std::endl;
		return EXIT_FAILURE;
	}
}


template <typename T>
static void assertEquals(T x, T y) {
	if (x != y)
		throw std::runtime_error("Value mismatch");
}


static void testSizeConstructor() {
	const size_t SIZELIMIT = 10000;
	const long CHECKS = 10;
	using T = std::int8_t;
	for (size_t len = 0; len < SIZELIMIT; len++) {
		
		const BinaryIndexedTree<T> bt(len);
		assertEquals(len, bt.size());
		assertEquals(static_cast<T>(0), bt.getTotal());
		
		uniform_int_distribution<size_t> indexDist(0, len > 0 ? len - 1 : 0);
		uniform_int_distribution<size_t> indexOneDist(0, len);
		for (long i = 0; i < CHECKS; i++) {
			if (len > 0)
				assertEquals(static_cast<T>(0), bt[indexDist(randGen)]);
			assertEquals(static_cast<T>(0), bt.getPrefixSum(indexOneDist(randGen)));
			
			size_t start = indexOneDist(randGen);
			size_t end   = indexOneDist(randGen);
			if (start > end)
				std::swap(start, end);
			assertEquals(static_cast<T>(0), bt.getRangeSum(start, end));
		}
	}
}


static void testAllOnes() {
	const size_t SIZELIMIT = 10000;
	const long CHECKS = 10;
	using T = std::uint16_t;
	uniform_int_distribution<int> modeDist(0, 3);
	std::uniform_real_distribution<double> realDist;
	for (size_t len = 1; len < SIZELIMIT; len++) {
		
		BinaryIndexedTree<T> bt(0);
		int mode = modeDist(randGen);
		if (mode == 0) {
			vector<T> vals(len, 1);
			bt = BinaryIndexedTree<T>(vals);
		} else {
			bt = BinaryIndexedTree<T>(len);
			double p;
			if      (mode == 1) p = 0;
			else if (mode == 2) p = 1;
			else if (mode == 3) p = realDist(randGen);
			else throw std::domain_error("Assertion error");
			for (size_t i = 0; i < len; i++) {
				if (realDist(randGen) < p)
					bt.add(i, 1);
				else
					bt.set(i, 1);
			}
		}
		
		assertEquals(len, bt.size());
		assertEquals(static_cast<T>(len), bt.getTotal());
		uniform_int_distribution<size_t> indexDist(0, len - 1);
		uniform_int_distribution<size_t> indexOneDist(0, len);
		for (long i = 0; i < CHECKS; i++) {
			assertEquals(static_cast<T>(1), bt[indexDist(randGen)]);
			size_t k = indexOneDist(randGen);
			assertEquals(static_cast<T>(k), bt.getPrefixSum(k));
			
			size_t start = indexOneDist(randGen);
			size_t end   = indexOneDist(randGen);
			if (start > end)
				std::swap(start, end);
			assertEquals(static_cast<T>(end - start), bt.getRangeSum(start, end));
		}
	}
}


static void testArrayConstructorRandomly() {
	const long TRIALS = 10000;
	const size_t SIZELIMIT = 10000;
	const long CHECKS = 100;
	using T = std::int64_t;
	uniform_int_distribution<size_t> lenDist(0, SIZELIMIT);
	uniform_int_distribution<T> valDist(INT64_C(-1000000), INT64_C(1000000));
	for (long i = 0; i < TRIALS; i++) {
		
		size_t len = lenDist(randGen);
		vector<T> vals;
		vector<T> cums{0};
		for (size_t j = 0; j < len; j++) {
			vals.push_back(valDist(randGen));
			cums.push_back(cums.back() + vals.back());
		}
		
		BinaryIndexedTree<T> bt(vals);
		assertEquals(len, bt.size());
		assertEquals(cums.at(len), bt.getTotal());
		
		uniform_int_distribution<size_t> indexDist(0, len > 0 ? len - 1 : 0);
		uniform_int_distribution<size_t> indexOneDist(0, len);
		for (long j = 0; j < CHECKS; j++) {
			if (len > 0) {
				size_t k = indexDist(randGen);
				assertEquals(vals.at(k), bt[k]);
			}
			size_t k = indexOneDist(randGen);
			assertEquals(cums.at(k), bt.getPrefixSum(k));
			
			size_t start = indexOneDist(randGen);
			size_t end   = indexOneDist(randGen);
			if (start > end)
				std::swap(start, end);
			assertEquals(cums.at(end) - cums.at(start), bt.getRangeSum(start, end));
		}
	}
}


static void testAddAndSetRandomly() {
	const long TRIALS = 10000;
	const long SIZELIMIT = 10000;
	const long OPERATIONS = 10000;
	const long CHECKS = 100;
	uniform_int_distribution<size_t> lenDist(1, SIZELIMIT);
	std::bernoulli_distribution modeDist;
	using T = std::uint64_t;
	uniform_int_distribution<T> valDist(0, std::numeric_limits<T>::max());
	for (long i = 0; i < TRIALS; i++) {
		
		size_t len = lenDist(randGen);
		vector<T> vals;
		BinaryIndexedTree<T> bt(0);
		if (modeDist(randGen)) {
			vals = vector<T>(len, 0);
			bt = BinaryIndexedTree<T>(len);
		} else {
			for (size_t j = 0; j < len; j++)
				vals.push_back(valDist(randGen));
			bt = BinaryIndexedTree<T>(vals);
		}
		
		uniform_int_distribution<size_t> indexDist(0, len > 0 ? len - 1 : 0);
		for (long j = 0; j < OPERATIONS; j++) {
			size_t k = indexDist(randGen);
			T x = valDist(randGen);
			if (modeDist(randGen)) {
				vals.at(k) += x;
				bt.add(k, x);
			} else {
				vals.at(k) = x;
				bt.set(k, x);
			}
		}
		
		vector<T> cums{0};
		for (T x : vals)
			cums.push_back(cums.back() + x);
		
		uniform_int_distribution<size_t> indexOneDist(0, len);
		for (long j = 0; j < CHECKS; j++) {
			size_t k = indexDist(randGen);
			assertEquals(vals.at(k), bt[k]);
			k = indexOneDist(randGen);
			assertEquals(cums.at(k), bt.getPrefixSum(k));
			
			size_t start = indexOneDist(randGen);
			size_t end   = indexOneDist(randGen);
			if (start > end)
				std::swap(start, end);
			assertEquals(cums.at(end) - cums.at(start), bt.getRangeSum(start, end));
		}
	}
}
