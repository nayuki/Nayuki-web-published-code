/* 
 * Number-theoretic transform test (Java)
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/number-theoretic-transform-integer-dft
 */

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import org.junit.Assert;
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
	
	
	@Test public void testFindGenerator() {
		final Object[][] CASES = {
			{ 2,  1, Arrays.asList(1)},
			{ 3,  2, Arrays.asList(2)},
			{ 4,  2, Arrays.asList(3)},
			{ 5,  4, Arrays.asList(2, 3)},
			{ 6,  2, Arrays.asList(5)},
			{ 7,  6, Arrays.asList(3, 5)},
			{ 8,  4, Arrays.asList()},
			{ 9,  6, Arrays.asList(2, 5)},
			{10,  4, Arrays.asList(3, 7)},
			{11, 10, Arrays.asList(2, 6, 7, 8)},
			{12,  4, Arrays.asList()},
			{13, 12, Arrays.asList(2, 6, 7, 11)},
			{14,  6, Arrays.asList(3, 5)},
			{15,  8, Arrays.asList()},
			{16,  8, Arrays.asList()},
			{17, 16, Arrays.asList(3, 5, 6, 7, 10, 11, 12, 14)},
			{18,  6, Arrays.asList(5, 11)},
			{19, 18, Arrays.asList(2, 3, 10, 13, 14, 15)},
			{20,  8, Arrays.asList()},
			{21, 12, Arrays.asList()},
			{22, 10, Arrays.asList(7, 13, 17, 19)},
			{23, 22, Arrays.asList(5, 7, 10, 11, 14, 15, 17, 19, 20, 21)},
		};
		for (Object[] cs : CASES) {
			int mod = (int)cs[0];
			int totient = (int)cs[1];
			@SuppressWarnings("unchecked")
			Set<Integer> gens = new HashSet<>((List<Integer>)cs[2]);
			if (!gens.isEmpty()) {
				int gen = SmallNumberTheoreticTransform.findGenerator(totient, mod);
				assertTrue(gens.contains(gen));
			} else {
				try {
					SmallNumberTheoreticTransform.findGenerator(totient, mod);
					Assert.fail();
				} catch (ArithmeticException e) {}  // Pass
			}
		}
	}
	
	
	@Test public void testIsPrimitiveRoot() {
		final Object[][] CASES = {
			{ 2,  1, Arrays.asList(1)},
			{ 3,  2, Arrays.asList(2)},
			{ 4,  2, Arrays.asList(3)},
			{ 5,  2, Arrays.asList(4)},
			{ 5,  4, Arrays.asList(2, 3)},
			{ 6,  2, Arrays.asList(5)},
			{ 7,  2, Arrays.asList(6)},
			{ 7,  3, Arrays.asList(2, 4)},
			{ 7,  6, Arrays.asList(3, 5)},
			{ 8,  2, Arrays.asList(3, 5, 7)},
			{ 8,  4, Arrays.asList()},
			{ 9,  2, Arrays.asList(8)},
			{ 9,  3, Arrays.asList(4, 7)},
			{ 9,  6, Arrays.asList(2, 5)},
			{10,  2, Arrays.asList(9)},
			{10,  4, Arrays.asList(3, 7)},
			{11,  2, Arrays.asList(10)},
			{11,  5, Arrays.asList(3, 4, 5, 9)},
			{11, 10, Arrays.asList(2, 6, 7, 8)},
			{12,  2, Arrays.asList(5, 7, 11)},
			{12,  4, Arrays.asList()},
			{13,  2, Arrays.asList(12)},
			{13,  3, Arrays.asList(3, 9)},
			{13,  4, Arrays.asList(5, 8)},
			{13,  6, Arrays.asList(4, 10)},
			{13, 12, Arrays.asList(2, 6, 7, 11)},
			{14,  2, Arrays.asList(13)},
			{14,  3, Arrays.asList(9, 11)},
			{14,  6, Arrays.asList(3, 5)},
			{15,  2, Arrays.asList(4, 11, 14)},
			{15,  4, Arrays.asList(2, 7, 8, 13)},
			{15,  8, Arrays.asList()},
			
			{16,  8, Arrays.asList()},
			{17, 16, Arrays.asList(3, 5, 6, 7, 10, 11, 12, 14)},
			{18,  6, Arrays.asList(5, 11)},
			{19, 18, Arrays.asList(2, 3, 10, 13, 14, 15)},
			{20,  8, Arrays.asList()},
			{21, 12, Arrays.asList()},
			{22, 10, Arrays.asList(7, 13, 17, 19)},
			{23, 22, Arrays.asList(5, 7, 10, 11, 14, 15, 17, 19, 20, 21)},
		};
		for (Object[] cs : CASES) {
			int mod = (int)cs[0];
			@SuppressWarnings("unchecked")
			Set<Integer> primRoots = new HashSet<>((List<Integer>)cs[2]);
			for (int i = 0; i < mod; i++) {
				boolean expect = primRoots.contains(i);
				boolean actual = SmallNumberTheoreticTransform.isPrimitiveRoot(i, (int)cs[1], mod);
				assertEquals(expect, actual);
			}
		}
	}
	
	
	@Test public void testIsPrimitiveRootPrimeGenerator() {
		final int TRIALS = 1_000;
		for (int i = 0; i < TRIALS; i++) {
			int p = rand.nextInt(10_000) + 2;
			if (!SmallNumberTheoreticTransform.isPrime(p))
				continue;
			int totient = p - 1;
			
			int val = rand.nextInt(p);
			boolean expect = true;
			long temp = 1;
			for (int j = 0; j < totient - 1; j++) {
				temp = temp * val % p;
				expect = expect && temp != 1;
			}
			temp = temp * val % p;
			expect = expect && temp == 1;
			boolean actual = SmallNumberTheoreticTransform.isPrimitiveRoot(val, totient, p);
			assertEquals(expect, actual);
		}
	}
	
	
	@Test public void testReciprocal() {
		final int[][] CASES = {
			{ 2,  1,  1},
			{ 3,  1,  1},
			{ 3,  2,  2},
			{ 4,  1,  1},
			{ 4,  3,  3},
			{ 5,  1,  1},
			{ 5,  2,  3},
			{ 5,  3,  2},
			{ 5,  4,  4},
			{ 6,  1,  1},
			{ 6,  5,  5},
			{ 7,  1,  1},
			{ 7,  2,  4},
			{ 7,  3,  5},
			{ 7,  4,  2},
			{ 7,  5,  3},
			{ 7,  6,  6},
			{ 8,  1,  1},
			{ 8,  3,  3},
			{ 8,  5,  5},
			{ 8,  7,  7},
			{ 9,  1,  1},
			{ 9,  2,  5},
			{ 9,  4,  7},
			{ 9,  5,  2},
			{ 9,  7,  4},
			{ 9,  8,  8},
			{10,  1,  1},
			{10,  3,  7},
			{10,  7,  3},
			{10,  9,  9},
			{11,  1,  1},
			{11,  2,  6},
			{11,  3,  4},
			{11,  4,  3},
			{11,  5,  9},
			{11,  6,  2},
			{11,  7,  8},
			{11,  8,  7},
			{11,  9,  5},
			{11, 10, 10},
		};
		for (int[] cs : CASES)
			assertEquals(cs[2], SmallNumberTheoreticTransform.reciprocal(cs[1], cs[0]));
		
		final int TRIALS = 1_000;
		for (int i = 0; i < TRIALS; i++) {
			int p = rand.nextInt(10_000) + 2;
			if (!SmallNumberTheoreticTransform.isPrime(p))
				continue;
			for (int j = 0; j < 10; j++) {
				int x = rand.nextInt(p - 1) + 1;
				int y = SmallNumberTheoreticTransform.reciprocal(x, p);
				assertTrue(0 <= y && y < p);
				assertEquals(1, (long)x * y % p);
			}
		}
	}
	
	
	@Test public void testUniquePrimeFactors() {
		final Object[][] CASES = {
			{ 1, Arrays.asList()},
			{ 2, Arrays.asList(2)},
			{ 3, Arrays.asList(3)},
			{ 4, Arrays.asList(2)},
			{ 5, Arrays.asList(5)},
			{ 6, Arrays.asList(2, 3)},
			{ 7, Arrays.asList(7)},
			{ 8, Arrays.asList(2)},
			{ 9, Arrays.asList(3)},
			{10, Arrays.asList(2, 5)},
			{11, Arrays.asList(11)},
			{12, Arrays.asList(2, 3)},
			{13, Arrays.asList(13)},
			{14, Arrays.asList(2, 7)},
			{15, Arrays.asList(3, 5)},
			{16, Arrays.asList(2)},
		};
		for (Object[] cs : CASES) {
			List<Integer> actual = SmallNumberTheoreticTransform.uniquePrimeFactors((int)cs[0]);
			assertEquals(cs[1], actual);
		}
		
		final int TRIALS = 1_000;
		for (int i = 0; i < TRIALS; i++) {
			int n = rand.nextInt(10_000) + 2;
			List<Integer> facts = SmallNumberTheoreticTransform.uniquePrimeFactors(n);
			assertEquals(SmallNumberTheoreticTransform.isPrime(n), facts.size() == 1 && facts.get(0) == n);
		}
	}
	
	
	@Test public void testIsPrime() {
		final Object[][] CASES = {
			{ 2, true },
			{ 3, true },
			{ 4, false},
			{ 5, true },
			{ 6, false},
			{ 7, true },
			{ 8, false},
			{ 9, false},
			{10, false},
			{11, true },
			{12, false},
			{13, true },
			{14, false},
			{15, false},
			{16, false},
		};
		for (Object[] cs : CASES) {
			boolean actual = SmallNumberTheoreticTransform.isPrime((int)cs[0]);
			assertEquals((boolean)cs[1], actual);
		}
	}
	
	
	@Test public void testSqrt() {
		final int[][] CASES = {
			{0, 0},
			{1, 1},
			{2, 1},
			{3, 1},
			{4, 2},
			{5, 2},
			{6, 2},
			{7, 2},
			{8, 2},
			{9, 3},
		};
		for (int[] cs : CASES)
			assertEquals(cs[1], SmallNumberTheoreticTransform.sqrt(cs[0]));
		
		final int TRIALS = 1_000;
		for (int i = 0; i < TRIALS; i++) {
			int x = rand.nextInt(10_000);
			long y = SmallNumberTheoreticTransform.sqrt(x);
			assertTrue(y * y <= x && x < (y + 1) * (y + 1));
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
