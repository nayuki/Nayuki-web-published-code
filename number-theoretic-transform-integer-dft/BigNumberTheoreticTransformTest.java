/* 
 * Number-theoretic transform test (Java)
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/number-theoretic-transform-integer-dft
 */

import static java.math.BigInteger.ONE;
import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import java.math.BigInteger;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.Assert;
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
			BigInteger mod = bi((int)cs[0]);
			BigInteger totient = bi((int)cs[1]);
			@SuppressWarnings("unchecked")
			Set<BigInteger> gens = ((List<Integer>)cs[2]).stream().map(x -> bi(x)).collect(Collectors.toSet());
			if (!gens.isEmpty()) {
				BigInteger gen = BigNumberTheoreticTransform.findGenerator(totient, mod);
				assertTrue(gens.contains(gen));
			} else {
				try {
					BigNumberTheoreticTransform.findGenerator(totient, mod);
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
			BigInteger mod = bi((int)cs[0]);
			@SuppressWarnings("unchecked")
			Set<BigInteger> primRoots = ((List<Integer>)cs[2]).stream().map(x -> bi(x)).collect(Collectors.toSet());
			for (BigInteger i = BigInteger.ZERO; i.compareTo(mod) < 0; i = i.add(ONE)) {
				boolean expect = primRoots.contains(i);
				boolean actual = BigNumberTheoreticTransform.isPrimitiveRoot(i, bi((int)cs[1]), mod);
				assertEquals(expect, actual);
			}
		}
	}
	
	
	@Test public void testIsPrimitiveRootPrimeGenerator() {
		final int TRIALS = 1_000;
		for (int i = 0; i < TRIALS; i++) {
			BigInteger p = new BigInteger(16, rand).add(bi(2));
			if (!BigNumberTheoreticTransform.isPrime(p))
				continue;
			BigInteger totient = p.subtract(ONE);
			
			BigInteger val;
			do val = new BigInteger(p.subtract(ONE).bitLength(), rand);
			while (val.compareTo(p) >= 0);
			boolean expect = true;
			BigInteger temp = ONE;
			for (BigInteger j = BigInteger.ZERO, end = totient.subtract(ONE); j.compareTo(end) < 0; j = j.add(ONE)) {
				temp = temp.multiply(val).mod(p);
				expect = expect && !temp.equals(ONE);
			}
			temp = temp.multiply(val).mod(p);
			expect = expect && temp.equals(ONE);
			boolean actual = BigNumberTheoreticTransform.isPrimitiveRoot(val, totient, p);
			assertEquals(expect, actual);
		}
	}
	
	
	@Test public void testUniquePrimeFactors() {
		Object[][] CASES = {
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
			@SuppressWarnings("unchecked")
			List<BigInteger> expect = ((List<Integer>)cs[1]).stream().map(x -> bi(x)).collect(Collectors.toList());
			List<BigInteger> actual = BigNumberTheoreticTransform.uniquePrimeFactors(bi((int)cs[0]));
			assertEquals(expect, actual);
		}
		
		final int TRIALS = 1_000;
		for (int i = 0; i < TRIALS; i++) {
			BigInteger n = new BigInteger(16, rand).add(bi(2));
			List<BigInteger> facts = BigNumberTheoreticTransform.uniquePrimeFactors(n);
			assertEquals(BigNumberTheoreticTransform.isPrime(n), facts.size() == 1 && facts.get(0).equals(n));
		}
	}
	
	
	@Test public void testIsPrime() {
		Object[][] CASES = {
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
			boolean actual = BigNumberTheoreticTransform.isPrime(bi((int)cs[0]));
			assertEquals((boolean)cs[1], actual);
		}
	}
	
	
	@Test public void testSqrt() {
		int[][] CASES = {
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
			assertEquals(bi(cs[1]), BigNumberTheoreticTransform.sqrt(bi(cs[0])));
		
		final int TRIALS = 1_000;
		for (int i = 0; i < TRIALS; i++) {
			BigInteger x = new BigInteger(16, rand);
			BigInteger y = BigNumberTheoreticTransform.sqrt(x);
			assertTrue(y.pow(2).compareTo(x) <= 0 && x.compareTo(y.add(ONE).pow(2)) < 0);
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
