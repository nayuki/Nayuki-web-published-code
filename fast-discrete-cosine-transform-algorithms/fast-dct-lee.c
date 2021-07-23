/* 
 * Fast discrete cosine transform algorithms (C)
 * 
 * Copyright (c) 2021 Project Nayuki. (MIT License)
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
#include "fast-dct-lee.h"


static void forwardTransform(double vector[restrict], double temp[restrict], size_t len);
static void inverseTransform(double vector[restrict], double temp[restrict], size_t len);


// DCT type II, unscaled. Algorithm by Byeong Gi Lee, 1984.
// See: http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.118.3056&rep=rep1&type=pdf#page=34
bool FastDctLee_transform(double vector[], size_t len) {
	if (len <= 0 || (len & (len - 1)) != 0)
		return false;  // Length is not power of 2
	if (SIZE_MAX / sizeof(double) < len)
		return false;
	double *temp = malloc(len * sizeof(double));
	if (temp == NULL)
		return false;
	forwardTransform(vector, temp, len);
	free(temp);
	return true;
}


static void forwardTransform(double vector[restrict], double temp[restrict], size_t len) {
	if (len == 1)
		return;
	size_t halfLen = len / 2;
	for (size_t i = 0; i < halfLen; i++) {
		double x = vector[i];
		double y = vector[len - 1 - i];
		temp[i] = x + y;
		temp[i + halfLen] = (x - y) / (cos((i + 0.5) * M_PI / len) * 2);
	}
	forwardTransform(temp, vector, halfLen);
	forwardTransform(&temp[halfLen], vector, halfLen);
	for (size_t i = 0; i < halfLen - 1; i++) {
		vector[i * 2 + 0] = temp[i];
		vector[i * 2 + 1] = temp[i + halfLen] + temp[i + halfLen + 1];
	}
	vector[len - 2] = temp[halfLen - 1];
	vector[len - 1] = temp[len - 1];
}


// DCT type III, unscaled. Algorithm by Byeong Gi Lee, 1984.
// See: https://www.nayuki.io/res/fast-discrete-cosine-transform-algorithms/lee-new-algo-discrete-cosine-transform.pdf
bool FastDctLee_inverseTransform(double vector[], size_t len) {
	if (len <= 0 || (len & (len - 1)) != 0)
		return false;  // Length is not power of 2
	if (SIZE_MAX / sizeof(double) < len)
		return false;
	double *temp = malloc(len * sizeof(double));
	if (temp == NULL)
		return false;
	vector[0] /= 2;
	inverseTransform(vector, temp, len);
	free(temp);
	return true;
}


static void inverseTransform(double vector[restrict], double temp[restrict], size_t len) {
	if (len == 1)
		return;
	size_t halfLen = len / 2;
	temp[0] = vector[0];
	temp[halfLen] = vector[1];
	for (size_t i = 1; i < halfLen; i++) {
		temp[i] = vector[i * 2];
		temp[i + halfLen] = vector[i * 2 - 1] + vector[i * 2 + 1];
	}
	inverseTransform(temp, vector, halfLen);
	inverseTransform(&temp[halfLen], vector, halfLen);
	for (size_t i = 0; i < halfLen; i++) {
		double x = temp[i];
		double y = temp[i + halfLen] / (cos((i + 0.5) * M_PI / len) * 2);
		vector[i] = x + y;
		vector[len - 1 - i] = x - y;
	}
}
