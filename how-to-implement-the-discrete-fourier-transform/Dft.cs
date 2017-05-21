/* 
 * Discrete Fourier transform
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
 */

using System;
using System.Numerics;


public sealed class Dft {
	
	/* 
	 * Computes the discrete Fourier transform (DFT) of the given complex vector.
	 * All the array arguments must be non-null and have the same length.
	 */
	public static void computeDft(Complex[] input, Complex[] output) {
		int n = input.Length;
		for (int k = 0; k < n; k++) {  // For each output element
			Complex sum = new Complex(0, 0);
			for (int t = 0; t < n; t++) {  // For each input element
				double angle = 2 * Math.PI * t * k / n;
				sum += input[t] * Complex.Exp(new Complex(0, -angle));
			}
			output[k] = sum;
		}
	}
	
}
