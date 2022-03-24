/* 
 * Number-theoretic transform test (Java)
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/number-theoretic-transform-integer-dft
 */

import static java.math.BigInteger.ONE;
import static org.junit.Assert.assertArrayEquals;
import java.math.BigInteger;
import java.util.Arrays;
import java.util.Random;
import org.junit.Test;


public class BigNumberTheoreticTransformTest {
	
	@Test public void testForwardTransform() {
		BigInteger[] actual = BigNumberTheoreticTransform.transform(
			bigintArray(6, 0, 10, 7, 2), bi(3), bi(11));
		BigInteger[] expect = bigintArray(3, 7, 0, 5, 4);
		assertArrayEquals(expect, actual);
	}
	
	
	@Test public void testInverseTransform() {
		BigInteger[] actual = BigNumberTheoreticTransform.inverseTransform(
			bigintArray(3, 7, 0, 5, 4), bi(3), bi(11));
		BigInteger[] expect = bigintArray(6, 0, 10, 7, 2);
		assertArrayEquals(expect, actual);
	}
	
	
	@Test public void testSimpleConvolution() {
		BigInteger mod = bi(673);
		BigInteger root = bi(326);
		BigInteger[] vec0 = BigNumberTheoreticTransform.transform(
			bigintArray(4, 1, 4, 2, 1, 3, 5, 6), root, mod);
		BigInteger[] vec1 = BigNumberTheoreticTransform.transform(
			bigintArray(6, 1, 8, 0, 3, 3, 9, 8), root, mod);
		BigInteger[] vec2 = new BigInteger[vec0.length];
		for (int i = 0; i < vec0.length; i++)
			vec2[i] = vec0[i].multiply(vec1[i]).mod(mod);
		BigInteger[] actual = BigNumberTheoreticTransform.inverseTransform(vec2, root, mod);
		BigInteger[] expect = bigintArray(123, 120, 106, 92, 139, 144, 140, 124);
		assertArrayEquals(expect, actual);
	}
	
	
	@Test public void testAutomaticConvolution() {
		BigInteger[] actual = BigNumberTheoreticTransform.circularConvolve(
			bigintArray(4, 1, 4, 2, 1, 3, 5, 6),
			bigintArray(6, 1, 8, 0, 3, 3, 9, 8));
		BigInteger[] expect = bigintArray(123, 120, 106, 92, 139, 144, 140, 124);
		assertArrayEquals(expect, actual);
	}
	
	
	@Test public void testRoundtripRandomly() {
		final int trials = 300;
		for (int i = 0; i < trials; i++) {
			int vecLen = rand.nextInt(100) + 1;
			BigInteger maxVal = bi(rand.nextInt(100) + 1);
			BigInteger[] vec = randomVector(vecLen, maxVal.add(ONE));
			BigInteger mod = BigNumberTheoreticTransform.findModulus(vecLen, maxVal.add(ONE));
			BigInteger root = BigNumberTheoreticTransform.findPrimitiveRoot(bi(vecLen), mod.subtract(ONE), mod);
			BigInteger[] temp = BigNumberTheoreticTransform.transform(vec, root, mod);
			BigInteger[] inv = BigNumberTheoreticTransform.inverseTransform(temp, root, mod);
			assertArrayEquals(vec, inv);
		}
	}
	
	
	@Test public void testLinearityRandomly() {
		final int trials = 300;
		for (int i = 0; i < trials; i++) {
			int vecLen = rand.nextInt(100) + 1;
			BigInteger maxVal = bi(rand.nextInt(100) + 1);
			BigInteger[] vec0 = randomVector(vecLen, maxVal.add(ONE));
			BigInteger[] vec1 = randomVector(vecLen, maxVal.add(ONE));
			BigInteger mod = BigNumberTheoreticTransform.findModulus(vecLen, maxVal.add(ONE));
			BigInteger root = BigNumberTheoreticTransform.findPrimitiveRoot(bi(vecLen), mod.subtract(ONE), mod);
			
			BigInteger[] out0 = BigNumberTheoreticTransform.transform(vec0, root, mod);
			BigInteger[] out1 = BigNumberTheoreticTransform.transform(vec1, root, mod);
			BigInteger[] out01 = new BigInteger[out0.length];
			for (int j = 0; j < out0.length; j++)
				out01[j] = out0[j].add(out1[j]).mod(mod);
			
			BigInteger[] vec2 = new BigInteger[vec0.length];
			for (int j = 0; j < vec0.length; j++)
				vec2[j] = vec0[j].add(vec1[j]).mod(mod);
			BigInteger[] out2 = BigNumberTheoreticTransform.transform(vec2, root, mod);
			assertArrayEquals(out2, out01);
		}
	}
	
	
	@Test public void testConvolutionRandomly() {
		final int trials = 300;
		for (int i = 0; i < trials; i++) {
			int vecLen = rand.nextInt(100) + 1;
			BigInteger maxVal = bi(rand.nextInt(100) + 1);
			BigInteger[] vec0 = randomVector(vecLen, maxVal.add(ONE));
			BigInteger[] vec1 = randomVector(vecLen, maxVal.add(ONE));
			BigInteger[] actual = BigNumberTheoreticTransform.circularConvolve(vec0, vec1);
			BigInteger[] expect = circularConvolve(vec0, vec1);
			assertArrayEquals(expect, actual);
		}
	}
	
	
	// Naive algorithm
	private static BigInteger[] circularConvolve(BigInteger[] vec0, BigInteger[] vec1) {
		if (vec0.length != vec1.length)
			throw new IllegalArgumentException();
		BigInteger[] result = new BigInteger[vec0.length];
		Arrays.fill(result, BigInteger.ZERO);
		for (int i = 0; i < vec0.length; i++) {
			for (int j = 0; j < vec1.length; j++) {
				int k = (i + j) % vec0.length;
				result[k] = vec0[i].multiply(vec1[j]).add(result[k]);
			}
		}
		return result;
	}
	
	
	@Test public void testTransformRadix2VsNaive() {
		final int trials = 1000;
		for (int i = 0; i < trials; i++) {
			int vecLen = 1 << rand.nextInt(8);
			BigInteger maxVal = bi(rand.nextInt(100) + 1);
			BigInteger[] vec = randomVector(vecLen, maxVal.add(ONE));
			BigInteger mod = BigNumberTheoreticTransform.findModulus(vecLen, maxVal.add(ONE));
			BigInteger root = BigNumberTheoreticTransform.findPrimitiveRoot(bi(vecLen), mod.subtract(ONE), mod);
			BigInteger[] temp = BigNumberTheoreticTransform.transform(vec, root, mod);
			BigNumberTheoreticTransform.transformRadix2(vec, root, mod);
			assertArrayEquals(temp, vec);
		}
	}
	
	
	@Test public void testTransformRadix2RoundtripRandomly() {
		final int trials = 30;
		for (int i = 0; i < trials; i++) {
			int vecLen = 1 << rand.nextInt(17);
			BigInteger valLimit = bi(1 << (rand.nextInt(16) + 1));
			BigInteger[] invec = randomVector(vecLen, valLimit.add(ONE));
			
			BigInteger mod = BigNumberTheoreticTransform.findModulus(vecLen, valLimit.add(ONE));
			BigInteger root = BigNumberTheoreticTransform.findPrimitiveRoot(bi(vecLen), mod.subtract(ONE), mod);
			BigInteger[] vec = invec.clone();
			BigNumberTheoreticTransform.transformRadix2(vec, root, mod);
			
			BigNumberTheoreticTransform.transformRadix2(vec, root.modInverse(mod), mod);
			BigInteger scaler = bi(vecLen).modInverse(mod);
			for (int j = 0; j < vec.length; j++)
				vec[j] = vec[j].multiply(scaler).mod(mod);
			assertArrayEquals(invec, vec);
		}
	}
	
	
	
	/*---- Utilities ----*/
	
	private static BigInteger[] randomVector(int len, BigInteger bound) {
		BigInteger[] result = new BigInteger[len];
		int numBits = bound.subtract(ONE).bitLength();
		for (int i = 0; i < result.length; i++) {
			BigInteger val;
			do val = new BigInteger(numBits, rand);
			while (val.compareTo(bound) >= 0);
			result[i] = val;
		}
		return result;
	}
	
	
	private static BigInteger[] bigintArray(long... vec) {
		BigInteger[] result = new BigInteger[vec.length];
		for (int i = 0; i < vec.length; i++)
			result[i] = bi(vec[i]);
		return result;
	}
	
	
	private static BigInteger bi(long val) {
		return BigInteger.valueOf(val);
	}
	
	
	private static Random rand = new Random();
	
}
