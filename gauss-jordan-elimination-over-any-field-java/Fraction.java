/* 
 * Gauss-Jordan elimination over any field (Java)
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gauss-jordan-elimination-over-any-field-java
 */

import java.math.BigInteger;


public final class Fraction implements Comparable<Fraction> {
	
	// Always coprime with the denominator.
	public final BigInteger numerator;
	
	// Always greater than zero.
	public final BigInteger denominator;
	
	
	
	public Fraction(int num, int den) {
		this(BigInteger.valueOf(num), BigInteger.valueOf(den));
	}
	
	
	public Fraction(BigInteger num, BigInteger den) {
		if (den.signum() == 0)
			throw new IllegalArgumentException("Zero denominator");
		
		// Simplify the fraction to the canonical form
		if (den.signum() == -1) {
			num = num.negate();
			den = den.negate();
		}
		BigInteger gcd = num.gcd(den);
		if (!gcd.equals(BigInteger.ONE)) {
			num = num.divide(gcd);
			den = den.divide(gcd);
		}
		numerator = num;
		denominator = den;
	}
	
	
	public Fraction(double x) {
		long bits = Double.doubleToRawLongBits(x);
		boolean negative = (bits >>> 63) != 0;
		int exponent = (int)((bits >>> 52) & 0x7FF);
		long mantissa = bits & 0xFFFFFFFFFFFFFL;
		
		if (exponent == 0x7FF)
			throw new IllegalArgumentException("Infinity or NaN");
		if (exponent > 0x000)  // Normal number
			mantissa |= 0x10000000000000L;
		else  // Subnormal number
			exponent++;
		
		if (negative)
			mantissa = -mantissa;
		
		exponent -= 0x3FF;  // De-bias
		if (exponent >= 52) {
			numerator = BigInteger.valueOf(mantissa).shiftLeft(exponent - 52);
			denominator = BigInteger.ONE;
		} else {
			BigInteger num = BigInteger.valueOf(mantissa);
			BigInteger den = BigInteger.ONE.shiftLeft(52 - exponent);
			BigInteger gcd = num.gcd(den);
			numerator = num.divide(gcd);
			denominator = den.divide(gcd);
		}
	}
	
	
	
	public boolean equals(Object obj) {
		if (!(obj instanceof Fraction))
			return false;
		Fraction other = (Fraction)obj;
		return numerator.equals(other.numerator) && denominator.equals(other.denominator);
	}
	
	
	public int hashCode() {
		return numerator.hashCode() + denominator.hashCode();
	}
	
	
	public int compareTo(Fraction other) {
		return numerator.multiply(other.denominator).compareTo(other.numerator.multiply(denominator));
	}
	
	
	public String toString() {
		return String.format("%d/%d", numerator, denominator);
	}
	
}
