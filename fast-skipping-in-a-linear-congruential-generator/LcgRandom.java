/* 
 * Linear congruential generator (LCG) with fast skipping and backward iteration (Java)
 * 
 * Copyright (c) 2021 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/fast-skipping-in-a-linear-congruential-generator
 */

import java.math.BigInteger;
import java.util.Objects;


public final class LcgRandom {
	
	/*---- Demo main program, which runs a correctness check ----*/
	
	public static void main(String[] args) {
		// Use the parameters from Java's LCG RNG
		final BigInteger A = BigInteger.valueOf(25214903917L);
		final BigInteger B = BigInteger.valueOf(11);
		final BigInteger M = BigInteger.ONE.shiftLeft(48);  // 2^48
		
		// Choose seed and create LCG RNG
		BigInteger seed = BigInteger.valueOf(System.currentTimeMillis());
		LcgRandom randSlow = new LcgRandom(A, B, M, seed);
		
		// Start testing
		final int N = 10000;
		
		// Check that skipping forward is correct
		for (int i = 0; i < N; i++) {
			LcgRandom randFast = new LcgRandom(A, B, M, seed);
			randFast.skip(i);
			if (!randSlow.getState().equals(randFast.getState()))
				throw new AssertionError();
			randSlow.next();
		}
		
		// Check that backward iteration is correct
		for (int i = N - 1; i >= 0; i--) {
			randSlow.previous();
			LcgRandom randFast = new LcgRandom(A, B, M, seed);
			randFast.skip(i);
			if (!randSlow.getState().equals(randFast.getState()))
				throw new AssertionError();
		}
		
		// Check that backward skipping is correct
		for (int i = 0; i < N; i++) {
			LcgRandom randFast = new LcgRandom(A, B, M, seed);
			randFast.skip(-i);
			if (!randSlow.getState().equals(randFast.getState()))
				throw new AssertionError();
			randSlow.previous();
		}
		
		System.out.printf("Test passed (n=%d)%n", N);
	}
	
	
	
	/*---- Code for LCG random number generator instances ----*/
	
	private final BigInteger a;  // Multiplier
	private final BigInteger b;  // Increment
	private final BigInteger m;  // Modulus
	private final BigInteger aInv;  // Multiplicative inverse of 'a' modulo m
	
	private BigInteger x;  // State
	
	
	// Requires a > 0, b >= 0, m > 0, 0 <= seed < m, a coprime with m
	public LcgRandom(BigInteger a, BigInteger b, BigInteger m, BigInteger seed) {
		Objects.requireNonNull(a);
		Objects.requireNonNull(b);
		Objects.requireNonNull(m);
		Objects.requireNonNull(seed);
		if (a.signum() != 1 || b.signum() == -1 || m.signum() != 1
				|| seed.signum() == -1 || seed.compareTo(m) >= 0)
			throw new IllegalArgumentException("Value out of range");
		
		this.a = a;
		this.aInv = a.modInverse(m);
		this.b = b;
		this.m = m;
		this.x = seed;
	}
	
	
	// Returns the raw state, with 0 <= x < m. To get a pseudorandom number
	// with a certain distribution, the value needs to be further processed.
	public BigInteger getState() {
		return x;
	}
	
	
	// Advances the state by one iteration.
	public void next() {
		x = x.multiply(a).add(b).mod(m);  // x = (a*x + b) mod m
	}
	
	
	// Rewinds the state by one iteration.
	public void previous() {
		// The intermediate result after subtracting 'b' may be
		// negative, but the modular arithmetic is correct
		x = x.subtract(b).multiply(aInv).mod(m);  // x = (a^-1 * (x - b)) mod m
	}
	
	
	// Advances/rewinds the state by the given number of iterations.
	public void skip(long n) {
		if (n >= 0)
			x = skip(a, b, m, BigInteger.valueOf(n), x);
		else
			x = skip(aInv, aInv.multiply(b).negate(), m, BigInteger.valueOf(n).negate(), x);
	}
	
	
	// Private helper function
	private static BigInteger skip(BigInteger a, BigInteger b, BigInteger m, BigInteger n, BigInteger x) {
		BigInteger a1 = a.subtract(BigInteger.ONE);  // a - 1
		BigInteger ma = a1.multiply(m);              // (a - 1) * m
		BigInteger y = a.modPow(n, ma).subtract(BigInteger.ONE).divide(a1).multiply(b);  // (a^n - 1) / (a - 1) * b, sort of
		BigInteger z = a.modPow(n, m).multiply(x);   // a^n * x, sort of
		return y.add(z).mod(m);  // (y + z) mod m
	}
	
}
