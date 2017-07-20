/* 
 * Discrete Fourier transform
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
 */

using System;
using System.Numerics;  // For Complex


public sealed class Dft {
	
	/* 
	 * Computes the discrete Fourier transform (DFT) of the given complex vector.
	 */
	public static Complex[] computeDft(Complex[] input) {
		int n = input.Length;
		Complex[] output = new Complex[n];
		for (int k = 0; k < n; k++) {  // For each output element
			Complex sum = new Complex(0, 0);
			for (int t = 0; t < n; t++) {  // For each input element
				double angle = 2 * Math.PI * t * k / n;
				sum += input[t] * Complex.Exp(new Complex(0, -angle));
			}
			output[k] = sum;
		}
		return output;
	}
	
	
	/* 
	 * Computes the discrete Fourier transform (DFT) of the given complex vector.
	 * All the array arguments must be non-null and have the same length.
	 */
	public static void computeDft(double[] inreal, double[] inimag, double[] outreal, double[] outimag) {
		int n = inreal.Length;
		for (int k = 0; k < n; k++) {  // For each output element
			double sumreal = 0;
			double sumimag = 0;
			for (int t = 0; t < n; t++) {  // For each input element
				double angle = 2 * Math.PI * t * k / n;
				sumreal +=  inreal[t] * Math.Cos(angle) + inimag[t] * Math.Sin(angle);
				sumimag += -inreal[t] * Math.Sin(angle) + inimag[t] * Math.Cos(angle);
			}
			outreal[k] = sumreal;
			outimag[k] = sumimag;
		}
	}
	
}
