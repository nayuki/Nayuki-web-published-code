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

import java.util.Random;
import org.junit.Assert;
import org.junit.Test;


public final class FastDctTest {
	
	@Test public void testFastDctLeeVsNaive() {
		for (int len = 1; len <= (1 << 13); len *= 2) {
			double[] vector = randomVector(len);
			
			double[] expect = NaiveDct.transform(vector);
			double[] actual = vector.clone();
			FastDctLee.transform(actual);
			Assert.assertArrayEquals(expect, actual, EPSILON);
			
			expect = NaiveDct.inverseTransform(vector);
			actual = vector.clone();
			FastDctLee.inverseTransform(actual);
			Assert.assertArrayEquals(expect, actual, EPSILON);
		}
	}
	
	
	@Test public void testFastDctLeeInvertibility() {
		for (int len = 1; len <= (1 << 22); len *= 2) {
			double[] vector = randomVector(len);
			double[] temp = vector.clone();
			FastDctLee.transform(temp);
			FastDctLee.inverseTransform(temp);
			for (int i = 0; i < temp.length; i++)
				temp[i] /= len / 2.0;
			Assert.assertArrayEquals(vector, temp, EPSILON);
		}
	}
	
	
	@Test public void testFastDct8VsNaive() {
		double[] vector = randomVector(8);
		
		double[] expect = NaiveDct.transform(vector);
		for (int i = 0; i < expect.length; i++)
			expect[i] /= Math.sqrt(4 * (i == 0 ? 2 : 1));
		double[] actual = vector.clone();
		FastDct8.transform(actual);
		Assert.assertArrayEquals(expect, actual, EPSILON);
		
		expect = vector.clone();
		for (int i = 0; i < expect.length; i++)
			expect[i] /= Math.sqrt(4 / (i == 0 ? 2 : 1));
		expect = NaiveDct.inverseTransform(expect);
		actual = vector.clone();
		FastDct8.inverseTransform(actual);
		Assert.assertArrayEquals(expect, actual, EPSILON);
	}
	
	
	private static double[] randomVector(int len) {
		double[] result = new double[len];
		for (int i = 0; i < result.length; i++)
			result[i] = rand.nextDouble() * 2 - 1;
		return result;
	}
	
	
	private static final double EPSILON = 1e-9;
	
	private static final Random rand = new Random();
	
}
