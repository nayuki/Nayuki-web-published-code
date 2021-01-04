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

#include <cstddef>

using std::size_t;


extern "C" void Fft_transformImpl(size_t n, const size_t *bitReversal, const double *expTable, double *vec) {
	// Bit-reversed addressing permutation
	{
		size_t i = 0;
		do {
			size_t j = bitReversal[i];
			if (i < j) {
				double re0 = vec[i * 2 + 0];
				double im0 = vec[i * 2 + 1];
				double re1 = vec[j * 2 + 0];
				double im1 = vec[j * 2 + 1];
				vec[i * 2 + 0] = re1;
				vec[i * 2 + 1] = im1;
				vec[j * 2 + 0] = re0;
				vec[j * 2 + 1] = im0;
			}
			i++;
		} while (i < n);
	}
	
	// Size-2 merge (special)
	{
		size_t i = 0;
		do {
			double re0 = vec[i + 0];
			double im0 = vec[i + 1];
			double re1 = vec[i + 2];
			double im1 = vec[i + 3];
			vec[i + 0] = re0 + re1;
			vec[i + 1] = im0 + im1;
			vec[i + 2] = re0 - re1;
			vec[i + 3] = im0 - im1;
			i += 4;
		} while (i < n * 2);
	}
	
	// Size-4 merge (special)
	{
		size_t i = 0;
		do {
			// Even indices
			double re0 = vec[i + 0];
			double im0 = vec[i + 1];
			double re2 = vec[i + 4];
			double im2 = vec[i + 5];
			vec[i + 0] = re0 + re2;
			vec[i + 1] = im0 + im2;
			vec[i + 4] = re0 - re2;
			vec[i + 5] = im0 - im2;
			// Odd indices
			double re1 = vec[i + 2];
			double im1 = vec[i + 3];
			double re3 = vec[i + 6];
			double im3 = vec[i + 7];
			vec[i + 2] = re1 + im3;
			vec[i + 3] = im1 - re3;
			vec[i + 6] = re1 - im3;
			vec[i + 7] = im1 + re3;
			i += 8;
		} while (i < n * 2);
	}
	
	// Size-8 and larger merges (general)
	for (size_t size = 8; ; size *= 2) {
		
		size_t i = 0;
		do {
			
			size_t j = 0;
			do {
				double x0re = vec[i + j + 0];
				double x0im = vec[i + j + 1];
				double x1re = vec[i + j + 2];
				double x1im = vec[i + j + 3];
				double y0re = vec[i + j + size + 0];
				double y0im = vec[i + j + size + 1];
				double y1re = vec[i + j + size + 2];
				double y1im = vec[i + j + size + 3];
				double e0re = expTable[j + 0];
				double e0im = expTable[j + 1];
				double e1re = expTable[j + 2];
				double e1im = expTable[j + 3];
				double z0re = y0re * e0re - y0im * e0im;
				double z0im = y0im * e0re + y0re * e0im;
				double z1re = y1re * e1re - y1im * e1im;
				double z1im = y1im * e1re + y1re * e1im;
				vec[i + j + 0] = x0re + z0re;
				vec[i + j + 1] = x0im + z0im;
				vec[i + j + 2] = x1re + z1re;
				vec[i + j + 3] = x1im + z1im;
				vec[i + j + size + 0] = x0re - z0re;
				vec[i + j + size + 1] = x0im - z0im;
				vec[i + j + size + 2] = x1re - z1re;
				vec[i + j + size + 3] = x1im - z1im;
				j += 4;
			} while (j < size);
			
			i += size * 2;
		} while (i < n * 2);
		
		if (size == n)
			break;
		expTable += size;
	}
}
