/* 
 * Free FFT and convolution (C)
 * 
 * Copyright (c) 2014 Nayuki Minase
 * http://nayuki.eigenstate.org/page/free-small-fft-in-multiple-languages
 * 
 * (MIT License)
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

#include <math.h>
#include <stdlib.h>
#include <string.h>
#include "fft.h"


// Private function prototypes
static size_t reverse_bits(size_t x, unsigned int n);
static void *memdup(void *src, size_t n);

#define SIZE_MAX ((size_t)-1)


int transform(double real[], double imag[], size_t n) {
	if (n == 0)
		return 1;
	else if ((n & (n - 1)) == 0)  // Is power of 2
		return transform_radix2(real, imag, n);
	else  // More complicated algorithm for arbitrary sizes
		return transform_bluestein(real, imag, n);
}


int inverse_transform(double real[], double imag[], size_t n) {
	return transform(imag, real, n);
}


int transform_radix2(double real[], double imag[], size_t n) {
	// Variables
	unsigned int levels;
	double *cos_table, *sin_table;
	size_t size;
	size_t i;
	
	// Compute levels = floor(log2(n))
	{
		size_t temp = n;
		levels = 0;
		while (temp > 1) {
			levels++;
			temp >>= 1;
		}
		if (1u << levels != n)
			return 0;  // n is not a power of 2
	}
	
	// Trignometric tables
	if (SIZE_MAX / sizeof(double) < n / 2)
		return 0;
	size = (n / 2) * sizeof(double);
	cos_table = malloc(size);
	if (cos_table == NULL)
		return 0;
	sin_table = malloc(size);
	if (sin_table == NULL) {
		free(cos_table);
		return 0;
	}
	for (i = 0; i < n / 2; i++) {
		cos_table[i] = cos(2 * M_PI * i / n);
		sin_table[i] = sin(2 * M_PI * i / n);
	}
	
	// Bit-reversed addressing permutation
	for (i = 0; i < n; i++) {
		size_t j = reverse_bits(i, levels);
		if (j > i) {
			double temp = real[i];
			real[i] = real[j];
			real[j] = temp;
			temp = imag[i];
			imag[i] = imag[j];
			imag[j] = temp;
		}
	}
	
	// Cooley-Tukey decimation-in-time radix-2 FFT
	for (size = 2; size <= n; size *= 2) {
		size_t halfsize = size / 2;
		size_t tablestep = n / size;
		for (i = 0; i < n; i += size) {
			size_t j;
			size_t k;
			for (j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
				double tpre =  real[j+halfsize] * cos_table[k] + imag[j+halfsize] * sin_table[k];
				double tpim = -real[j+halfsize] * sin_table[k] + imag[j+halfsize] * cos_table[k];
				real[j + halfsize] = real[j] - tpre;
				imag[j + halfsize] = imag[j] - tpim;
				real[j] += tpre;
				imag[j] += tpim;
			}
		}
		if (size == n)  // Prevent overflow in 'size *= 2'
			break;
	}
	free(cos_table);
	free(sin_table);
	return 1;
}


int transform_bluestein(double real[], double imag[], size_t n) {
	// Variables
	int status = 0;
	double *cos_table, *sin_table;
	double *areal, *aimag;
	double *breal, *bimag;
	double *creal, *cimag;
	size_t m;
	size_t size_n, size_m;
	size_t i;
	
	// Find a power-of-2 convolution length m such that m >= n * 2 + 1
	{
		size_t target;
		if (n > (SIZE_MAX - 1) / 2)
			return 0;
		target = n * 2 + 1;
		for (m = 1; m < target; m *= 2) {
			if (SIZE_MAX / 2 < m)
				return 0;
		}
	}
	
	// Allocate memory
	if (SIZE_MAX / sizeof(double) < n || SIZE_MAX / sizeof(double) < m)
		return 0;
	size_n = n * sizeof(double);
	size_m = m * sizeof(double);
	cos_table = malloc(size_n);         if (cos_table == NULL) goto cleanup0;
	sin_table = malloc(size_n);         if (sin_table == NULL) goto cleanup1;
	areal = calloc(m, sizeof(double));  if (areal     == NULL) goto cleanup2;
	aimag = calloc(m, sizeof(double));  if (aimag     == NULL) goto cleanup3;
	breal = calloc(m, sizeof(double));  if (breal     == NULL) goto cleanup4;
	bimag = calloc(m, sizeof(double));  if (bimag     == NULL) goto cleanup5;
	creal = malloc(size_m);             if (creal     == NULL) goto cleanup6;
	cimag = malloc(size_m);             if (cimag     == NULL) goto cleanup7;
	
	// Trignometric tables
	for (i = 0; i < n; i++) {
		double temp = M_PI * (size_t)((unsigned long long)i * i % ((unsigned long long)n * 2)) / n;
		// Less accurate version if long long is unavailable: double temp = M_PI * i * i / n;
		cos_table[i] = cos(temp);
		sin_table[i] = sin(temp);
	}
	
	// Temporary vectors and preprocessing
	for (i = 0; i < n; i++) {
		areal[i] =  real[i] * cos_table[i] + imag[i] * sin_table[i];
		aimag[i] = -real[i] * sin_table[i] + imag[i] * cos_table[i];
	}
	breal[0] = cos_table[0];
	bimag[0] = sin_table[0];
	for (i = 1; i < n; i++) {
		breal[i] = breal[m - i] = cos_table[i];
		bimag[i] = bimag[m - i] = sin_table[i];
	}
	
	// Convolution
	status = convolve_complex(areal, aimag, breal, bimag, creal, cimag, m);
	
	// Postprocessing
	for (i = 0; i < n; i++) {
		real[i] =  creal[i] * cos_table[i] + cimag[i] * sin_table[i];
		imag[i] = -creal[i] * sin_table[i] + cimag[i] * cos_table[i];
	}
	
	// Clean-up
	free(cimag);
cleanup7:
	free(creal);
cleanup6:
	free(bimag);
cleanup5:
	free(breal);
cleanup4:
	free(aimag);
cleanup3:
	free(areal);
cleanup2:
	free(sin_table);
cleanup1:
	free(cos_table);
cleanup0:
	return status;
}


int convolve_real(double x[], double y[], double out[], size_t n) {
	double *ximag, *yimag, *zimag;
	int status = 0;
	ximag = calloc(n, sizeof(double));  if (ximag == NULL) goto cleanup0;
	yimag = calloc(n, sizeof(double));  if (yimag == NULL) goto cleanup1;
	zimag = calloc(n, sizeof(double));  if (zimag == NULL) goto cleanup2;
	
	status = convolve_complex(x, ximag, y, yimag, out, zimag, n);
	free(zimag);
cleanup2:
	free(yimag);
cleanup1:
	free(ximag);
cleanup0:
	return status;
}


int convolve_complex(double xreal[], double ximag[], double yreal[], double yimag[], double outreal[], double outimag[], size_t n) {
	int status = 0;
	size_t size;
	size_t i;
	if (SIZE_MAX / sizeof(double) < n)
		return 0;
	size = n * sizeof(double);
	xreal = memdup(xreal, size);  if (xreal == NULL) goto cleanup0;
	ximag = memdup(ximag, size);  if (ximag == NULL) goto cleanup1;
	yreal = memdup(yreal, size);  if (yreal == NULL) goto cleanup2;
	yimag = memdup(yimag, size);  if (yimag == NULL) goto cleanup3;
	
	if (!transform(xreal, ximag, n))
		goto cleanup4;
	if (!transform(yreal, yimag, n))
		goto cleanup4;
	for (i = 0; i < n; i++) {
		double temp = xreal[i] * yreal[i] - ximag[i] * yimag[i];
		ximag[i] = ximag[i] * yreal[i] + xreal[i] * yimag[i];
		xreal[i] = temp;
	}
	if (!inverse_transform(xreal, ximag, n))
		goto cleanup4;
	for (i = 0; i < n; i++) {  // Scaling (because this FFT implementation omits it)
		outreal[i] = xreal[i] / n;
		outimag[i] = ximag[i] / n;
	}
	status = 1;
	
cleanup4:
	free(yimag);
cleanup3:
	free(yreal);
cleanup2:
	free(ximag);
cleanup1:
	free(xreal);
cleanup0:
	return status;
}


static size_t reverse_bits(size_t x, unsigned int n) {
	size_t result = 0;
	unsigned int i;
	for (i = 0; i < n; i++, x >>= 1)
		result = (result << 1) | (x & 1);
	return result;
}


static void *memdup(void *src, size_t n) {
	void *dest = malloc(n);
	if (dest != NULL)
		memcpy(dest, src, n);
	return dest;
}
