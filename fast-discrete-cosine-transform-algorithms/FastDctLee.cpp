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
#include "FastDctLee.hpp"

using std::size_t;
using std::vector;


static void forwardTransform(double vector[], double temp[], size_t len);
static void inverseTransform(double vector[], double temp[], size_t len);


// DCT type II, unscaled. Algorithm by Byeong Gi Lee, 1984.
// See: http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.118.3056&rep=rep1&type=pdf#page=34
void FastDctLee::transform(vector<double> &vec) {
	transform(vec.data(), vec.size());
}


void FastDctLee::transform(double vec[], size_t len) {
	if (len > 0 && (len & (len - 1)) != 0)
		throw "Invalid length";  // Length is not power of 2
	vector<double> temp(len);
	forwardTransform(vec, temp.data(), len);
}


static void forwardTransform(double vec[], double temp[], size_t len) {
	if (len == 1)
		return;
	size_t halfLen = len / 2;
	for (size_t i = 0; i < halfLen; i++) {
		double x = vec[i];
		double y = vec[len - 1 - i];
		temp[i] = x + y;
		temp[i + halfLen] = (x - y) / (std::cos((i + 0.5) * M_PI / len) * 2);
	}
	forwardTransform(temp, vec, halfLen);
	forwardTransform(&temp[halfLen], vec, halfLen);
	for (size_t i = 0; i < halfLen - 1; i++) {
		vec[i * 2 + 0] = temp[i];
		vec[i * 2 + 1] = temp[i + halfLen] + temp[i + halfLen + 1];
	}
	vec[len - 2] = temp[halfLen - 1];
	vec[len - 1] = temp[len - 1];
}


// DCT type III, unscaled. Algorithm by Byeong Gi Lee, 1984.
// See: http://tsp7.snu.ac.kr/int_jour/IJ_2.pdf
void FastDctLee::inverseTransform(vector<double> &vec) {
	inverseTransform(vec.data(), vec.size());
}


void FastDctLee::inverseTransform(double vec[], size_t len) {
	if (len > 0 && (len & (len - 1)) != 0)
		throw "Invalid length";  // Length is not power of 2
	vec[0] /= 2;
	vector<double> temp(len);
	::inverseTransform(vec, temp.data(), len);
}


static void inverseTransform(double vec[], double temp[], size_t len) {
	if (len == 1)
		return;
	size_t halfLen = len / 2;
	temp[0] = vec[0];
	temp[halfLen] = vec[1];
	for (size_t i = 1; i < halfLen; i++) {
		temp[i] = vec[i * 2];
		temp[i + halfLen] = vec[i * 2 - 1] + vec[i * 2 + 1];
	}
	inverseTransform(temp, vec, halfLen);
	inverseTransform(&temp[halfLen], vec, halfLen);
	for (size_t i = 0; i < halfLen; i++) {
		double x = temp[i];
		double y = temp[i + halfLen] / (std::cos((i + 0.5) * M_PI / len) * 2);
		vec[i] = x + y;
		vec[len - 1 - i] = x - y;
	}
}
