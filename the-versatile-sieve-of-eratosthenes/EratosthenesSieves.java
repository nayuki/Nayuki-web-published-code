/* 
 * Variants of the sieve of Eratosthenes (Java)
 * by Project Nayuki, 2016. Public domain.
 * https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
 */

import java.util.Arrays;


public final class EratosthenesSieves {
	
	// Given an integer limit, this returns a list of Booleans
	// where result[k] indicates whether k is a prime number.
	public static boolean[] sievePrimeness(int limit) {
		if (limit < 0 || limit == Integer.MAX_VALUE)
			throw new IllegalArgumentException("Limit out of range");
		boolean[] result = new boolean[limit + 1];
		if (limit > 0)
			Arrays.fill(result, 2, result.length, true);
		for (int i = 2, end = sqrt(limit); i <= end; i++) {
			if (result[i]) {
				for (int j = i * i; j < result.length; j += i)
					result[j] = false;
			}
		}
		return result;
	}
	
	
	// Given an integer limit, this returns a list of integers
	// where result[k] is the smallest prime factor of k.
	public static int[] sieveSmallestPrimeFactor(int limit) {
		if (limit < 0 || limit == Integer.MAX_VALUE)
			throw new IllegalArgumentException("Limit out of range");
		int[] result = new int[limit + 1];
		if (limit > 0)
			result[1] = 1;
		for (int i = 2, sqrt = sqrt(limit); i < result.length; i++) {
			if (result[i] == 0) {
				result[i] = i;
				if (i <= sqrt) {
					for (int j = i * i; j < result.length; j += i) {
						if (result[j] == 0)
							result[j] = i;
					}
				}
			}
		}
		return result;
	}
	
	
	// Given an integer limit, this returns a list of integers
	// where result[k] is the totient (Euler phi function) of k.
	public static int[] sieveTotient(int limit) {
		if (limit < 0 || limit == Integer.MAX_VALUE)
			throw new IllegalArgumentException("Limit out of range");
		int[] result = new int[limit + 1];
		for (int i = 0; i < result.length; i++)
			result[i] = i;
		for (int i = 2; i < result.length; i++) {
			if (result[i] == i) {
				for (int j = i; 0 <= j && j < result.length; j += i)
					result[j] = (result[j] / i) * (i - 1);
			}
		}
		return result;
	}
	
	
	// Given an integer limit, this returns a list of integers where result[k]
	// is the number of unique prime factors (omega function) of k.
	public static int[] sieveOmega(int limit) {
		if (limit < 0 || limit == Integer.MAX_VALUE)
			throw new IllegalArgumentException("Limit out of range");
		int[] result = new int[limit + 1];
		for (int i = 2; i < result.length; i++) {
			if (result[i] == 0) {
				for (int j = i; 0 <= j && j < result.length; j += i)
					result[j]++;
			}
		}
		return result;
	}
	
	
	// Given an integer limit, this returns a list of integers where result[k]
	// is the product of the unique prime factors (radical function) of k.
	public static int[] sieveRadical(int limit) {
		if (limit < 0 || limit == Integer.MAX_VALUE)
			throw new IllegalArgumentException("Limit out of range");
		int[] result = new int[limit + 1];
		Arrays.fill(result, 1, result.length, 1);
		for (int i = 2; i < result.length; i++) {
			if (result[i] == 1) {
				for (int j = i; 0 <= j && j < result.length; j += i)
					result[j] *= i;
			}
		}
		return result;
	}
	
	
	// Helper function: y = floor(sqrt(x)).
	private static int sqrt(int x) {
		int y = 0;
		for (int i = 1 << 15; i != 0; i >>>= 1) {
			y |= i;
			if (y > 46340 || y * y > x)
				y ^= i;
		}
		return y;
	}
	
}
