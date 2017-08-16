/* 
 * FFT and convolution test (Java)
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

import java.util.Arrays;
import java.util.Random;


public final class FftTest {
	
	/*---- Main and test functions ----*/
	
	public static void main(String[] args) {
		// Test power-of-2 size FFTs
		for (int i = 0; i <= 12; i++)
			testFft(1 << i);
		
		// Test small size FFTs
		for (int i = 0; i < 30; i++)
			testFft(i);
		
		// Test diverse size FFTs
		for (int i = 0, prev = 0; i <= 100; i++) {
			int n = (int)Math.round(Math.pow(1500, i / 100.0));
			if (n > prev) {
				testFft(n);
				prev = n;
			}
		}
		
		// Test power-of-2 size convolutions
		for (int i = 0; i <= 12; i++)
			testConvolution(1 << i);
		
		// Test diverse size convolutions
		for (int i = 0, prev = 0; i <= 100; i++) {
			int n = (int)Math.round(Math.pow(1500, i / 100.0));
			if (n > prev) {
				testConvolution(n);
				prev = n;
			}
		}
		
		System.out.println();
		System.out.printf("Max log err = %.1f%n", maxLogError);
		System.out.println("Test " + (maxLogError < -10 ? "passed" : "failed"));
	}
	
	
	private static void testFft(int size) {
		double[] inputreal = randomReals(size);
		double[] inputimag = randomReals(size);
		
		double[] refoutreal = new double[size];
		double[] refoutimag = new double[size];
		naiveDft(inputreal, inputimag, refoutreal, refoutimag, false);
		
		double[] actualoutreal = inputreal.clone();
		double[] actualoutimag = inputimag.clone();
		Fft.transform(actualoutreal, actualoutimag);
		
		System.out.printf("fftsize=%4d  logerr=%5.1f%n", size,
			log10RmsErr(refoutreal, refoutimag, actualoutreal, actualoutimag));
	}
	
	
	private static void testConvolution(int size) {
		double[] input0real = randomReals(size);
		double[] input0imag = randomReals(size);
		double[] input1real = randomReals(size);
		double[] input1imag = randomReals(size);
		
		double[] refoutreal = new double[size];
		double[] refoutimag = new double[size];
		naiveConvolve(input0real, input0imag, input1real, input1imag, refoutreal, refoutimag);
		
		double[] actualoutreal = new double[size];
		double[] actualoutimag = new double[size];
		Fft.convolve(input0real, input0imag, input1real, input1imag, actualoutreal, actualoutimag);
		
		System.out.printf("convsize=%4d  logerr=%5.1f%n", size,
			log10RmsErr(refoutreal, refoutimag, actualoutreal, actualoutimag));
	}
	
	
	/*---- Naive reference computation functions ----*/
	
	private static void naiveDft(double[] inreal, double[] inimag, double[] outreal, double[] outimag, boolean inverse) {
		int n = inreal.length;
		if (n != inimag.length || n != outreal.length || n != outimag.length)
			throw new IllegalArgumentException("Mismatched lengths");
		
		double coef = (inverse ? 2 : -2) * Math.PI;
		for (int k = 0; k < n; k++) {  // For each output element
			double sumreal = 0;
			double sumimag = 0;
			for (int t = 0; t < n; t++) {  // For each input element
				double angle = coef * (int)((long)t * k % n) / n;  // This is more accurate than t * k
				sumreal += inreal[t] * Math.cos(angle) - inimag[t] * Math.sin(angle);
				sumimag += inreal[t] * Math.sin(angle) + inimag[t] * Math.cos(angle);
			}
			outreal[k] = sumreal;
			outimag[k] = sumimag;
		}
	}
	
	
	private static void naiveConvolve(double[] xreal, double[] ximag, double[] yreal, double[] yimag, double[] outreal, double[] outimag) {
		int n = xreal.length;
		if (n != ximag.length || n != yreal.length || n != yimag.length
				|| n != outreal.length || n != outimag.length)
			throw new IllegalArgumentException("Mismatched lengths");
		
		Arrays.fill(outreal, 0.0);
		Arrays.fill(outimag, 0.0);
		for (int i = 0; i < n; i++) {
			for (int j = 0; j < n; j++) {
				int k = (i + j) % n;
				outreal[k] += xreal[i] * yreal[j] - ximag[i] * yimag[j];
				outimag[k] += xreal[i] * yimag[j] + ximag[i] * yreal[j];
			}
		}
	}
	
	
	/*---- Utility functions ----*/
	
	private static double maxLogError = Double.NEGATIVE_INFINITY;
	
	private static double log10RmsErr(double[] xreal, double[] ximag, double[] yreal, double[] yimag) {
		int n = xreal.length;
		if (n != ximag.length || n != yreal.length || n != yimag.length)
			throw new IllegalArgumentException("Mismatched lengths");
		
		double err = Math.pow(10, -99 * 2);
		for (int i = 0; i < n; i++) {
			double real = xreal[i] - yreal[i];
			double imag = ximag[i] - yimag[i];
			err += real * real + imag * imag;
		}
		err = Math.sqrt(err / Math.max(n, 1));  // Now this is a root mean square (RMS) error
		err = Math.log10(err);
		maxLogError = Math.max(err, maxLogError);
		return err;
	}
	
	
	private static double[] randomReals(int size) {
		double[] result = new double[size];
		for (int i = 0; i < result.length; i++)
			result[i] = random.nextDouble() * 2 - 1;
		return result;
	}
	
	private static Random random = new Random();
	
}
