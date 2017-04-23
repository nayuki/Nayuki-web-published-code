/* 
 * Free FFT and convolution (C#)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
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


public sealed class Fft {
	
	/* 
	 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
	 * The vector can have any length. This is a wrapper function.
	 */
	public static void Transform(double[] real, double[] imag) {
		if (real.Length != imag.Length)
			throw new ArgumentException("Mismatched lengths");
		
		int n = real.Length;
		if (n == 0)
			return;
		else if ((n & (n - 1)) == 0)  // Is power of 2
			TransformRadix2(real, imag);
		else  // More complicated algorithm for arbitrary sizes
			TransformBluestein(real, imag);
	}
	
	
	/* 
	 * Computes the inverse discrete Fourier transform (IDFT) of the given complex vector, storing the result back into the vector.
	 * The vector can have any length. This is a wrapper function. This transform does not perform scaling, so the inverse is not a true inverse.
	 */
	public static void InverseTransform(double[] real, double[] imag) {
		Transform(imag, real);
	}
	
	
	/* 
	 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
	 * The vector's length must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
	 */
	public static void TransformRadix2(double[] real, double[] imag) {
		// Initialization
		if (real.Length != imag.Length)
			throw new ArgumentException("Mismatched lengths");
		int n = real.Length;
		int levels = 31 - NumberOfLeadingZeros(n);  // Equal to floor(log2(n))
		if (1 << levels != n)
			throw new ArgumentException("Length is not a power of 2");
		double[] cosTable = new double[n / 2];
		double[] sinTable = new double[n / 2];
		for (int i = 0; i < n / 2; i++) {
			cosTable[i] = Math.Cos(2 * Math.PI * i / n);
			sinTable[i] = Math.Sin(2 * Math.PI * i / n);
		}
		
		// Bit-reversed addressing permutation
		for (int i = 0; i < n; i++) {
			int j = (int)((uint)ReverseBits(i) >> (32 - levels));
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
		for (int size = 2; size <= n; size *= 2) {
			int halfsize = size / 2;
			int tablestep = n / size;
			for (int i = 0; i < n; i += size) {
				for (int j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
					double tpre =  real[j+halfsize] * cosTable[k] + imag[j+halfsize] * sinTable[k];
					double tpim = -real[j+halfsize] * sinTable[k] + imag[j+halfsize] * cosTable[k];
					real[j + halfsize] = real[j] - tpre;
					imag[j + halfsize] = imag[j] - tpim;
					real[j] += tpre;
					imag[j] += tpim;
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
	public static void TransformBluestein(double[] real, double[] imag) {
		// Find a power-of-2 convolution length m such that m >= n * 2 + 1
		if (real.Length != imag.Length)
			throw new ArgumentException("Mismatched lengths");
		int n = real.Length;
		if (n >= 0x20000000)
			throw new ArgumentException("Array too large");
		int m = HighestOneBit(n * 2 + 1) << 1;
		
		// Trignometric tables
		double[] cosTable = new double[n];
		double[] sinTable = new double[n];
		for (int i = 0; i < n; i++) {
			int j = (int)((long)i * i % (n * 2));  // This is more accurate than j = i * i
			cosTable[i] = Math.Cos(Math.PI * j / n);
			sinTable[i] = Math.Sin(Math.PI * j / n);
		}
		
		// Temporary vectors and preprocessing
		double[] areal = new double[m];
		double[] aimag = new double[m];
		for (int i = 0; i < n; i++) {
			areal[i] =  real[i] * cosTable[i] + imag[i] * sinTable[i];
			aimag[i] = -real[i] * sinTable[i] + imag[i] * cosTable[i];
		}
		double[] breal = new double[m];
		double[] bimag = new double[m];
		breal[0] = cosTable[0];
		bimag[0] = sinTable[0];
		for (int i = 1; i < n; i++) {
			breal[i] = breal[m - i] = cosTable[i];
			bimag[i] = bimag[m - i] = sinTable[i];
		}
		
		// Convolution
		double[] creal = new double[m];
		double[] cimag = new double[m];
		Convolve(areal, aimag, breal, bimag, creal, cimag);
		
		// Postprocessing
		for (int i = 0; i < n; i++) {
			real[i] =  creal[i] * cosTable[i] + cimag[i] * sinTable[i];
			imag[i] = -creal[i] * sinTable[i] + cimag[i] * cosTable[i];
		}
	}
	
	
	/* 
	 * Computes the circular convolution of the given real vectors. Each vector's length must be the same.
	 */
	public static void Convolve(double[] x, double[] y, double[] outreal) {
		if (x.Length != y.Length || x.Length != outreal.Length)
			throw new ArgumentException("Mismatched lengths");
		int n = x.Length;
		Convolve(x, new double[n], y, new double[n], outreal, new double[n]);
	}
	
	
	/* 
	 * Computes the circular convolution of the given complex vectors. Each vector's length must be the same.
	 */
	public static void Convolve(double[] xreal, double[] ximag, double[] yreal, double[] yimag, double[] outreal, double[] outimag) {
		if (xreal.Length != ximag.Length || xreal.Length != yreal.Length || yreal.Length != yimag.Length || xreal.Length != outreal.Length || outreal.Length != outimag.Length)
			throw new ArgumentException("Mismatched lengths");
		
		int n = xreal.Length;
		xreal = (double[])xreal.Clone();
		ximag = (double[])ximag.Clone();
		yreal = (double[])yreal.Clone();
		yimag = (double[])yimag.Clone();
		
		Transform(xreal, ximag);
		Transform(yreal, yimag);
		for (int i = 0; i < n; i++) {
			double temp = xreal[i] * yreal[i] - ximag[i] * yimag[i];
			ximag[i] = ximag[i] * yreal[i] + xreal[i] * yimag[i];
			xreal[i] = temp;
		}
		InverseTransform(xreal, ximag);
		for (int i = 0; i < n; i++) {  // Scaling (because this FFT implementation omits it)
			outreal[i] = xreal[i] / n;
			outimag[i] = ximag[i] / n;
		}
	}
	
	
	private static int NumberOfLeadingZeros(int val) {
		if (val == 0)
			return 32;
		int result = 0;
		for (; val >= 0; val <<= 1)
			result++;
		return result;
	}
	
	
	private static int HighestOneBit(int val) {
		for (int i = 1 << 31; i != 0; i = (int)((uint)i >> 1)) {
			if ((val & i) != 0)
				return i;
		}
		return 0;
	}
	
	
	private static int ReverseBits(int val) {
		int result = 0;
		for (int i = 0; i < 32; i++, val >>= 1)
			result = (result << 1) | (val & 1);
		return result;
	}
	
}
