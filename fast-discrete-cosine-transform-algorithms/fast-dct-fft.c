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

#include <math.h>
#include <stdint.h>
#include <stdlib.h>
#include "fast-dct-fft.h"
#include "fft.h"


// DCT type II, unscaled
bool FastDctFft_transform(double vector[], size_t len) {
	// Allocate memory
	if (SIZE_MAX / sizeof(double) < len)
		return false;
	double *real = malloc(len * sizeof(double));
	if (real == NULL)
		return false;
	
	// Preprocess the vectors
	size_t halfLen = len / 2;
	for (size_t i = 0; i < halfLen; i++) {
		real[i] = vector[i * 2];
		real[len - 1 - i] = vector[i * 2 + 1];
	}
	if (len % 2 == 1)
		real[halfLen] = vector[len - 1];
	for (size_t i = 0; i < len; i++)
		vector[i] = 0;
	
	// Transform and postprocess
	if (!transform(real, vector, len)) {
		free(real);
		return false;
	}
	for (size_t i = 0; i < len; i++) {
		double temp = i * M_PI / (len * 2);
		vector[i] = real[i] * cos(temp) + vector[i] * sin(temp);
	}
	free(real);
	return true;
}


// DCT type III, unscaled
bool FastDctFft_inverseTransform(double vector[], size_t len) {
	// Allocate memory
	if (SIZE_MAX / sizeof(double) < len)
		return false;
	double *real = malloc(len * sizeof(double));
	if (real == NULL)
		return false;
	
	// Preprocess and transform
	if (len > 0)
		vector[0] /= 2;
	for (size_t i = 0; i < len; i++) {
		double temp = i * M_PI / (len * 2);
		real[i] = vector[i] * cos(temp);
		vector[i] *= -sin(temp);
	}
	if (!transform(real, vector, len)) {
		free(real);
		return false;
	}
	
	// Postprocess the vectors
	size_t halfLen = len / 2;
	for (size_t i = 0; i < halfLen; i++) {
		vector[i * 2 + 0] = real[i];
		vector[i * 2 + 1] = real[len - 1 - i];
	}
	if (len % 2 == 1)
		vector[len - 1] = real[halfLen];
	free(real);
	return true;
}
