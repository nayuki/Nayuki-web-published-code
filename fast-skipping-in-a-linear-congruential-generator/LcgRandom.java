/* 
 * Linear congruential generator (LCG) with fast skipping and backward iteration
 * Copyright (c) 2011 Nayuki Minase
 */


import java.math.BigInteger;


public class LcgRandom {
	
	/* The main method, which runs a correctness check */
	
	public static void main(String[] args) {
		// Use the parameters from Java's LCG RNG
		final BigInteger A = BigInteger.valueOf(25214903917L);
		final BigInteger B = BigInteger.valueOf(11);
		final BigInteger M = BigInteger.ONE.shiftLeft(48);  // 2^48
		
		// Choose seed and create LCG RNG
		BigInteger seed = BigInteger.valueOf(System.currentTimeMillis());
		LcgRandom rand0 = new LcgRandom(A, B, M, seed);
		
		// Start testing
		final int N = 1000;
		
		// Check that skipping forward is correct
		for (int i = 0; i < N; i++) {
			LcgRandom rand1 = new LcgRandom(A, B, M, seed);
			rand1.skip(i);
			if (!rand0.getState().equals(rand1.getState()))
				throw new AssertionError();
			rand0.next();
		}
		
		// Check that backward iteration is correct
		for (int i = N - 1; i >= 0; i--) {
			rand0.previous();
			LcgRandom rand1 = new LcgRandom(A, B, M, seed);
			rand1.skip(i);
			if (!rand0.getState().equals(rand1.getState()))
				throw new AssertionError();
		}
		
		// Check that backward skipping is correct
		for (int i = 0; i < N; i++) {
			LcgRandom rand1 = new LcgRandom(A, B, M, seed);
			rand1.skip(-i);
			if (!rand0.getState().equals(rand1.getState()))
				throw new AssertionError();
			rand0.previous();
		}
		
		System.out.printf("Success (tested %d)%n", N);
	}
	
	
	/* The LCG RNG object */
	
	private final BigInteger a;  // Multiplier
	private final BigInteger b;  // Increment
	private final BigInteger m;  // Modulus
	private final BigInteger aInv;  // Multiplicative inverse of 'a' modulo m
	
	private BigInteger x;  // State
	
	
	public LcgRandom(BigInteger a, BigInteger b, BigInteger m, BigInteger seed) {
		if (a == null || b == null || m == null || seed == null)
			throw new NullPointerException();
		if (a.compareTo(BigInteger.ZERO) <= 0 ||
		    b.compareTo(BigInteger.ZERO) <  0 ||
		    m.compareTo(BigInteger.ZERO) <= 0 ||
		    seed.compareTo(BigInteger.ZERO) < 0)
			throw new IllegalArgumentException("Arguments must be non-negative");
		
		this.a = a;
		this.aInv = a.modInverse(m);
		this.b = b;
		this.m = m;
		this.x = seed;
	}
	
	
	public BigInteger getState() {
		return x;
	}
	
	
	public void next() {
		x = x.multiply(a).add(b).mod(m);  // x = (a*x + b) mod m
	}
	
	
	public void previous() {
		// After subtracting 'b' there may be negative intermediate result, but the modular arithmetic is correct. 
		x = x.subtract(b).multiply(aInv).mod(m);  // x = (a^-1 * (x - b)) mod m
	}
	
	
	public void skip(int n) {
		if (n >= 0)
			skip(a, b, BigInteger.valueOf(n));
		else
			skip(aInv, aInv.multiply(b).negate(), BigInteger.valueOf(n).negate());
	}
	
	
	private void skip(BigInteger a, BigInteger b, BigInteger n) {
		BigInteger a1 = a.subtract(BigInteger.ONE);  // a - 1
		BigInteger ma = a1.multiply(m);              // (a - 1) * m
		BigInteger y = a.modPow(n, ma).subtract(BigInteger.ONE).divide(a1).multiply(b);  // (a^n - 1) / (a - 1) * b, sort of
		BigInteger z = a.modPow(n, m).multiply(x);   // a^n * x, sort of
		x = y.add(z).mod(m);  // (y + z) mod m
	}
	
}
