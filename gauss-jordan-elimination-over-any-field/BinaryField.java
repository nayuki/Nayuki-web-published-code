/* 
 * Gauss-Jordan elimination over any field (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gauss-jordan-elimination-over-any-field
 */

import java.math.BigInteger;


/**
 * Fields where each value is a polynomial with binary coefficients modulo an irreducible polynomial.
 */
public final class BinaryField extends Field<BigInteger> {
	
	public final BigInteger modulus;
	
	
	/**
	 * Constructs a binary field with the specified modulus. The modulus must be irreducible (not factorable)
	 * in Z<sub>2</sub>, but this critical property is not checked by the constructor.
	 * @param mod the modulus polynomial
	 * @throws NullPointerException if the modulus is {@code null}
	 * @throws IllegalArgumentException if the modulus has degree less than 1
	 */
	public BinaryField(BigInteger mod) {
		if (mod == null)
			throw new NullPointerException();
		if (mod.signum() == -1)
			throw new IllegalArgumentException("Invalid modulus polynomial");
		if (mod.bitLength() <= 1)
			throw new IllegalArgumentException("Modulus polynomial must have degree at least 1");
		modulus = mod;
	}
	
	
	public boolean equals(BigInteger x, BigInteger y) {
		return check(x).equals(check(y));
	}
	
	
	public BigInteger zero() {
		return BigInteger.ZERO;
	}
	
	
	public BigInteger one() {
		return BigInteger.ONE;
	}
	
	
	public BigInteger negate(BigInteger x) {
		return check(x);
	}
	
	
	public BigInteger add(BigInteger x, BigInteger y) {
		return check(x).xor(check(y));
	}
	
	
	public BigInteger multiply(BigInteger x, BigInteger y) {
		check(x);
		check(y);
		BigInteger result = BigInteger.ZERO;
		for (int i = 0; i < y.bitLength(); i++) {
			if (y.testBit(i))
				result = result.xor(x);
			x = x.shiftLeft(1);
			if (x.testBit(modulus.bitLength() - 1))
				x = x.xor(modulus);
		}
		return result;
	}
	
	
	public BigInteger reciprocal(BigInteger x) {
		// Extended Euclidean GCD algorithm
		BigInteger y = check(x);
		if (x.equals(BigInteger.ZERO))
			throw new ArithmeticException("Division by zero");
		x = modulus;
		BigInteger a = BigInteger.ZERO;
		BigInteger b = BigInteger.ONE;
		while (y.signum() != 0) {
			BigInteger[] qr = divideAndRemainder(x, y);
			if (qr[0].testBit(modulus.bitLength() - 1))
				qr[0] = qr[0].xor(modulus);
			x = y;
			y = qr[1];
			BigInteger temp = a.xor(multiply(qr[0], b));
			a = b;
			b = temp;
		}
		if (x.equals(BigInteger.ONE))
			return a;
		else  // All non-zero values must have a reciprocal
			throw new IllegalStateException("Modulus is not irreducible");
	}
	
	
	private BigInteger[] divideAndRemainder(BigInteger x, BigInteger y) {
		BigInteger quotient = BigInteger.ZERO;
		for (int i = x.bitLength() - y.bitLength(); i >= 0; i--) {
			if (x.bitLength() == y.bitLength() + i) {
				x = x.xor(y.shiftLeft(i));
				quotient = quotient.setBit(i);
			}
		}
		return new BigInteger[]{quotient, x};
	}
	
	
	private BigInteger check(BigInteger x) {
		if (x == null)
			throw new NullPointerException();
		if (x.signum() == -1 || x.bitLength() >= modulus.bitLength())
			throw new IllegalArgumentException("Not an element of this field");
		return x;
	}
	
}
