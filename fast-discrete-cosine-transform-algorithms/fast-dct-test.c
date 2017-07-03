/* 
 * Fast discrete cosine transform algorithms (C)
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

#include <assert.h>
#include <math.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "fast-dct-8.h"
#include "fast-dct-lee.h"
#include "naive-dct.h"


static const double EPSILON = 1e-9;


// Forward declarations
static void testFastDctLeeVsNaive(void);
static void testFastDctLeeInvertibility(void);
static void testFastDct8VsNaive(void);
static void assertArrayEquals(double expect[], double actual[], size_t len, double epsilon);
static double *randomVector(size_t len);


int main(void) {
	testFastDctLeeVsNaive();
	testFastDctLeeInvertibility();
	testFastDct8VsNaive();
	fprintf(stderr, "Test passed\n");
	return EXIT_SUCCESS;
}


static void testFastDctLeeVsNaive(void) {
	for (size_t len = 1; len <= (1UL << 13) && len != 0; len *= 2) {
		double *vector = randomVector(len);
		
		double *expect = NaiveDct_transform(vector, len);
		double *actual = calloc(len, sizeof(double));
		memcpy(actual, vector, len * sizeof(double));
		FastDctLee_transform(actual, len);
		assertArrayEquals(expect, actual, len, EPSILON);
		free(expect);
		free(actual);
		
		expect = NaiveDct_inverseTransform(vector, len);
		actual = calloc(len, sizeof(double));
		memcpy(actual, vector, len * sizeof(double));
		FastDctLee_inverseTransform(actual, len);
		assertArrayEquals(expect, actual, len, EPSILON);
		free(vector);
		free(expect);
		free(actual);
	}
}


static void testFastDctLeeInvertibility(void) {
	for (size_t len = 1; len <= (1UL << 22) && len != 0; len *= 2) {
		double *vector = randomVector(len);
		double *temp = calloc(len, sizeof(double));
		memcpy(temp, vector, len * sizeof(double));
		FastDctLee_transform(temp, len);
		FastDctLee_inverseTransform(temp, len);
		for (size_t i = 0; i < len; i++)
			temp[i] /= len / 2.0;
		assertArrayEquals(vector, temp, len, EPSILON);
		free(vector);
		free(temp);
	}
}


static void testFastDct8VsNaive(void) {
	size_t len = 8;
	double *vector = randomVector(len);
	
	double *expect = NaiveDct_transform(vector, len);
	for (size_t i = 0; i < len; i++)
		expect[i] /= sqrt(4 * (i == 0 ? 2 : 1));
	double *actual = calloc(len, sizeof(double));
	memcpy(actual, vector, len * sizeof(double));
	FastDct8_transform(actual);
	assertArrayEquals(expect, actual, len, EPSILON);
	free(expect);
	free(actual);
	
	double *temp = calloc(len, sizeof(double));
	for (size_t i = 0; i < len; i++)
		temp[i] = vector[i] / sqrt(4 / (i == 0 ? 2 : 1));
	expect = NaiveDct_inverseTransform(temp, len);
	free(temp);
	actual = calloc(len, sizeof(double));
	memcpy(actual, vector, len * sizeof(double));
	FastDct8_inverseTransform(actual);
	assertArrayEquals(expect, actual, len, EPSILON);
	free(vector);
	free(expect);
	free(actual);
}


static void assertArrayEquals(double expect[], double actual[], size_t len, double epsilon) {
	for (size_t i = 0; i < len; i++)
		assert(fabs(expect[i] - actual[i]) < epsilon);
}


static double *randomVector(size_t len) {
	double *result = calloc(len, sizeof(double));
	for (size_t i = 0; i < len; i++)
		result[i] = (double)rand() / RAND_MAX * 2 - 1;
	return result;
}
