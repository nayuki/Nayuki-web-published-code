/* 
 * Fast discrete cosine transform algorithms (C#)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-discrete-cosine-transform-algorithms
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


public sealed class FastDctTest {
	
	public static void Main(string[] args) {
		TestFastDctLeeVsNaive();
		TestFastDctLeeInvertibility();
		TestFastDct8VsNaive();
		TestFastDctFftVsNaive();
		TestFastDctFftInvertibility();
		Console.WriteLine("Test passed");
	}
	
	
	/*---- Test suite ----*/
	
	private static void TestFastDctLeeVsNaive() {
		for (int len = 1; len <= (1 << 13); len *= 2) {
			double[] vector = RandomVector(len);
			
			double[] expect = NaiveDct.Transform(vector);
			double[] actual = (double[])vector.Clone();
			FastDctLee.Transform(actual);
			AssertArrayEquals(expect, actual, EPSILON);
			
			expect = NaiveDct.InverseTransform(vector);
			actual = (double[])vector.Clone();
			FastDctLee.InverseTransform(actual);
			AssertArrayEquals(expect, actual, EPSILON);
		}
	}
	
	
	private static void TestFastDctLeeInvertibility() {
		for (int len = 1; len <= (1 << 22); len *= 2) {
			double[] vector = RandomVector(len);
			double[] temp = (double[])vector.Clone();
			FastDctLee.Transform(temp);
			FastDctLee.InverseTransform(temp);
			for (int i = 0; i < temp.Length; i++)
				temp[i] /= len / 2.0;
			AssertArrayEquals(vector, temp, EPSILON);
		}
	}
	
	
	private static void TestFastDct8VsNaive() {
		double[] vector = RandomVector(8);
		
		double[] expect = NaiveDct.Transform(vector);
		for (int i = 0; i < expect.Length; i++)
			expect[i] /= Math.Sqrt(4 * (i == 0 ? 2 : 1));
		double[] actual = (double[])vector.Clone();
		FastDct8.Transform(actual);
		AssertArrayEquals(expect, actual, EPSILON);
		
		expect = (double[])vector.Clone();
		for (int i = 0; i < expect.Length; i++)
			expect[i] /= Math.Sqrt(4 / (i == 0 ? 2 : 1));
		expect = NaiveDct.InverseTransform(expect);
		actual = (double[])vector.Clone();
		FastDct8.InverseTransform(actual);
		AssertArrayEquals(expect, actual, EPSILON);
	}
	
	
	private static void TestFastDctFftVsNaive() {
		for (int i = 0, prev = 0; i <= 100; i++) {
			int len = (int)Math.Round(Math.Pow(3000, i / 100.0));
			if (len <= prev)
				continue;
			prev = len;
			double[] vector = RandomVector(len);
			
			double[] expect = NaiveDct.Transform(vector);
			double[] actual = (double[])vector.Clone();
			FastDctFft.Transform(actual);
			AssertArrayEquals(expect, actual, EPSILON);
			
			expect = NaiveDct.InverseTransform(vector);
			actual = (double[])vector.Clone();
			FastDctFft.InverseTransform(actual);
			AssertArrayEquals(expect, actual, EPSILON);
		}
	}
	
	
	private static void TestFastDctFftInvertibility() {
		for (int i = 0, prev = 0; i <= 30; i++) {
			int len = (int)Math.Round(Math.Pow(1000000, i / 30.0));
			if (len <= prev)
				continue;
			prev = len;
			double[] vector = RandomVector(len);
			double[] temp = (double[])vector.Clone();
			FastDctFft.Transform(temp);
			FastDctFft.InverseTransform(temp);
			for (int j = 0; j < temp.Length; j++)
				temp[j] /= len / 2.0;
			AssertArrayEquals(vector, temp, EPSILON);
		}
	}
	
	
	
	/*---- Utilities ----*/
	
	private static void AssertArrayEquals(double[] expect, double[] actual, double delta) {
		if (expect.Length != actual.Length)
			throw new SystemException("Length mismatch");
		for (int i = 0; i < expect.Length; i++) {
			if (Math.Abs(expect[i] - actual[i]) > delta)
				throw new SystemException("Value mismatch");
		}
	}
	
	
	private static double[] RandomVector(int len) {
		double[] result = new double[len];
		for (int i = 0; i < result.Length; i++)
			result[i] = rand.NextDouble() * 2 - 1;
		return result;
	}
	
	
	private const double EPSILON = 1e-9;
	
	private static readonly Random rand = new Random();
	
}
