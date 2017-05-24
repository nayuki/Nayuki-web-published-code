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
	
	
	public static int[] inverseTransform(int[] invec, int root, int mod) {
		int[] outvec = transform(invec, reciprocal(root, mod), mod);
		int scaler = reciprocal(invec.length, mod);
		for (int i = 0; i < outvec.length; i++)
			outvec[i] = (int)((long)outvec[i] * scaler % mod);
		return outvec;
	}
	
	
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
	
	
	public static int findGenerator(int totient, int mod) {
		if (totient < 1 || totient >= mod)
			throw new IllegalArgumentException();
		for (int i = 1; i < mod; i++) {
			if (isGenerator(i, totient, mod))
				return i;
		}
		throw new ArithmeticException("No generator exists");
	}
	
	
	public static int findPrimitiveRoot(int degree, int totient, int mod) {
		if (degree < 1 || degree > totient || totient >= mod || totient % degree != 0)
			throw new IllegalArgumentException();
		int gen = findGenerator(totient, mod);
		return pow(gen, totient / degree, mod);
	}
	
	
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
	
	
	public static boolean isPrime(int n) {
		if (n <= 1)
			throw new IllegalArgumentException();
		for (int i = 2, end = sqrt(n); i <= end; i++) {
			if (n % i == 0)
				return false;
		}
		return true;
	}
	
	
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
