/* 
 * Free FFT and convolution (C#)
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
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

using System;
using System.Numerics;


public sealed class Fft {
	
	/* 
	 * Computes the discrete Fourier transform (DFT) or inverse transform of the given complex vector, storing the result back into the vector.
	 * The vector can have any length. This is a wrapper function. The inverse transform does not perform scaling, so it is not a true inverse.
	 */
	public static void Transform(Complex[] vec, bool inverse) {
		int n = vec.Length;
		if (n == 0)
			return;
		else if ((n & (n - 1)) == 0)  // Is power of 2
			TransformRadix2(vec, inverse);
		else  // More complicated algorithm for arbitrary sizes
			TransformBluestein(vec, inverse);
	}
	
	
	/* 
	 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
	 * The vector's length must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
	 */
	public static void TransformRadix2(Complex[] vec, bool inverse) {
		// Length variables
		int n = vec.Length;
		int levels = 0;  // compute levels = floor(log2(n))
		for (int temp = n; temp > 1; temp >>= 1)
			levels++;
		if (1 << levels != n)
			throw new ArgumentException("Length is not a power of 2");
		
		// Trigonometric table
		Complex[] expTable = new Complex[n / 2];
		double coef = 2 * Math.PI / n * (inverse ? 1 : -1);
		for (int i = 0; i < n / 2; i++)
			expTable[i] = Complex.FromPolarCoordinates(1, i * coef);
		
		// Bit-reversed addressing permutation
		for (int i = 0; i < n; i++) {
			int j = ReverseBits(i, levels);
			if (j > i) {
				Complex temp = vec[i];
				vec[i] = vec[j];
				vec[j] = temp;
			}
		}
		
		// Cooley-Tukey decimation-in-time radix-2 FFT
		for (int size = 2; size <= n; size *= 2) {
			int halfsize = size / 2;
			int tablestep = n / size;
			for (int i = 0; i < n; i += size) {
				for (int j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
					Complex temp = vec[j + halfsize] * expTable[k];
					vec[j + halfsize] = vec[j] - temp;
					vec[j] += temp;
				}
			}
			if (size == n)  // Prevent overflow in 'size *= 2'
				break;
		}
	}
	
	
	/* 
	 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
	 * The vector can have any length. This requires the convolution function, which in turn requires the radix-2 FFT function.
	 * Uses Bluestein's chirp z-transform algorithm.
	 */
	public static void TransformBluestein(Complex[] vec, bool inverse) {
		// Find a power-of-2 convolution length m such that m >= n * 2 + 1
		int n = vec.Length;
		if (n >= 0x20000000)
			throw new ArgumentException("Array too large");
		int m = 1;
		while (m < n * 2 + 1)
			m *= 2;
		
		// Trignometric table
		Complex[] expTable = new Complex[n];
		double coef = Math.PI / n * (inverse ? 1 : -1);
		for (int i = 0; i < n; i++) {
			int j = (int)((long)i * i % (n * 2));  // This is more accurate than j = i * i
			expTable[i] = Complex.Exp(new Complex(0, j * coef));
		}
		
		// Temporary vectors and preprocessing
		Complex[] avec = new Complex[m];
		for (int i = 0; i < n; i++)
			avec[i] = vec[i] * expTable[i];
		Complex[] bvec = new Complex[m];
		bvec[0] = expTable[0];
		for (int i = 1; i < n; i++)
			bvec[i] = bvec[m - i] = Complex.Conjugate(expTable[i]);
		
		// Convolution
		Complex[] cvec = new Complex[m];
		Convolve(avec, bvec, cvec);
		
		// Postprocessing
		for (int i = 0; i < n; i++)
			vec[i] = cvec[i] * expTable[i];
	}
	
	
	/* 
	 * Computes the circular convolution of the given complex vectors. Each vector's length must be the same.
	 */
	public static void Convolve(Complex[] xvec, Complex[] yvec, Complex[] outvec) {
		int n = xvec.Length;
		if (n != yvec.Length || n != outvec.Length)
			throw new ArgumentException("Mismatched lengths");
		xvec = (Complex[])xvec.Clone();
		yvec = (Complex[])yvec.Clone();
		Transform(xvec, false);
		Transform(yvec, false);
		for (int i = 0; i < n; i++)
			xvec[i] *= yvec[i];
		Transform(xvec, true);
		for (int i = 0; i < n; i++)  // Scaling (because this FFT implementation omits it)
			outvec[i] = xvec[i] / n;
	}
	
	
	private static int ReverseBits(int val, int width) {
		int result = 0;
		for (int i = 0; i < width; i++, val >>= 1)
			result = (result << 1) | (val & 1);
		return result;
	}
	
}
