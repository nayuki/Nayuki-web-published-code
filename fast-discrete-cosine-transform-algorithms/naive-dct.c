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
#include "naive-dct.h"


// DCT type II, unscaled.
// See: https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-II
double *NaiveDct_transform(double vector[], size_t len) {
	if (SIZE_MAX / sizeof(double) < len)
		return NULL;
	double *result = malloc(len * sizeof(double));
	if (result == NULL)
		return NULL;
	
	double factor = M_PI / len;
	for (size_t i = 0; i < len; i++) {
		double sum = 0;
		for (size_t j = 0; j < len; j++)
			sum += vector[j] * cos((j + 0.5) * i * factor);
		result[i] = sum;
	}
	return result;
}


// DCT type III, unscaled.
// See: https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-III
double *NaiveDct_inverseTransform(double vector[], size_t len) {
	if (SIZE_MAX / sizeof(double) < len)
		return NULL;
	double *result = malloc(len * sizeof(double));
	if (result == NULL)
		return NULL;
	
	double factor = M_PI / len;
	for (size_t i = 0; i < len; i++) {
		double sum = vector[0] / 2;
		for (size_t j = 1; j < len; j++)
			sum += vector[j] * cos(j * (i + 0.5) * factor);
		result[i] = sum;
	}
	return result;
}
