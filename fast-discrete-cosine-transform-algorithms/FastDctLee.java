/* 
 * Fast discrete cosine transform algorithms (Java)
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

import java.util.Objects;


public final class FastDctLee {
	
	/**
	 * Computes the unscaled DCT type II on the specified array in place.
	 * The array length must be a power of 2.
	 * <p>For the formula, see <a href="https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-II">
	 * Wikipedia: Discrete cosine transform - DCT-II</a>.</p>
	 * @param vector the vector of numbers to transform
	 * @throws NullPointerException if the array is {@code null}
	 */
	public static void transform(double[] vector) {
		Objects.requireNonNull(vector);
		int n = vector.length;
		if (Integer.bitCount(n) != 1)
			throw new IllegalArgumentException("Length must be power of 2");
		transform(vector, 0, n, new double[n]);
	}
	
	
	private static void transform(double[] vector, int off, int len, double[] temp) {
		// Algorithm by Byeong Gi Lee, 1984. For details, see:
		// See: http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.118.3056&rep=rep1&type=pdf#page=34
		if (len == 1)
			return;
		int halfLen = len / 2;
		for (int i = 0; i < halfLen; i++) {
			double x = vector[off + i];
			double y = vector[off + len - 1 - i];
			temp[off + i] = x + y;
			temp[off + i + halfLen] = (x - y) / (Math.cos((i + 0.5) * Math.PI / len) * 2);
		}
		transform(temp, off, halfLen, vector);
		transform(temp, off + halfLen, halfLen, vector);
		for (int i = 0; i < halfLen - 1; i++) {
			vector[off + i * 2 + 0] = temp[off + i];
			vector[off + i * 2 + 1] = temp[off + i + halfLen] + temp[off + i + halfLen + 1];
		}
		vector[off + len - 2] = temp[off + halfLen - 1];
		vector[off + len - 1] = temp[off + len - 1];
	}
	
	
	/**
	 * Computes the unscaled DCT type III on the specified array in place.
	 * The array length must be a power of 2.
	 * <p>For the formula, see <a href="https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-III">
	 * Wikipedia: Discrete cosine transform - DCT-III</a>.</p>
	 * @param vector the vector of numbers to transform
	 * @throws NullPointerException if the array is {@code null}
	 */
	public static void inverseTransform(double[] vector) {
		Objects.requireNonNull(vector);
		int n = vector.length;
		if (Integer.bitCount(n) != 1)
			throw new IllegalArgumentException("Length must be power of 2");
		vector[0] /= 2;
		inverseTransform(vector, 0, n, new double[n]);
	}
	
	
	private static void inverseTransform(double[] vector, int off, int len, double[] temp) {
		// Algorithm by Byeong Gi Lee, 1984. For details, see:
		// https://www.nayuki.io/res/fast-discrete-cosine-transform-algorithms/lee-new-algo-discrete-cosine-transform.pdf
		if (len == 1)
			return;
		int halfLen = len / 2;
		temp[off + 0] = vector[off + 0];
		temp[off + halfLen] = vector[off + 1];
		for (int i = 1; i < halfLen; i++) {
			temp[off + i] = vector[off + i * 2];
			temp[off + i + halfLen] = vector[off + i * 2 - 1] + vector[off + i * 2 + 1];
		}
		inverseTransform(temp, off, halfLen, vector);
		inverseTransform(temp, off + halfLen, halfLen, vector);
		for (int i = 0; i < halfLen; i++) {
			double x = temp[off + i];
			double y = temp[off + i + halfLen] / (Math.cos((i + 0.5) * Math.PI / len) * 2);
			vector[off + i] = x + y;
			vector[off + len - 1 - i] = x - y;
		}
	}
	
}
