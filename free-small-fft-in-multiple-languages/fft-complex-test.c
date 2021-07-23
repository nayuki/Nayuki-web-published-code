/* 
 * FFT and convolution test (C)
 * 
 * Copyright (c) 2021 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/free-small-fft-in-multiple-languages
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

#include <complex.h>
#include <math.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "fft-complex.h"


// Private function prototypes
static void test_fft(int n);
static void test_convolution(int n);
static void naive_dft(const double complex *restrict invec, double complex *restrict outvec, int n, bool inverse);
static void naive_convolve(const double complex *restrict xvec, const double complex *restrict yvec, double complex *restrict outvec, int n);
static double log10_rms_err(const double complex *xvec, const double complex *yvec, int n);
static double complex *random_complexes(int n);
static void *memdup(const void *src, size_t n);

static double max_log_error = -INFINITY;


/*---- Main and test functions ----*/

int main(void) {
	srand(time(NULL));
	
	// Test power-of-2 size FFTs
	for (int i = 0; i <= 12; i++)
		test_fft(1 << i);
	
	// Test small size FFTs
	for (int i = 0; i < 30; i++)
		test_fft(i);
	
	// Test diverse size FFTs
	for (int i = 0, prev = 0; i <= 100; i++) {
		int n = (int)lround(pow(1500, i / 100.0));
		if (n > prev) {
			test_fft(n);
			prev = n;
		}
	}
	
	// Test power-of-2 size convolutions
	for (int i = 0; i <= 12; i++)
		test_convolution(1 << i);
	
	// Test diverse size convolutions
	for (int i = 0, prev = 0; i <= 100; i++) {
		int n = (int)lround(pow(1500, i / 100.0));
		if (n > prev) {
			test_convolution(n);
			prev = n;
		}
	}
	
	printf("\n");
	printf("Max log err = %.1f\n", max_log_error);
	printf("Test %s\n", max_log_error < -10 ? "passed" : "failed");
	return EXIT_SUCCESS;
}


static void test_fft(int n) {
	double complex *input = random_complexes(n);
	double complex *expect = malloc(n * sizeof(double complex));
	naive_dft(input, expect, n, false);
	double complex *actual = memdup(input, n * sizeof(double complex));
	Fft_transform(actual, n, false);
	double err0 = log10_rms_err(expect, actual, n);
	
	for (int i = 0; i < n; i++)
		actual[i] /= n;
	Fft_transform(actual, n, true);
	double err1 = log10_rms_err(input, actual, n);
	printf("fftsize=%4d  logerr=%5.1f\n", n, (err0 > err1 ? err0 : err1));
	free(input);
	free(expect);
	free(actual);
}


static void test_convolution(int n) {
	double complex *input0 = random_complexes(n);
	double complex *input1 = random_complexes(n);
	double complex *expect = malloc(n * sizeof(double complex));
	naive_convolve(input0, input1, expect, n);
	double complex *actual = malloc(n * sizeof(double complex));
	Fft_convolve(input0, input1, actual, n);
	printf("convsize=%4d  logerr=%5.1f\n", n, log10_rms_err(expect, actual, n));
	free(input0);
	free(input1);
	free(expect);
	free(actual);
}


/*---- Naive reference computation functions ----*/

static void naive_dft(const double complex *restrict invec, double complex *restrict outvec, int n, bool inverse) {
	double coef = (inverse ? 2 : -2) * M_PI;
	for (int k = 0; k < n; k++) {  // For each output element
		double complex sum = 0.0;
		for (int t = 0; t < n; t++) {  // For each input element
			double angle = coef * ((uintmax_t)t * k % n) / n;
			sum += invec[t] * cexp(angle * I);
		}
		outvec[k] = sum;
	}
}


static void naive_convolve(const double complex *restrict xvec, const double complex *restrict yvec, double complex *restrict outvec, int n) {
	for (int i = 0; i < n; i++)
		outvec[i] = 0;
	for (int i = 0; i < n; i++) {
		for (int j = 0; j < n; j++)
			outvec[(i + j) % n] += xvec[i] * yvec[j];
	}
}


/*---- Utility functions ----*/

static double log10_rms_err(const double complex *xvec, const double complex *yvec, int n) {
	double err = pow(10, -99 * 2);
	for (int i = 0; i < n; i++) {
		double temp = cabs(xvec[i] - yvec[i]);
		err += temp * temp;
	}
	
	err /= n > 0 ? n : 1;
	err = sqrt(err);  // Now this is a root mean square (RMS) error
	err = log10(err);
	if (err > max_log_error)
		max_log_error = err;
	return err;
}


static double complex *random_complexes(int n) {
	double complex *result = malloc(n * sizeof(double complex));
	for (int i = 0; i < n; i++) {
		double re = (rand() / (RAND_MAX + 1.0)) * 2 - 1;
		double im = (rand() / (RAND_MAX + 1.0)) * 2 - 1;
		result[i] = re + im * I;
	}
	return result;
}


static void *memdup(const void *src, size_t n) {
	void *dest = malloc(n);
	if (n > 0 && dest != NULL)
		memcpy(dest, src, n);
	return dest;
}
