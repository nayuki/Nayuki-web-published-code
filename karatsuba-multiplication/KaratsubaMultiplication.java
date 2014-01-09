/* 
 * Karatsuba fast multiplication algorithm
 * 
 * Copyright (c) 2011 Nayuki Minase
 * All rights reserved. Contact Nayuki for licensing.
 * http://nayuki.eigenstate.org/page/karatsuba-multiplication
 */

import java.math.BigInteger;


/**
 * Utility class for multiplying BigIntegers quickly, using the Karatsuba multiplication algorithm.
 */
public final class KaratsubaMultiplication {
	
	// Requirement: CUTOFF >= 64, or else there will be infinite recursion.
	private static final int CUTOFF = 1536;
	
	
	/**
	 * Returns {@code x * y}, the product of the specified integers. This gives the same result as {@code x.multiply(y)} but should be faster.
	 * @param x a multiplicand
	 * @param y a multiplicand
	 * @return {@code x} times {@code} y
	 * @throws NullPointerException if {@code x} or {@code y} is {@code null}
	 */
	public static BigInteger multiply(BigInteger x, BigInteger y) {
		if (x.bitLength() <= CUTOFF || y.bitLength() <= CUTOFF) {  // Base case
			return x.multiply(y);
			
		} else {
			int n = Math.max(x.bitLength(), y.bitLength());
			int half = (n + 32) / 64 * 32;  // Number of bits to use for the low part
			BigInteger mask = BigInteger.ONE.shiftLeft(half).subtract(BigInteger.ONE);
			BigInteger xlow = x.and(mask);
			BigInteger ylow = y.and(mask);
			BigInteger xhigh = x.shiftRight(half);
			BigInteger yhigh = y.shiftRight(half);
			
			BigInteger a = multiply(xhigh, yhigh);
			BigInteger b = multiply(xlow.add(xhigh), ylow.add(yhigh));
			BigInteger c = multiply(xlow, ylow);
			BigInteger d = b.subtract(a).subtract(c);
			return a.shiftLeft(half).add(d).shiftLeft(half).add(c);
		}
	}
	
	
	
	/**
	 * Not instantiable.
	 */
	private KaratsubaMultiplication() {}
	
}
