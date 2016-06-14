/* 
 * Barrett reduction algorithm (Java int/long)
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/barrett-reduction-algorithm
 */

import java.util.Random;


public final class SmallBarrettReducer {
	
	/* Demo program */
	
	public static void main(String[] args) {
		testCorrectness();
		doBenchmark();
	}
	
	
	private static void testCorrectness() {
		System.out.print("Self-check...");
		for (int i = 0; i < 100000; i++) {
			int mod = randomModulus();
			long modSqr = (long)mod * mod;
			SmallBarrettReducer br = new SmallBarrettReducer(mod);
			for (int j = 0; j < 100; j++) {
				long x = randomLong(modSqr);
				if (br.reduce(x) != (int)(x % mod))
					throw new AssertionError();
			}
		}
		System.out.println(" Passed");
	}
	
	
	private static void doBenchmark() {
		final int WARMUP = 5;
		final int ITERS = 10000000;
		
		System.out.print("Benchmark warm-up...");
		long[] vals = new long[ITERS];
		for (int i = 0; ; i++) {
			int mod = randomModulus();
			long modSqr = (long)mod * mod;
			for (int j = 0; j < vals.length; j++)
				vals[j] = randomLong(modSqr);
			
			long t0 = -System.nanoTime();
			int dummy0 = 0;  // To not discard the modulo calculations
			long mmod = mod;
			for (long val : vals)
				dummy0 ^= (int)(val % mmod);
			t0 += System.nanoTime();
			
			SmallBarrettReducer br = new SmallBarrettReducer(mod);
			long t1 = -System.nanoTime();
			int dummy1 = 0;  // To compare to dummy0
			for (long val : vals)
				dummy1 ^= br.reduce(val);
			t1 += System.nanoTime();
			
			if (dummy0 != dummy1)
				throw new AssertionError();
			if (i == WARMUP - 1) {
				System.out.println(" Done");
				System.out.println();
			} else if (i == WARMUP)
				System.out.println("Modulus     Native    Barrett");
			if (i >= WARMUP)
				System.out.printf("%7d  %6d ms  %6d ms%n", mod, t0 / 1000000, t1 / 1000000);
		}
	}
	
	
	// Analogous to java.util.Random.nextInt(int n), the result is in the range [0, n).
	private static long randomLong(long n) {
		if (n <= Integer.MAX_VALUE)
			return rand.nextInt((int)n);
		else {
			int len = 64 - Long.numberOfLeadingZeros(n);
			long mask = (1L << len) - 1;
			while (true) {  // Worst-case average running time is 2 iterations; best-case average is 1 iter
				long result = rand.nextLong() & mask;
				if (result < n)
					return result;
			}
		}
	}
	
	
	private static int randomModulus() {
		int result = 1 << (rand.nextInt(20) + 1);  // Uniform distribution on bit length in [2, 20]
		result += rand.nextInt(result - 1) + 1;  // Uniform choice of subsequent bits except not all zeros
		return result;
	}
	
	
	private static Random rand = new Random();
	
	
	
	/* Reusable library */
	
	private int modulus;
	private long factor;
	private int shift;
	
	
	public SmallBarrettReducer(int mod) {
		if (mod <= 0)
			throw new IllegalArgumentException("Modulus must be positive");
		if (Integer.bitCount(mod) == 1)
			throw new IllegalArgumentException("Modulus must not be a power of 2");
		if (mod >= (1 << 21))
			throw new IllegalArgumentException("Modulus is too large");
		
		modulus = mod;
		shift = (32 - Integer.numberOfLeadingZeros(mod)) * 2;
		factor = (1L << shift) / mod;
	}
	
	
	// For x in [0, mod^2), this returns x % mod.
	public int reduce(long x) {
		assert 0 <= x && x < (long)modulus * modulus;
		int t = (int)(x - ((x * factor) >>> shift) * modulus);
		return t < modulus ? t : t - modulus;
	}
	
}
