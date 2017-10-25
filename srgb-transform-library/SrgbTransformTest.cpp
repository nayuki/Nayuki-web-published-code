/* 
 * sRGB transform test (C++)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/srgb-transform-library
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

#include <cassert>
#include <cmath>
#include <cstdlib>
#include <iostream>
#include <random>
#include "SrgbTransform.hpp"


static const double DELTA = 3e-7;

std::default_random_engine randGen((std::random_device())());


static void testForwardInverse() {
	const long TRIALS = 1000000;
	std::uniform_real_distribution<double> dist(0.0, 1.0);
	for (long i = 0; i < TRIALS; i++) {
		double xd = dist(randGen);
		float xf = static_cast<float>(xd);
		double yd = SrgbTransform::srgbToLinear(xd);
		float yf = SrgbTransform::srgbToLinear(xf);
		double zd = SrgbTransform::linearToSrgb(xd);
		float zf = SrgbTransform::linearToSrgb(xf);
		assert(std::fabs(xd - SrgbTransform::linearToSrgb(yd)) < DELTA);
		assert(std::fabs(xf - SrgbTransform::linearToSrgb(yf)) < DELTA);
		assert(std::fabs(xd - SrgbTransform::srgbToLinear(zd)) < DELTA);
		assert(std::fabs(xf - SrgbTransform::srgbToLinear(zf)) < DELTA);
	}
}


static void testMonotonicity() {
	const long TRIALS = 1000000;
	std::uniform_real_distribution<double> dist(-0.5, 1.5);
	for (long i = 0; i < TRIALS; i++) {
		double xd = dist(randGen);
		double yd = dist(randGen);
		if (yd < xd) {
			double temp = xd;
			xd = yd;
			yd = temp;
		}
		float xf = static_cast<float>(xd);
		float yf = static_cast<float>(yd);
		if (yd - xd > DELTA) {
			assert(SrgbTransform::srgbToLinear(xd) <= SrgbTransform::srgbToLinear(yd));
			assert(SrgbTransform::linearToSrgb(xd) <= SrgbTransform::linearToSrgb(yd));
			assert(SrgbTransform::linearToSrgb8bit(xd) <= SrgbTransform::linearToSrgb8bit(yd));
		}
		if (yf - xf > DELTA) {
			assert(SrgbTransform::srgbToLinear(xf) <= SrgbTransform::srgbToLinear(yf));
			assert(SrgbTransform::linearToSrgb(xf) <= SrgbTransform::linearToSrgb(yf));
		}
	}
}


static void test8Bit() {
	for (int i = 0; i < (1 << 8); i++) {
		assert(SrgbTransform::linearToSrgb8bit(SrgbTransform::SRGB_8BIT_TO_LINEAR_DOUBLE[i]) == i);
		assert(SrgbTransform::linearToSrgb8bit(SrgbTransform::SRGB_8BIT_TO_LINEAR_FLOAT [i]) == i);
		assert(std::fabs(SrgbTransform::linearToSrgb(SrgbTransform::SRGB_8BIT_TO_LINEAR_DOUBLE[i]) * 255.0 - i) < 1.0);
	}
}


int main() {
	testForwardInverse();
	testMonotonicity();
	test8Bit();
	std::cout << "Test passed" << std::endl;
	return EXIT_SUCCESS;
}
