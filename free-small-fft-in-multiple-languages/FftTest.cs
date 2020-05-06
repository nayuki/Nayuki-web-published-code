/* 
 * FFT and convolution test (C#)
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


public sealed class FftTest {
	
	/*---- Main and test functions ----*/
	
	public static void Main(string[] args) {
		// Test power-of-2 size FFTs
		for (int i = 0; i <= 12; i++)
			TestFft(1 << i);
		
		// Test small size FFTs
		for (int i = 0; i < 30; i++)
			TestFft(i);
		
		// Test diverse size FFTs
		for (int i = 0, prev = 0; i <= 100; i++) {
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
		for (int i = 0, prev = 0; i <= 100; i++) {
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
		Complex[] inputvector = RandomComplexes(size);
		Complex[] refoutvector = new Complex[size];
		NaiveDft(inputvector, refoutvector, false);
		Complex[] actualoutvector = (Complex[])inputvector.Clone();
		Fft.Transform(actualoutvector, false);
		double err = Log10RmsErr(refoutvector, actualoutvector);
		
		Complex[] actualinvector = new Complex[size];
		for (int i = 0; i < size; i++)
			actualinvector[i] = refoutvector[i] / size;
		Fft.Transform(actualinvector, true);
		err = Math.Max(Log10RmsErr(inputvector, actualinvector), err);
		Console.WriteLine("fftsize={0,4}  logerr={1,5:F1}", size, err);
	}
	
	
	private static void TestConvolution(int size) {
		Complex[] input0vector = RandomComplexes(size);
		Complex[] input1vector = RandomComplexes(size);
		Complex[] refoutvector = new Complex[size];
		NaiveConvolve(input0vector, input1vector, refoutvector);
		
		Complex[] actualoutvector = new Complex[size];
		Fft.Convolve(input0vector, input1vector, actualoutvector);
		Console.WriteLine("convsize={0,4}  logerr={1,5:F1}", size, Log10RmsErr(refoutvector, actualoutvector));
	}
	
	
	/*---- Naive reference computation functions ----*/
	
	private static void NaiveDft(Complex[] invector, Complex[] outvector, bool inverse) {
		int n = invector.Length;
		if (n != outvector.Length)
			throw new ArgumentException("Mismatched lengths");
		
		double coef = (inverse ? 2 : -2) * Math.PI;
		for (int k = 0; k < n; k++) {  // For each output element
			Complex sum = 0;
			for (int t = 0; t < n; t++) {  // For each input element
				double angle = coef * (int)((long)t * k % n) / n;  // This is more accurate than t * k
				sum += invector[t] * Complex.Exp(new Complex(0, angle));
			}
			outvector[k] = sum;
		}
	}
	
	
	private static void NaiveConvolve(Complex[] xvector, Complex[] yvector, Complex[] outvector) {
		int n = xvector.Length;
		if (n != yvector.Length || n != outvector.Length)
			throw new ArgumentException("Mismatched lengths");
		
		for (int i = 0; i < n; i++)
			outvector[i] = 0;
		for (int i = 0; i < n; i++) {
			for (int j = 0; j < n; j++)
				outvector[(i + j) % n] += xvector[i] * yvector[j];
		}
	}
	
	
	/*---- Utility functions ----*/
	
	private static double maxLogError = Double.NegativeInfinity;
	
	private static double Log10RmsErr(Complex[] xvector, Complex[] yvector) {
		int n = xvector.Length;
		if (n != yvector.Length)
			throw new ArgumentException("Mismatched lengths");
		
		double err = Math.Pow(10, -99 * 2);
		for (int i = 0; i < n; i++) {
			double temp = (xvec[i] - yvec[i]).Magnitude;
			err += temp * temp;
		}
		err = Math.Sqrt(err / Math.Max(n, 1));  // Now this is a root mean square (RMS) error
		err = Math.Log10(err);
		maxLogError = Math.Max(err, maxLogError);
		return err;
	}
	
	
	private static Complex[] RandomComplexes(int size) {
		Complex[] result = new Complex[size];
		for (int i = 0; i < result.Length; i++) {
			double real = random.NextDouble() * 2 - 1;
			double imag = random.NextDouble() * 2 - 1;
			result[i] = new Complex(real, imag);
		}
		return result;
	}
	
	private static Random random = new Random();
	
}
