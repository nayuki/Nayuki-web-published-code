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
	
	// Main transform
	size_t i = 0;
	do {
		for (int j = 0; j < 2; j++, i += 8) {
			// Size-2 merge for zeroth half
			double s2r0 = vec[i + 0];
			double s2i0 = vec[i + 1];
			double s2r1 = vec[i + 2];
			double s2i1 = vec[i + 3];
			double s4r0 = s2r0 + s2r1;
			double s4i0 = s2i0 + s2i1;
			double s4r1 = s2r0 - s2r1;
			double s4i1 = s2i0 - s2i1;
			// Size-2 merge for first half
			double s2r2 = vec[i + 4];
			double s2i2 = vec[i + 5];
			double s2r3 = vec[i + 6];
			double s2i3 = vec[i + 7];
			double s4r2 = s2r2 + s2r3;
			double s4i2 = s2i2 + s2i3;
			double s4r3 = s2r2 - s2r3;
			double s4i3 = s2i2 - s2i3;
			// Size-4 merge for even indices
			vec[i + 0] = s4r0 + s4r2;
			vec[i + 1] = s4i0 + s4i2;
			vec[i + 4] = s4r0 - s4r2;
			vec[i + 5] = s4i0 - s4i2;
			// Size-4 merge for odd indices
			vec[i + 2] = s4r1 + s4i3;
			vec[i + 3] = s4i1 - s4r3;
			vec[i + 6] = s4r1 - s4i3;
			vec[i + 7] = s4i1 + s4r3;
		}
		
		// Size-8 and larger merges
		size_t block = i >> 4;
		size_t merges = block ^ (block - 1);
		const double *table = expTable;
		for (size_t size = 8; ; size *= 2) {
			double *vec0 = &vec[i - size * 2];
			double *vec1 = &vec[i - size * 1];
			
			size_t j = 0;
			do {
				double x0re = vec0[j + 0];
				double x0im = vec0[j + 1];
				double x1re = vec0[j + 2];
				double x1im = vec0[j + 3];
				double y0re = vec1[j + 0];
				double y0im = vec1[j + 1];
				double y1re = vec1[j + 2];
				double y1im = vec1[j + 3];
				double e0re = table[j + 0];
				double e0im = table[j + 1];
				double e1re = table[j + 2];
				double e1im = table[j + 3];
				double z0re = y0re * e0re - y0im * e0im;
				double z0im = y0im * e0re + y0re * e0im;
				double z1re = y1re * e1re - y1im * e1im;
				double z1im = y1im * e1re + y1re * e1im;
				vec0[j + 0] = x0re + z0re;
				vec0[j + 1] = x0im + z0im;
				vec0[j + 2] = x1re + z1re;
				vec0[j + 3] = x1im + z1im;
				vec1[j + 0] = x0re - z0re;
				vec1[j + 1] = x0im - z0im;
				vec1[j + 2] = x1re - z1re;
				vec1[j + 3] = x1im - z1im;
				j += 4;
			} while (j < size);
			
			if (merges == 1)
				break;
			merges >>= 1;
			table += size;
		}
	} while (i < n * 2);
}
