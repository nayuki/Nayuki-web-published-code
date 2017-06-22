/* 
 * sRGB transform test (C)
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

#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <time.h>
#include "srgbtransform.h"


static const double DELTA = 1e-3;


static void test_forward_inverse(void) {
	int trials = 1000000;
	for (int i = 0; i < trials; i++) {
		double xd = (double)rand() / RAND_MAX;
		float xf = (float)xd;
		double yd = srgb_to_linear_double(xd);
		float yf = srgb_to_linear_float(xf);
		double zd = linear_to_srgb_double(xd);
		float zf = linear_to_srgb_float(xf);
		assert(fabs(xd - linear_to_srgb_double(yd)) < DELTA);
		assert(fabs(xf - linear_to_srgb_float(yf)) < DELTA);
		assert(fabs(xd - srgb_to_linear_double(zd)) < DELTA);
		assert(fabs(xf - srgb_to_linear_float(zf)) < DELTA);
	}
}


static void test_monotonicity(void) {
	int trials = 1000000;
	for (int i = 0; i < trials; i++) {
		double xd = (double)rand() / RAND_MAX * 2 - 0.5;
		double yd = (double)rand() / RAND_MAX * 2 - 0.5;
		if (yd < xd) {
			double temp = xd;
			xd = yd;
			yd = temp;
		}
		float xf = (float)xd;
		float yf = (float)yd;
		if (yd - xd > DELTA) {
			assert(srgb_to_linear_double(xd) <= srgb_to_linear_double(yd));
			assert(linear_to_srgb_double(xd) <= linear_to_srgb_double(yd));
			assert(linear_to_srgb_8bit(xd) <= linear_to_srgb_8bit(yd));
		}
		if (yf - xf > DELTA) {
			assert(srgb_to_linear_float(xf) <= srgb_to_linear_float(yf));
			assert(linear_to_srgb_float(xf) <= linear_to_srgb_float(yf));
		}
	}
}


static void test_8Bit(void) {
	for (int i = 0; i < (1 << 8); i++) {
		assert(linear_to_srgb_8bit(SRGB_8BIT_TO_LINEAR_DOUBLE[i]) == i);
		assert(linear_to_srgb_8bit(SRGB_8BIT_TO_LINEAR_FLOAT [i]) == i);
		assert(fabs(linear_to_srgb_double(SRGB_8BIT_TO_LINEAR_DOUBLE[i]) * 255.0 - i) < 1.0);
	}
}


int main(void) {
	srand(time(NULL));
	test_forward_inverse();
	test_monotonicity();
	test_8Bit();
	printf("Test passed\n");
	return EXIT_SUCCESS;
}
