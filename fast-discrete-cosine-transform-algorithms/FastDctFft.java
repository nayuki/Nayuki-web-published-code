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

import java.util.Arrays;
import java.util.Objects;


public final class FastDctFft {
	
	/**
	 * Computes the unscaled DCT type II on the specified array in place.
	 * The array length must be a power of 2 or zero.
	 * <p>For the formula, see <a href="https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-II">
	 * Wikipedia: Discrete cosine transform - DCT-II</a>.</p>
	 * @param vector the vector of numbers to transform
	 * @throws NullPointerException if the array is {@code null}
	 */
	public static void transform(double[] vector) {
		Objects.requireNonNull(vector);
		final int len = vector.length;
		if (Integer.MAX_VALUE / 2 < len)
			throw new IllegalArgumentException();
		double[] real = Arrays.copyOf(vector, len * 2);
		double[] imag = new double[real.length];
		Fft.transform(real, imag);
		for (int i = 0; i < len; i++) {
			double temp = i * Math.PI / (len * 2);
			vector[i] = real[i] * Math.cos(temp) + imag[i] * Math.sin(temp);
		}
	}
	
	
	/**
	 * Computes the unscaled DCT type III on the specified array in place.
	 * The array length must be a power of 2 or zero.
	 * <p>For the formula, see <a href="https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-III">
	 * Wikipedia: Discrete cosine transform - DCT-III</a>.</p>
	 * @param vector the vector of numbers to transform
	 * @throws NullPointerException if the array is {@code null}
	 */
	public static void inverseTransform(double[] vector) {
		Objects.requireNonNull(vector);
		final int len = vector.length;
		if (Integer.MAX_VALUE / 2 < len)
			throw new IllegalArgumentException();
		vector[0] /= 2;
		double[] real = new double[len * 2];
		double[] imag = new double[real.length];
		for (int i = 0; i < len; i++) {
			double temp = -i * Math.PI / (len * 2);
			real[i] = vector[i] * Math.cos(temp);
			imag[i] = vector[i] * Math.sin(temp);
		}
		Fft.transform(real, imag);
		System.arraycopy(real, 0, vector, 0, len);
	}
	
}
