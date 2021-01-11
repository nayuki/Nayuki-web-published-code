/* 
 * Fast Fourier transform
 * 
 * Copyright (c) 2021 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-fourier-transform-in-x86-assembly
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

#include <algorithm>
#include <complex>
#include <cstddef>

using std::complex;
using std::size_t;


extern "C" void Fft_transformImpl(size_t n, const size_t *bitReversal, const double *rawExpTable, double *rawVec) {
	const complex<double> *expTable = reinterpret_cast<const complex<double>*>(&rawExpTable[n - 8]);
	complex<double> *vec = reinterpret_cast<complex<double>*>(rawVec);
	
	for (size_t i = 0; i < n; i++) {
		size_t j = bitReversal[i];
		if (j > i)
			std::swap(vec[i], vec[j]);
	}
	
	for (size_t size = 2; ; size *= 2) {
		size_t halfSize = size / 2;
		size_t tableStep = n / size;
		for (size_t i = 0; i < n; i += size) {
			for (size_t j = i, k = 0; j < i + halfSize; j++, k += tableStep) {
				complex<double> temp = vec[j + halfSize] * expTable[k];
				vec[j + halfSize] = vec[j] - temp;
				vec[j] += temp;
			}
		}
		if (size == n)
			break;
	}
}
