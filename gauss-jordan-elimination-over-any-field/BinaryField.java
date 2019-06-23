/* 
 * Gauss-Jordan elimination over any field (Java)
 * 
 * Copyright (c) 2019 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gauss-jordan-elimination-over-any-field
 */

import java.math.BigInteger;
import java.util.Objects;


/**
 * A Galois field of the form GF(2<sup><var>n</var></sup>/<var>mod</var>). Each element of this kind of
 * field is a polynomial of degree less than <var>n</var> where each monomial coefficient is either 0 or 1.
 * Both the field and the elements are immutable and thread-safe.
 */
public final class BinaryField extends Field<BigInteger> {
	
	/*---- Fields ----*/
	
	/**
	 * The modulus of this field represented as a string of bits in natural order.
	 * For example, the modulus <var>x</var>^5 + <var>x</var>^1 + <var>x</var>^0
	 * is represented by the integer value 0b100011 (binary) or 35 (decimal).
	 */
	public final BigInteger modulus;
	
	
	
	/*---- Constructor ----*/
	
	/**
	 * Constructs a binary field with the specified modulus. The modulus must have
	 * degree at least 1. Also the modulus must be irreducible (not factorable)
	 * in Z<sub>2</sub>, but this critical property is not checked by the constructor.
	 * @param mod the modulus polynomial
	 * @throws NullPointerException if the modulus is {@code null}
	 * @throws IllegalArgumentException if the modulus has degree less than 1
	 */
	public BinaryField(BigInteger mod) {
		Objects.requireNonNull(mod);
		if (mod.compareTo(BigInteger.ONE) <= 0)
			throw new IllegalArgumentException("Invalid modulus");
		modulus = mod;
	}
	
	
	
	/*---- Methods ----*/
	
	public BigInteger zero() {
		return BigInteger.ZERO;
	}
	
	public BigInteger one() {
		return BigInteger.ONE;
	}
	
	
	public boolean equals(BigInteger x, BigInteger y) {
		return check(x).equals(check(y));
	}
	
	public BigInteger negate(BigInteger x) {
		return check(x);
	}
	
	public BigInteger add(BigInteger x, BigInteger y) {
		return check(x).xor(check(y));
	}
	
	public BigInteger subtract(BigInteger x, BigInteger y) {
		return add(x, y);
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
	
	
	public BigInteger reciprocal(BigInteger w) {
		// Extended Euclidean GCD algorithm
		BigInteger x = modulus;
		BigInteger y = check(w);
		if (y.equals(BigInteger.ZERO))
			throw new ArithmeticException("Division by zero");
		BigInteger a = BigInteger.ZERO;
		BigInteger b = BigInteger.ONE;
		while (y.signum() != 0) {
			BigInteger[] quotrem = divideAndRemainder(x, y);
			if (quotrem[0].equals(modulus))
				quotrem[0] = BigInteger.ZERO;
			BigInteger c = a.xor(multiply(quotrem[0], b));
			x = y;
			y = quotrem[1];
			a = b;
			b = c;
		}
		if (x.equals(BigInteger.ONE))
			return a;
		else  // All non-zero values must have a reciprocal
			throw new IllegalStateException("Field modulus is not irreducible");
	}
	
	
	// Returns a new array containing the pair of values (x div y, x mod y).
	private BigInteger[] divideAndRemainder(BigInteger x, BigInteger y) {
		BigInteger quotient = BigInteger.ZERO;
		int topY = y.bitLength() - 1;
		for (int i = x.bitLength() - y.bitLength(); i >= 0; i--) {
			if (x.testBit(topY + i)) {
				x = x.xor(y.shiftLeft(i));
				quotient = quotient.setBit(i);
			}
		}
		return new BigInteger[]{quotient, x};
	}
	
	
	// Checks if the given object is non-null and within the
	// range of valid values, and returns the value itself.
	private BigInteger check(BigInteger x) {
		Objects.requireNonNull(x);
		if (x.signum() == -1 || x.bitLength() >= modulus.bitLength())
			throw new IllegalArgumentException("Not an element of this field");
		return x;
	}
	
}
