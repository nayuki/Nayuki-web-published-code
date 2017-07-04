/* 
 * Fast discrete cosine transform algorithms (C++)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-discrete-cosine-transform-algorithms
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

#include <cmath>
#include <cstddef>
#include <iostream>
#include <random>
#include <vector>
#include "FastDct8.hpp"
#include "FastDctFft.hpp"
#include "FastDctLee.hpp"
#include "NaiveDct.hpp"

using std::size_t;
using std::vector;


static const double EPSILON = 1e-9;
static std::default_random_engine randGen((std::random_device())());


// Forward declarations
static void testFastDctLeeVsNaive();
static void testFastDctLeeInvertibility();
static void testFastDct8VsNaive();
static void testFastDctFftVsNaive();
static void testFastDctFftInvertibility();
static void assertArrayEquals(const vector<double> &expect, const vector<double> &actual, double epsilon);
static vector<double> randomVector(size_t len);


int main() {
	try {
		testFastDctLeeVsNaive();
		testFastDctLeeInvertibility();
		testFastDct8VsNaive();
		testFastDctFftVsNaive();
		testFastDctFftInvertibility();
		
		return EXIT_SUCCESS;
	} catch (const char *msg) {
		std::cerr << msg << std::endl;
		return EXIT_FAILURE;
	}
}


static void testFastDctLeeVsNaive() {
	for (size_t len = 1; len <= (1UL << 13) && len != 0; len *= 2) {
		vector<double> vec(randomVector(len));
		{
			vector<double> expect(NaiveDct::transform(vec));
			vector<double> actual(vec);
			FastDctLee::transform(actual);
			assertArrayEquals(expect, actual, EPSILON);
		} {
			vector<double> expect(NaiveDct::inverseTransform(vec));
			vector<double> actual(vec);
			FastDctLee::inverseTransform(actual);
			assertArrayEquals(expect, actual, EPSILON);
		}
	}
}


static void testFastDctLeeInvertibility() {
	for (size_t len = 1; len <= (1UL << 22) && len != 0; len *= 2) {
		vector<double> vec(randomVector(len));
		vector<double> temp(vec);
		FastDctLee::transform(temp);
		FastDctLee::inverseTransform(temp);
		for (size_t i = 0; i < len; i++)
			temp.at(i) /= len / 2.0;
		assertArrayEquals(vec, temp, EPSILON);
	}
}


static void testFastDct8VsNaive() {
	size_t len = 8;
	vector<double> vec(randomVector(len));
	{
		vector<double> expect(NaiveDct::transform(vec));
		for (size_t i = 0; i < len; i++)
			expect.at(i) /= std::sqrt(4 * (i == 0 ? 2 : 1));
		vector<double> actual(vec);
		FastDct8::transform(actual.data());
		assertArrayEquals(expect, actual, EPSILON);
	} {
		vector<double> temp(vec);
		for (size_t i = 0; i < len; i++)
			temp.at(i) /= std::sqrt(4 / (i == 0 ? 2 : 1));
		vector<double> expect(NaiveDct::inverseTransform(temp));
		vector<double> actual(vec);
		FastDct8::inverseTransform(actual.data());
		assertArrayEquals(expect, actual, EPSILON);
	}
}


static void testFastDctFftVsNaive() {
	size_t prev = 0;
	for (int i = 0; i <= 100; i++) {
		size_t len = static_cast<size_t>(std::round(std::pow(3000.0, i / 100.0)));
		if (len <= prev)
			continue;
		prev = len;
		vector<double> vec(randomVector(len));
		{
			vector<double> expect(NaiveDct::transform(vec));
			vector<double> actual(vec);
			FastDctFft::transform(actual);
			assertArrayEquals(expect, actual, EPSILON);
		} {
			vector<double> expect(NaiveDct::inverseTransform(vec));
			vector<double> actual(vec);
			FastDctFft::inverseTransform(actual);
			assertArrayEquals(expect, actual, EPSILON);
		}
	}
}


static void testFastDctFftInvertibility() {
	size_t prev = 0;
	for (int i = 0; i <= 30; i++) {
		size_t len = static_cast<size_t>(std::round(std::pow(1000000.0, i / 30.0)));
		if (len <= prev)
			continue;
		prev = len;
		vector<double> vec(randomVector(len));
		vector<double> temp(vec);
		FastDctFft::transform(temp);
		FastDctFft::inverseTransform(temp);
		for (size_t i = 0; i < len; i++)
			temp.at(i) /= len / 2.0;
		assertArrayEquals(vec, temp, EPSILON);
	}
}


static void assertArrayEquals(const vector<double> &expect, const vector<double> &actual, double epsilon) {
	if (expect.size() != actual.size())
		throw "Length mismatch";
	for (size_t i = 0; i < expect.size(); i++) {
		if (fabs(expect.at(i) - actual.at(i)) > epsilon)
			throw "Value mismatch";
	}
}


static vector<double> randomVector(size_t len) {
	vector<double> result;
	std::uniform_real_distribution<double> dist(-1, 1);
	for (size_t i = 0; i < len; i++)
		result.push_back(dist(randGen));
	return result;
}
