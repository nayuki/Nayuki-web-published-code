/* 
 * Number-theoretic transform test (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/number-theoretic-transform-integer-dft
 */

import static org.junit.Assert.assertArrayEquals;
import java.util.Random;
import org.junit.Test;


public class SmallNumberTheoreticTransformTest {
	
	@Test public void testForwardTransform() {
		int[] actual = SmallNumberTheoreticTransform.transform(
			new int[]{6, 0, 10, 7, 2}, 3, 11);
		int[] expect = {3, 7, 0, 5, 4};
		assertArrayEquals(expect, actual);
	}
	
	
	@Test public void testInverseTransform() {
		int[] actual = SmallNumberTheoreticTransform.inverseTransform(
			new int[]{3, 7, 0, 5, 4}, 3, 11);
		int[] expect = {6, 0, 10, 7, 2};
		assertArrayEquals(expect, actual);
	}
	
	
	@Test public void testSimpleConvolution() {
		int mod = 673;
		int root = 326;
		int[] vec0 = SmallNumberTheoreticTransform.transform(
			new int[]{4, 1, 4, 2, 1, 3, 5, 6}, root, mod);
		int[] vec1 = SmallNumberTheoreticTransform.transform(
			new int[]{6, 1, 8, 0, 3, 3, 9, 8}, root, mod);
		int[] vec2 = new int[vec0.length];
		for (int i = 0; i < vec0.length; i++)
			vec2[i] = (int)((long)vec0[i] * vec1[i] % mod);
		int[] actual = SmallNumberTheoreticTransform.inverseTransform(vec2, root, mod);
		int[] expect = {123, 120, 106, 92, 139, 144, 140, 124};
		assertArrayEquals(expect, actual);
	}
	
	
	@Test public void testAutomaticConvolution() {
		int[] actual = SmallNumberTheoreticTransform.circularConvolve(
			new int[]{4, 1, 4, 2, 1, 3, 5, 6},
			new int[]{6, 1, 8, 0, 3, 3, 9, 8});
		int[] expect = {123, 120, 106, 92, 139, 144, 140, 124};
		assertArrayEquals(expect, actual);
	}
	
	
	@Test public void testRoundtripRandomly() {
		final int trials = 3000;
		for (int i = 0; i < trials; i++) {
			int vecLen = rand.nextInt(100) + 1;
			int maxVal = rand.nextInt(100) + 1;
			int[] vec = randomVector(vecLen, maxVal + 1);
			int mod = SmallNumberTheoreticTransform.findModulus(vecLen, maxVal + 1);
			int root = SmallNumberTheoreticTransform.findPrimitiveRoot(vecLen, mod - 1, mod);
			int[] temp = SmallNumberTheoreticTransform.transform(vec, root, mod);
			int[] inv = SmallNumberTheoreticTransform.inverseTransform(temp, root, mod);
			assertArrayEquals(vec, inv);
		}
	}
	
	
	@Test public void testLinearityRandomly() {
		final int trials = 3000;
		for (int i = 0; i < trials; i++) {
			int vecLen = rand.nextInt(100) + 1;
			int maxVal = rand.nextInt(100) + 1;
			int[] vec0 = randomVector(vecLen, maxVal + 1);
			int[] vec1 = randomVector(vecLen, maxVal + 1);
			int mod = SmallNumberTheoreticTransform.findModulus(vecLen, maxVal + 1);
			int root = SmallNumberTheoreticTransform.findPrimitiveRoot(vecLen, mod - 1, mod);
			
			int[] out0 = SmallNumberTheoreticTransform.transform(vec0, root, mod);
			int[] out1 = SmallNumberTheoreticTransform.transform(vec1, root, mod);
			int[] out01 = new int[out0.length];
			for (int j = 0; j < out0.length; j++)
				out01[j] = (out0[j] + out1[j]) % mod;
			
			int[] vec2 = new int[vec0.length];
			for (int j = 0; j < vec0.length; j++)
				vec2[j] = (vec0[j] + vec1[j]) % mod;
			int[] out2 = SmallNumberTheoreticTransform.transform(vec2, root, mod);
			assertArrayEquals(out2, out01);
		}
	}
	
	
	@Test public void testConvolutionRandomly() {
		final int trials = 3000;
		for (int i = 0; i < trials; i++) {
			int vecLen = rand.nextInt(100) + 1;
			int maxVal = rand.nextInt(100) + 1;
			int[] vec0 = randomVector(vecLen, maxVal + 1);
			int[] vec1 = randomVector(vecLen, maxVal + 1);
			int[] actual = SmallNumberTheoreticTransform.circularConvolve(vec0, vec1);
			int[] expect = circularConvolve(vec0, vec1);
			assertArrayEquals(expect, actual);
		}
	}
	
	
	// Naive algorithm
	private static int[] circularConvolve(int[] vec0, int[] vec1) {
		if (vec0.length != vec1.length)
			throw new IllegalArgumentException();
		int[] result = new int[vec0.length];
		for (int i = 0; i < vec0.length; i++) {
			for (int j = 0; j < vec1.length; j++)
				result[(i + j) % vec0.length] += vec0[i] * vec1[j];
		}
		return result;
	}
	
	
	@Test public void testTransformRadix2VsNaive() {
		final int trials = 10000;
		for (int i = 0; i < trials; i++) {
			int vecLen = 1 << rand.nextInt(8);
			int maxVal = rand.nextInt(100) + 1;
			int[] vec = randomVector(vecLen, maxVal + 1);
			int mod = SmallNumberTheoreticTransform.findModulus(vecLen, maxVal + 1);
			int root = SmallNumberTheoreticTransform.findPrimitiveRoot(vecLen, mod - 1, mod);
			int[] temp = SmallNumberTheoreticTransform.transform(vec, root, mod);
			SmallNumberTheoreticTransform.transformRadix2(vec, root, mod);
			assertArrayEquals(temp, vec);
		}
	}
	
	
	@Test public void testTransformRadix2RoundtripRandomly() {
		final int trials = 300;
		for (int i = 0; i < trials; i++) {
			int vecLen = 1 << rand.nextInt(17);
			int valLimit = 1 << (rand.nextInt(16) + 1);
			int[] invec = randomVector(vecLen, valLimit + 1);
			
			int mod = SmallNumberTheoreticTransform.findModulus(vecLen, valLimit + 1);
			int root = SmallNumberTheoreticTransform.findPrimitiveRoot(vecLen, mod - 1, mod);
			int[] vec = invec.clone();
			SmallNumberTheoreticTransform.transformRadix2(vec, root, mod);
			
			SmallNumberTheoreticTransform.transformRadix2(vec, SmallNumberTheoreticTransform.reciprocal(root, mod), mod);
			int scaler = SmallNumberTheoreticTransform.reciprocal(vecLen, mod);
			for (int j = 0; j < vec.length; j++)
				vec[j] = (int)((long)vec[j] * scaler % mod);
			assertArrayEquals(invec, vec);
		}
	}
	
	
	
	/*---- Utilities ----*/
	
	private static int[] randomVector(int len, int bound) {
		int[] result = new int[len];
		for (int i = 0; i < result.length; i++)
			result[i] = rand.nextInt(bound);
		return result;
	}
	
	
	private static Random rand = new Random();
	
}
