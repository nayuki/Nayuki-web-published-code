/* 
 * Number-theoretic transform library (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/number-theoretic-transform-integer-dft
 */

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;


public final class SmallNumberTheoreticTransform {
	
	/*---- High-level NTT functions ----*/
	
	// Returns the forward number-theoretic transform of the given vector with
	// respect to the given primitive nth root of unity under the given modulus.
	public static int[] transform(int[] invec, int root, int mod) {
		int n = invec.length;
		int[] outvec = new int[n];
		for (int i = 0; i < n; i++) {
			int sum = 0;
			for (int j = 0; j < n; j++) {
				int k = (int)((long)i * j % n);
				long temp = (long)invec[j] * pow(root, k, mod) + sum;
				sum = (int)(temp % mod);
			}
			outvec[i] = sum;
		}
		return outvec;
	}
	
	
	// Returns the inverse number-theoretic transform of the given vector with
	// respect to the given primitive nth root of unity under the given modulus.
	public static int[] inverseTransform(int[] invec, int root, int mod) {
		int[] outvec = transform(invec, reciprocal(root, mod), mod);
		int scaler = reciprocal(invec.length, mod);
		for (int i = 0; i < outvec.length; i++)
			outvec[i] = (int)((long)outvec[i] * scaler % mod);
		return outvec;
	}
	
	
	// Computes the forward number-theoretic transform of the given vector in place,
	// with respect to the given primitive nth root of unity under the given modulus.
	// The length of the vector must be a power of 2.
	public static void transformRadix2(int[] vector, int root, int mod) {
		int n = vector.length;
		int levels = 31 - Integer.numberOfLeadingZeros(n);
		if (1 << levels != n)
			throw new IllegalArgumentException("Length is not a power of 2");
		
		int[] powTable = new int[n / 2];
		{
			int temp = 1;
			for (int i = 0; i < powTable.length; i++) {
				powTable[i] = temp;
				temp = (int)((long)temp * root % mod);
			}
		}
		
		for (int i = 0; i < n; i++) {
			int j = Integer.reverse(i) >>> (32 - levels);
			if (j > i) {
				int temp = vector[i];
				vector[i] = vector[j];
				vector[j] = temp;
			}
		}
		
		for (int size = 2; size <= n; size *= 2) {
			int halfsize = size / 2;
			int tablestep = n / size;
			for (int i = 0; i < n; i += size) {
				for (int j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
					int l = j + halfsize;
					long left = vector[j];
					long right = (long)vector[j + halfsize] * powTable[k] % mod;
					vector[j] = (int)((left + right) % mod);
					vector[l] = (int)((left - right + mod) % mod);
				}
			}
			if (size == n)
				break;
		}
	}
	
	
	// Returns the circular convolution of the given vectors of integers.
	// All values must be non-negative. Internally, a sufficiently large modulus
	// is chosen so that the convolved result can be represented without overflow.
	public static int[] circularConvolve(int[] vec0, int[] vec1) {
		if (vec0.length == 0 || vec0.length != vec1.length)
			throw new IllegalArgumentException();
		int maxval = Integer.MIN_VALUE;
		for (int x : vec0) {
			if (x < 0)
				throw new IllegalArgumentException();
			maxval = Math.max(x, maxval);
		}
		for (int x : vec1) {
			if (x < 0)
				throw new IllegalArgumentException();
			maxval = Math.max(x, maxval);
		}
		
		BigInteger minmod = BigInteger.valueOf(maxval).pow(2)
			.multiply(BigInteger.valueOf(vec0.length)).add(BigInteger.ONE);
		if (minmod.bitLength() > 31)
			throw new ArithmeticException();
		int mod = findModulus(vec0.length, minmod.intValue());
		int root = findPrimitiveRoot(vec0.length, mod - 1, mod);
		int[] temp0 = transform(vec0, root, mod);
		int[] temp1 = transform(vec1, root, mod);
		int[] temp2 = new int[temp0.length];
		for (int i = 0; i < temp0.length; i++)
			temp2[i] = (int)((long)temp0[i] * temp1[i] % mod);
		return inverseTransform(temp2, root, mod);
	}
	
	
	
	/*---- Mid-level number theory functions for NTT ----*/
	
	// Returns the smallest modulus mod such that mod = i * veclen + 1
	// for some integer i >= 1, mod > veclen, and mod is prime.
	// Although the loop might run for a long time and create arbitrarily large numbers,
	// Dirichlet's theorem guarantees that such a prime number must exist.
	public static int findModulus(int vecLen, int minimum) {
		if (vecLen < 1 || minimum < 1)
			throw new IllegalArgumentException();
		int start = (int)((long)(minimum - 1 + vecLen - 1) / vecLen);
		start = Math.max(start, 1);
		for (long n = (long)start * vecLen + 1; n <= Integer.MAX_VALUE; n += vecLen) {
			if (isPrime((int)n))
				return (int)n;
		}
		throw new ArithmeticException();
	}
	
	
	// Returns an arbitrary generator of the multiplicative group of integers modulo mod.
	// totient must equal the Euler phi function of mod. If mod is prime, an answer must exist.
	public static int findGenerator(int totient, int mod) {
		if (totient < 1 || totient >= mod)
			throw new IllegalArgumentException();
		for (int i = 1; i < mod; i++) {
			if (isGenerator(i, totient, mod))
				return i;
		}
		throw new ArithmeticException("No generator exists");
	}
	
	
	// Returns an arbitrary primitive degree-th root of unity modulo mod.
	// totient must be a multiple of degree. If mod is prime, an answer must exist.
	public static int findPrimitiveRoot(int degree, int totient, int mod) {
		if (degree < 1 || degree > totient || totient >= mod || totient % degree != 0)
			throw new IllegalArgumentException();
		int gen = findGenerator(totient, mod);
		return pow(gen, totient / degree, mod);
	}
	
	
	// Tests whether val generates the multiplicative group of integers modulo mod. totient
	// must equal the Euler phi function of mod. In other words, the set of numbers
	// {val^0 % mod, val^1 % mod, ..., val^(totient-1) % mod} is equal to the set of all
	// numbers in the range [0, mod) that are coprime to mod. If mod is prime, then
	// totient = mod - 1, and powers of a generator produces all integers in the range [1, mod).
	public static boolean isGenerator(int val, int totient, int mod) {
		if (val < 0 || val >= mod)
			throw new IllegalArgumentException();
		if (totient < 1 || totient >= mod)
			throw new IllegalArgumentException();
		
		if (pow(val, totient, mod) != 1)
			return false;
		for (int p : uniquePrimeFactors(totient)) {
			if (pow(val, totient / p, mod) == 1)
				return false;
		}
		return true;
	}
	
	
	// Tests whether val is a primitive degree-th root of unity modulo mod.
	// In other words, val^degree % mod = 1, and for each 1 <= k < degree, val^k % mod != 1.
	public static boolean isPrimitiveRoot(int val, int degree, int mod) {
		if (val < 0 || val >= mod)
			throw new IllegalArgumentException();
		if (degree < 1 || degree >= mod)
			throw new IllegalArgumentException();
		
		if (pow(val, degree, mod) != 1)
			return false;
		for (int p : uniquePrimeFactors(degree)) {
			if (pow(val, degree / p, mod) == 1)
				return false;
		}
		return true;
	}
	
	
	
	/*---- Low-level common number theory functions ----*/
	
	// Returns the multiplicative inverse of n modulo mod. The inverse x has the property that
	// 0 <= x < mod and (x * n) % mod = 1. The inverse exists if and only if gcd(n, mod) = 1.
	public static int reciprocal(int n, int mod) {
		if (n < 0 || n >= mod)
			throw new IllegalArgumentException();
		int x = mod;
		int y = n;
		int a = 0;
		int b = 1;
		while (y != 0) {
			int temp = a - x / y * b;
			a = b;
			b = temp;
			temp = x % y;
			x = y;
			y = temp;
		}
		if (x == 1)
			return a >= 0 ? a : a + mod;
		else
			throw new ArithmeticException();
	}
	
	
	// Returns a list of unique prime factors of the given integer in
	// ascending order. For example, unique_prime_factors(60) = [2, 3, 5].
	public static List<Integer> uniquePrimeFactors(int n) {
		if (n < 1)
			throw new IllegalArgumentException();
		List<Integer> result = new ArrayList<>();
		for (int i = 2, end = sqrt(n); i <= end; i++) {
			if (n % i == 0) {
				n /= i;
				result.add(i);
				while (n % i == 0)
					n /= i;
				end = sqrt(n);
			}
		}
		if (n > 1)
			result.add(n);
		return result;
	}
	
	
	// Tests whether the given integer n >= 2 is a prime number.
	public static boolean isPrime(int n) {
		if (n <= 1)
			throw new IllegalArgumentException();
		for (int i = 2, end = sqrt(n); i <= end; i++) {
			if (n % i == 0)
				return false;
		}
		return true;
	}
	
	
	// Returns (x^y) % mod for the given integers 0 <= x < mod, y >= 0, mod > 0.
	public static int pow(int x, int y, int mod) {
		if (x < 0 || x >= mod || y < 0)
			throw new IllegalArgumentException();
		int result = 1;
		for (; y != 0; y >>>= 1) {
			if ((y & 1) != 0)
				result = (int)((long)result * x % mod);
			x = (int)((long)x * x % mod);
		}
		return result;
	}
	
	
	// Returns floor(sqrt(x)) for the given integer x >= 0.
	public static int sqrt(int x) {
		if (x < 0)
			throw new IllegalArgumentException();
		int y = 0;
		for (int i = 1 << 15; i != 0; i >>>= 1) {
			y |= i;
			if (y > 46340 || y * y > x)
				y ^= i;
		}
		return y;
	}
	
}
