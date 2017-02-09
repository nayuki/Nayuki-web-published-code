/* 
 * FFT and convolution test (C#)
 * 
 * Copyright (c) 2017 Project Nayuki
 * https://www.nayuki.io/page/free-small-fft-in-multiple-languages
 * 
 * (MIT License)
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


public sealed class FftTest {
	
	/* Main and test functions */
	
	public static void Main(string[] args) {
		// Test power-of-2 size FFTs
		for (int i = 0; i <= 12; i++)
			TestFft(1 << i);
		
		// Test small size FFTs
		for (int i = 0; i < 30; i++)
			TestFft(i);
		
		// Test diverse size FFTs
		int prev = 0;
		for (int i = 0; i <= 100; i++) {
			int n = (int)Math.Round(Math.Pow(1500, i / 100.0));
			if (n > prev) {
				TestFft(n);
				prev = n;
			}
		}
		
		// Test power-of-2 size convolutions
		for (int i = 0; i <= 12; i++)
			TestConvolution(1 << i);
		
		// Test diverse size convolutions
		prev = 0;
		for (int i = 0; i <= 100; i++) {
			int n = (int)Math.Round(Math.Pow(1500, i / 100.0));
			if (n > prev) {
				TestConvolution(n);
				prev = n;
			}
		}
		
		Console.WriteLine();
		Console.WriteLine("Max log err = {0:F1}", maxLogError);
		Console.WriteLine("Test " + (maxLogError < -10 ? "passed" : "failed"));
	}
	
	
	private static void TestFft(int size) {
		double[] inputreal = RandomReals(size);
		double[] inputimag = RandomReals(size);
		
		double[] refoutreal = new double[size];
		double[] refoutimag = new double[size];
		NaiveDft(inputreal, inputimag, refoutreal, refoutimag, false);
		
		double[] actualoutreal = (double[])inputreal.Clone();
		double[] actualoutimag = (double[])inputimag.Clone();
		Fft.Transform(actualoutreal, actualoutimag);
		
		Console.WriteLine("fftsize={0,4}  logerr={1,5:F1}", size, Log10RmsErr(refoutreal, refoutimag, actualoutreal, actualoutimag));
	}
	
	
	private static void TestConvolution(int size) {
		double[] input0real = RandomReals(size);
		double[] input0imag = RandomReals(size);
		
		double[] input1real = RandomReals(size);
		double[] input1imag = RandomReals(size);
		
		double[] refoutreal = new double[size];
		double[] refoutimag = new double[size];
		NaiveConvolve(input0real, input0imag, input1real, input1imag, refoutreal, refoutimag);
		
		double[] actualoutreal = new double[size];
		double[] actualoutimag = new double[size];
		Fft.Convolve(input0real, input0imag, input1real, input1imag, actualoutreal, actualoutimag);
		
		Console.WriteLine("convsize={0,4}  logerr={1,5:F1}", size, Log10RmsErr(refoutreal, refoutimag, actualoutreal, actualoutimag));
	}
	
	
	/* Naive reference computation functions */
	
	private static void NaiveDft(double[] inreal, double[] inimag, double[] outreal, double[] outimag, bool inverse) {
		if (inreal.Length != inimag.Length || inreal.Length != outreal.Length || outreal.Length != outimag.Length)
			throw new ArgumentException("Mismatched lengths");
		
		int n = inreal.Length;
		double coef = (inverse ? 2 : -2) * Math.PI;
		for (int k = 0; k < n; k++) {  // For each output element
			double sumreal = 0;
			double sumimag = 0;
			for (int t = 0; t < n; t++) {  // For each input element
				double angle = coef * (int)((long)t * k % n) / n;  // This is more accurate than t * k
				sumreal += inreal[t]*Math.Cos(angle) - inimag[t]*Math.Sin(angle);
				sumimag += inreal[t]*Math.Sin(angle) + inimag[t]*Math.Cos(angle);
			}
			outreal[k] = sumreal;
			outimag[k] = sumimag;
		}
	}
	
	
	private static void NaiveConvolve(double[] xreal, double[] ximag, double[] yreal, double[] yimag, double[] outreal, double[] outimag) {
		if (xreal.Length != ximag.Length || xreal.Length != yreal.Length || yreal.Length != yimag.Length || xreal.Length != outreal.Length || outreal.Length != outimag.Length)
			throw new ArgumentException("Mismatched lengths");
		
		int n = xreal.Length;
		for (int i = 0; i < n; i++) {
			double sumreal = 0;
			double sumimag = 0;
			for (int j = 0; j < n; j++) {
				int k = (i - j + n) % n;
				sumreal += xreal[k] * yreal[j] - ximag[k] * yimag[j];
				sumimag += xreal[k] * yimag[j] + ximag[k] * yreal[j];
			}
			outreal[i] = sumreal;
			outimag[i] = sumimag;
		}
	}
	
	
	/* Utility functions */
	
	private static double maxLogError = Double.NegativeInfinity;
	
	private static double Log10RmsErr(double[] xreal, double[] ximag, double[] yreal, double[] yimag) {
		if (xreal.Length != ximag.Length || xreal.Length != yreal.Length || yreal.Length != yimag.Length)
			throw new ArgumentException("Mismatched lengths");
		
		double err = 0;
		for (int i = 0; i < xreal.Length; i++)
			err += (xreal[i] - yreal[i]) * (xreal[i] - yreal[i]) + (ximag[i] - yimag[i]) * (ximag[i] - yimag[i]);
		err = Math.Sqrt(err / Math.Max(xreal.Length, 1));  // Now this is a root mean square (RMS) error
		err = err > 0 ? Math.Log10(err) : -99;
		maxLogError = Math.Max(err, maxLogError);
		return err;
	}
	
	
	private static Random random = new Random();
	
	private static double[] RandomReals(int size) {
		double[] result = new double[size];
		for (int i = 0; i < result.Length; i++)
			result[i] = random.NextDouble() * 2 - 1;
		return result;
	}
	
}
