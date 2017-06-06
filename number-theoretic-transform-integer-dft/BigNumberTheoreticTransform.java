/* 
 * Number-theoretic transform library (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/number-theoretic-transform-integer-dft
 */

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;


public final class BigNumberTheoreticTransform {
	
	/*---- High-level NTT functions ----*/
	
	public static BigInteger[] transform(BigInteger[] invec, BigInteger root, BigInteger mod) {
		int n = invec.length;
		BigInteger[] outvec = new BigInteger[n];
		for (int i = 0; i < n; i++) {
			BigInteger sum = BigInteger.ZERO;
			for (int j = 0; j < n; j++) {
				BigInteger k = BigInteger.valueOf((long)i * j % n);
				sum = invec[j].multiply(root.modPow(k, mod)).add(sum).mod(mod);
			}
			outvec[i] = sum;
		}
		return outvec;
	}
	
	
	public static BigInteger[] inverseTransform(BigInteger[] invec, BigInteger root, BigInteger mod) {
		BigInteger[] outvec = transform(invec, root.modInverse(mod), mod);
		BigInteger scaler = BigInteger.valueOf(invec.length).modInverse(mod);
		for (int i = 0; i < outvec.length; i++)
			outvec[i] = outvec[i].multiply(scaler).mod(mod);
		return outvec;
	}
	
	
	public static void transformRadix2(BigInteger[] vector, BigInteger root, BigInteger mod) {
		int n = vector.length;
		int levels = 31 - Integer.numberOfLeadingZeros(n);
		if (1 << levels != n)
			throw new IllegalArgumentException("Length is not a power of 2");
		
		BigInteger[] powTable = new BigInteger[n / 2];
		{
			BigInteger temp = BigInteger.ONE;
			for (int i = 0; i < powTable.length; i++) {
				powTable[i] = temp;
				temp = temp.multiply(root).mod(mod);
			}
		}
		
		for (int i = 0; i < n; i++) {
			int j = Integer.reverse(i) >>> (32 - levels);
			if (j > i) {
				BigInteger temp = vector[i];
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
					BigInteger left = vector[j];
					BigInteger right = vector[j + halfsize].multiply(powTable[k]);
					vector[j] = left.add(right).mod(mod);
					vector[l] = left.subtract(right).mod(mod);
				}
			}
			if (size == n)
				break;
		}
	}
	
	
	public static BigInteger[] circularConvolve(BigInteger[] vec0, BigInteger[] vec1) {
		if (vec0.length == 0 || vec0.length != vec1.length)
			throw new IllegalArgumentException();
		BigInteger maxval = Collections.max(Arrays.asList(vec0));
		maxval = Collections.max(Arrays.asList(vec1)).max(maxval);
		
		BigInteger minmod = maxval.pow(2).multiply(BigInteger.valueOf(vec0.length)).add(ONE);
		BigInteger mod = findModulus(vec0.length, minmod);
		BigInteger root = findPrimitiveRoot(BigInteger.valueOf(vec0.length), mod.subtract(ONE), mod);
		BigInteger[] temp0 = transform(vec0, root, mod);
		BigInteger[] temp1 = transform(vec1, root, mod);
		BigInteger[] temp2 = new BigInteger[temp0.length];
		for (int i = 0; i < temp0.length; i++)
			temp2[i] = temp0[i].multiply(temp1[i]).mod(mod);
		return inverseTransform(temp2, root, mod);
	}
	
	
	
	/*---- Mid-level number theory functions for NTT ----*/
	
	public static BigInteger findModulus(int vecLen, BigInteger minimum) {
		if (vecLen < 1 || minimum.compareTo(ONE) < 0)
			throw new IllegalArgumentException();
		BigInteger vl = BigInteger.valueOf(vecLen);
		BigInteger start = minimum.add(vl.subtract(TWO)).divide(vl);
		start = start.max(ONE);
		for (BigInteger n = start.multiply(vl).add(ONE); ; n = n.add(vl)) {
			if (isPrime(n))
				return n;
		}
	}
	
	
	public static BigInteger findGenerator(BigInteger totient, BigInteger mod) {
		if (totient.compareTo(ONE) < 0 || totient.compareTo(mod) >= 0)
			throw new IllegalArgumentException();
		for (BigInteger i = ONE; i.compareTo(mod) < 0; i = i.add(ONE)) {
			if (isGenerator(i, totient, mod))
				return i;
		}
		throw new ArithmeticException("No generator exists");
	}
	
	
	public static BigInteger findPrimitiveRoot(BigInteger degree, BigInteger totient, BigInteger mod) {
		if (degree.compareTo(ONE) < 0 || degree.compareTo(totient) > 0
				|| totient.compareTo(mod) >= 0 || totient.mod(degree).signum() != 0)
			throw new IllegalArgumentException();
		BigInteger gen = findGenerator(totient, mod);
		return gen.modPow(totient.divide(degree), mod);
	}
	
	
	public static boolean isGenerator(BigInteger val, BigInteger totient, BigInteger mod) {
		if (val.signum() == -1 || val.compareTo(mod) >= 0)
			throw new IllegalArgumentException();
		if (totient.compareTo(ONE) < 0 || totient.compareTo(mod) >= 0)
			throw new IllegalArgumentException();
		
		if (!val.modPow(totient, mod).equals(ONE))
			return false;
		for (BigInteger p : uniquePrimeFactors(totient)) {
			if (val.modPow(totient.divide(p), mod).equals(ONE))
				return false;
		}
		return true;
	}
	
	
	public static boolean isPrimitiveRoot(BigInteger val, BigInteger degree, BigInteger mod) {
		if (val.signum() == -1 || val.compareTo(mod) >= 0)
			throw new IllegalArgumentException();
		if (degree.compareTo(ONE) < 0 || degree.compareTo(mod) >= 0)
			throw new IllegalArgumentException();
		
		if (!val.modPow(degree, mod).equals(ONE))
			return false;
		for (BigInteger p : uniquePrimeFactors(degree)) {
			if (val.modPow(degree.divide(p), mod).equals(ONE))
				return false;
		}
		return true;
	}
	
	
	
	/*---- Low-level common number theory functions ----*/
	
	public static List<BigInteger> uniquePrimeFactors(BigInteger n) {
		if (n.compareTo(ONE) < 0)
			throw new IllegalArgumentException();
		List<BigInteger> result = new ArrayList<>();
		for (BigInteger i = TWO, end = sqrt(n); i.compareTo(end) <= 0; i = i.add(ONE)) {
			if (n.mod(i).signum() == 0) {
				n = n.divide(i);
				result.add(i);
				while (n.mod(i).signum() == 0)
					n = n.divide(i);
				end = sqrt(n);
			}
		}
		if (n.compareTo(ONE) > 0)
			result.add(n);
		return result;
	}
	
	
	public static boolean isPrime(BigInteger n) {
		if (n.compareTo(ONE) <= 0)
			throw new IllegalArgumentException();
		if (!n.isProbablePrime(10))
			return false;
		if (!n.testBit(0))
			return n.equals(TWO);
		for (BigInteger i = BigInteger.valueOf(3), end = sqrt(n);
				i.compareTo(end) <= 0; i = i.add(TWO)) {
			if (n.mod(i).signum() == 0)
				return false;
		}
		return true;
	}
	
	
	public static BigInteger sqrt(BigInteger x) {
		if (x.signum() == -1)
			throw new IllegalArgumentException();
		BigInteger y = BigInteger.ZERO;
		for (int i = (x.bitLength() - 1) / 2; i >= 0; i--) {
			y = y.setBit(i);
			if (y.multiply(y).compareTo(x) > 0)
				y = y.clearBit(i);
		}
		return y;
	}
	
	
	private static final BigInteger ONE = BigInteger.valueOf(1);
	private static final BigInteger TWO = BigInteger.valueOf(2);
	
}
