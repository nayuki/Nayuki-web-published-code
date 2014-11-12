/* 
 * Montgomery reduction algorithm test
 * 
 * Copyright (c) 2014 Nayuki Minase
 * All rights reserved. Contact Nayuki for licensing.
 * http://nayuki.eigenstate.org/page/montgomery-reduction-algorithm
 */

import static junit.framework.Assert.assertEquals;
import static junit.framework.Assert.assertTrue;
import java.math.BigInteger;
import java.util.Random;
import org.junit.Test;


public class MontgomeryReducerTest {
	
	/* Test suite functions */
	
	// Tests all inputs with 3 <= modulus < 300 by brute force
	@Test public void testMultiplySmall() {
		for (int mod = 3; mod < 300; mod += 2) {
			MontgomeryReducer red = new MontgomeryReducer(BigInteger.valueOf(mod));
			for (int x = 0; x < mod; x++) {
				for (int y = 0; y < mod; y++)
					testMultiply(x, y, mod, red);
			}
		}
	}
	
	
	// Tests random inputs that fit in an int32
	@Test public void testMultiplyMedium() {
		for (int i = 0; i < 1000000; i++) {
			int mod = (random.nextInt() & 0x7FFFFFFF) | 1;
			if (mod == 1)
				mod = 3;
			int x = random.nextInt(mod);
			int y = random.nextInt(mod);
			testMultiply(x, y, mod, new MontgomeryReducer(BigInteger.valueOf(mod)));
		}
	}
	
	
	// Tests random inputs up to about 1000 bits in length
	@Test public void testMultiplyLarge() {
		for (int i = 0; i < 30000; i++) {
			BigInteger mod = new BigInteger(random.nextInt(1000) + 8, random).setBit(0);
			if (mod.equals(BigInteger.ONE))
				mod = BigInteger.valueOf(3);
			BigInteger x = randomBigIntegerLessThan(mod);
			BigInteger y = randomBigIntegerLessThan(mod);
			testMultiply(x, y, mod);
		}
	}
	
	
	// Tests inputs with 3 <= modulus < 100 by brute force
	@Test public void testPowSmall() {
		for (int mod = 3; mod < 100; mod += 2) {
			MontgomeryReducer red = new MontgomeryReducer(BigInteger.valueOf(mod));
			for (int x = 0; x < mod; x++) {
				for (int y = 0; y < mod * 2; y++)
					testPow(x, y, mod, red);
			}
		}
	}
	
	
	// Tests random inputs that fit in an int32
	@Test public void testPowMedium() {
		for (int i = 0; i < 100000; i++) {
			int mod = (random.nextInt() & 0x7FFFFFFE) | 1;
			if (mod == 1)
				mod = 3;
			int x = random.nextInt(mod);
			int y = random.nextInt(mod);
			testPow(x, y, mod, new MontgomeryReducer(BigInteger.valueOf(mod)));
		}
	}
	
	
	// Tests random inputs up to about 1000 bits in length
	@Test public void testPowLarge() {
		for (int i = 0; i < 100; i++) {
			BigInteger mod = new BigInteger(random.nextInt(1000) + 8, random).setBit(0);
			if (mod.equals(BigInteger.ONE))
				mod = BigInteger.valueOf(3);
			BigInteger x = randomBigIntegerLessThan(mod);
			BigInteger y = randomBigIntegerLessThan(mod.shiftLeft(8));
			testPow(x, y, mod);
		}
	}
	
	
	/* Test helper functions */
	
	private static void testMultiply(int x, int y, int mod, MontgomeryReducer red) {
		BigInteger xm = red.convertIn(BigInteger.valueOf(x));
		BigInteger ym = red.convertIn(BigInteger.valueOf(y));
		BigInteger zm = red.multiply(xm, ym);
		BigInteger actual = red.convertOut(zm);
		int expected = (int)((long)x * y % mod);
		assertTrue(actual.bitLength() < 32);
		assertEquals(expected, actual.intValue());
	}
	
	
	private static void testMultiply(BigInteger x, BigInteger y, BigInteger mod) {
		MontgomeryReducer red = new MontgomeryReducer(mod);
		BigInteger xm = red.convertIn(x);
		BigInteger ym = red.convertIn(y);
		BigInteger zm = red.multiply(xm, ym);
		BigInteger actual = red.convertOut(zm);
		BigInteger expected = x.multiply(y).mod(mod);
		assertEquals(expected, actual);
	}
	
	
	private static void testPow(int x, int y, int mod, MontgomeryReducer red) {
		BigInteger xm = red.convertIn(BigInteger.valueOf(x));
		BigInteger yb = BigInteger.valueOf(y);
		BigInteger zm = red.pow(xm, yb);
		BigInteger actual = red.convertOut(zm);
		int expected = powMod(x, y, mod);
		assertTrue(actual.bitLength() < 32);
		assertEquals(expected, actual.intValue());
	}
	
	
	private static void testPow(BigInteger x, BigInteger y, BigInteger mod) {
		MontgomeryReducer red = new MontgomeryReducer(mod);
		BigInteger xm = red.convertIn(x);
		BigInteger zm = red.pow(xm, y);
		BigInteger actual = red.convertOut(zm);
		BigInteger expected = x.modPow(y, mod);
		assertEquals(expected, actual);
	}
	
	
	/* Utility functions */
	
	private static int powMod(int x, int y, int mod) {
		int z = 1;
		while (y != 0) {
			if ((y & 1) != 0)
				z = (int)((long)z * x % mod);
			x = (int)((long)x * x % mod);
			y >>>= 1;
		}
		return z % mod;
	}
	
	
	private static BigInteger randomBigIntegerLessThan(BigInteger n) {
		BigInteger result;
		do result = new BigInteger(n.bitLength(), random);
		while (result.compareTo(n) >= 0);
		return result;
	}
	
	
	private static Random random = new Random();
	
}
