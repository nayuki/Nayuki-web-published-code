/* 
 * Fast Fourier transform
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
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

#include <new>
#include <stdexcept>
#include "Fft.hpp"

using std::complex;
using std::size_t;
using std::vector;


extern "C" void Fft_transformImpl(size_t n, const size_t *bitReversal, const double *expTable, double *vec);


Fft::Fft(size_t n) :
		levels(log2Exact(n)) {
	if (n < 8)
		throw std::domain_error("Length less than 8");
	for (size_t i = 0; i < n; i++)
		bitReversal.push_back(reverseBits(i, levels));
	
	expTable = new (std::align_val_t(32)) complex<double>[n - 4];
	for (size_t size = 8, j = 0; ; size *= 2) {
		for (size_t i = 0; i < size / 2; i++, j++)
			expTable[j] = std::polar(1.0, -2 * M_PI * i / size);
		if (size == n)
			break;
	}
}


Fft::~Fft() {
	::operator delete[](expTable, std::align_val_t(32));
}


void Fft::transform(complex<double> *vec) const {
	Fft_transformImpl(bitReversal.size(), bitReversal.data(),
		reinterpret_cast<const double*>(expTable), reinterpret_cast<double*>(vec));
}


size_t Fft::reverseBits(size_t val, int width) {
	size_t result = 0;
	for (int i = 0; i < width; i++, val >>= 1)
		result = (result << 1) | (val & 1U);
	return result;
}


int Fft::log2Exact(size_t val) {
	int result = 0;
	for (size_t temp = val; temp > 1U; temp >>= 1)
		result++;
	if ((static_cast<size_t>(1) + 0U) << result != val)
		throw std::domain_error("Not a power of 2");
	return result;
}
