/* 
 * Fast discrete cosine transform algorithms (C#)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
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


public sealed class NaiveDct {
	
	/* 
	 * Computes the unscaled DCT type II on the specified array, returning a new array.
	 * The array length can be any value, starting from zero. The returned array has the same length.
	 * For the formula, see https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-II .
	 */
	public static double[] Transform(double[] vector) {
		if (vector == null)
			throw new NullReferenceException();
		double[] result = new double[vector.Length];
		double factor = Math.PI / vector.Length;
		for (int i = 0; i < vector.Length; i++) {
			double sum = 0;
			for (int j = 0; j < vector.Length; j++)
				sum += vector[j] * Math.Cos((j + 0.5) * i * factor);
			result[i] = sum;
		}
		return result;
	}
	
	
	/* 
	 * Computes the unscaled DCT type III on the specified array, returning a new array.
	 * The array length can be any value, starting from zero. The returned array has the same length.
	 * For the formula, see https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-III .
	 */
	public static double[] InverseTransform(double[] vector) {
		if (vector == null)
			throw new NullReferenceException();
		double[] result = new double[vector.Length];
		double factor = Math.PI / vector.Length;
		for (int i = 0; i < vector.Length; i++) {
			double sum = vector[0] / 2;
			for (int j = 1; j < vector.Length; j++)
				sum += vector[j] * Math.Cos(j * (i + 0.5) * factor);
			result[i] = sum;
		}
		return result;
	}
	
}
