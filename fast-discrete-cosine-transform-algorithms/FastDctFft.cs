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
using System.Numerics;


public sealed class FastDctFft {
	
	/* 
	 * Computes the unscaled DCT type II on the specified array in place.
	 * The array length must be a power of 2 or zero.
	 * For the formula, see https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-II .
	 */
	public static void Transform(double[] vector) {
		if (vector == null)
			throw new NullReferenceException();
		int len = vector.Length;
		int halfLen = len / 2;
		Complex[] temp = new Complex[len];
		for (int i = 0; i < halfLen; i++) {
			temp[i] = vector[i * 2];
			temp[len - 1 - i] = vector[i * 2 + 1];
		}
		if (len % 2 == 1)
			temp[halfLen] = vector[len - 1];
		Fft.Transform(temp, false);
		for (int i = 0; i < len; i++)
			vector[i] = (temp[i] * Complex.Exp(new Complex(0, -i * Math.PI / (len * 2)))).Real;
	}
	
	
	/* 
	 * Computes the unscaled DCT type III on the specified array in place.
	 * The array length must be a power of 2 or zero.
	 * For the formula, see https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-III .
	 */
	public static void InverseTransform(double[] vector) {
		if (vector == null)
			throw new NullReferenceException();
		int len = vector.Length;
		if (len > 0)
			vector[0] /= 2;
		Complex[] temp = new Complex[len];
		for (int i = 0; i < len; i++)
			temp[i] = vector[i] * Complex.Exp(new Complex(0, -i * Math.PI / (len * 2)));
		Fft.Transform(temp, false);
		
		int halfLen = len / 2;
		for (int i = 0; i < halfLen; i++) {
			vector[i * 2 + 0] = temp[i].Real;
			vector[i * 2 + 1] = temp[len - 1 - i].Real;
		}
		if (len % 2 == 1)
			vector[len - 1] = temp[halfLen].Real;
	}
	
}
