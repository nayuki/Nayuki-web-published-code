/* 
 * Approximating Euler's number correctly (Java)
 * 
 * Copyright (c) 2014 Nayuki Minase
 * All rights reserved. Contact Nayuki for licensing.
 * http://nayuki.eigenstate.org/page/approximating-eulers-number-correctly
 */

import java.math.BigInteger;


public class ApproximateEFraction {
	
	// Runs a demo that prints out some numbers
	public static void main(String[] args) {
		// Print e rounded to n decimal places, for n from 0 to 60
		for (int i = 0; i <= 60; i++)
			System.out.println(computeEulersNumber(i));
		System.out.println();
		
		// Compute 1 to 3000 decimal places (exponentially increasing) and print timing
		int prev = 0;
		for (int i = 0; i <= 70; i++) {
			int digits = (int)Math.round(Math.pow(10, i / 20.0));
			if (digits == prev)
				continue;
			prev = digits;
			
			long startTime = System.nanoTime();
			computeEulersNumber(digits);
			long time = System.nanoTime() - startTime;
			System.out.printf("%6d  %7.3f s%n", digits, time / 1000000000.0);
		}
	}
	
	
	// For example: computeEulersNumber(4) = "2.7183"
	private static String computeEulersNumber(int accuracy) {
		if (accuracy < 0)  // Number of digits after decimal point
			throw new IllegalArgumentException();
		
		Fraction sum = new Fraction(BigInteger.ZERO, BigInteger.ONE);
		BigInteger factorial = BigInteger.ONE;
		final BigInteger errorTarget = BigInteger.TEN.pow(accuracy);
		final Fraction scaler = new Fraction(errorTarget, BigInteger.ONE);
		for (int i = 0; ; i++) {
			Fraction term = new Fraction(BigInteger.ONE, factorial);
			sum = sum.add(term);
			if (i >= 2 && factorial.compareTo(errorTarget) >= 0) {  // i.e. term <= 1/errorTarget
				BigInteger lower = sum.multiply(scaler).roundHalfEven();
				BigInteger upper = sum.add(term).multiply(scaler).roundHalfEven();
				if (lower.equals(upper)) {
					// The number of terms used is i+1
					String s = lower.toString();
					return s.substring(0, s.length() - accuracy) + "." + s.substring(s.length() - accuracy);
				}
			}
			factorial = factorial.multiply(BigInteger.valueOf(i + 1));
		}
	}
	
	
	
	// Immutable unlimited precision fraction
	private static final class Fraction implements Comparable<Fraction> {
		
		public final BigInteger numerator;    // Always coprime with denominator
		public final BigInteger denominator;  // Always positive
		
		
		public Fraction(BigInteger numer, BigInteger denom) {
			if (denom.signum() == 0)
				throw new ArithmeticException("Division by zero");
			
			// Reduce to canonical form
			if (denom.signum() == -1) {
				numer = numer.negate();
				denom = denom.negate();
			}
			BigInteger gcd = numer.gcd(denom);
			if (!gcd.equals(BigInteger.ONE)) {
				numer = numer.divide(gcd);
				denom = denom.divide(gcd);
			}
			
			numerator = numer;
			denominator = denom;
		}
		
		
		public Fraction add(Fraction other) {
			return new Fraction(
				numerator.multiply(other.denominator).add(other.numerator.multiply(denominator)),
				denominator.multiply(other.denominator));
		}
		
		
		public Fraction subtract(Fraction other) {
			return new Fraction(
				numerator.multiply(other.denominator).subtract(other.numerator.multiply(denominator)),
				denominator.multiply(other.denominator));
		}
		
		
		public Fraction multiply(Fraction other) {
			return new Fraction(
				numerator.multiply(other.numerator),
				denominator.multiply(other.denominator));
		}
		
		
		@SuppressWarnings("unused")
		public Fraction divide(Fraction other) {
			return new Fraction(
				numerator.multiply(other.denominator),
				denominator.multiply(other.numerator));
		}
		
		
		public BigInteger roundHalfEven() {
			if (numerator.signum() == -1)
				return new Fraction(numerator.negate(), denominator).roundHalfEven().negate();
			
			BigInteger result = numerator.divide(denominator);
			Fraction error = this.subtract(new Fraction(result, BigInteger.ONE));
			int cmp = error.compareTo(HALF);
			if (cmp > 0 || cmp == 0 && result.testBit(0))
				result = result.add(BigInteger.ONE);
			return result;
		}
		
		
		public boolean equals(Object obj) {
			if (obj instanceof Fraction) {
				Fraction other = (Fraction)obj;
				return numerator.equals(other.numerator) && denominator.equals(other.denominator);
			} else
				return false;
		}
		
		
		public int compareTo(Fraction other) {
			return numerator.multiply(other.denominator).compareTo(other.numerator.multiply(denominator));
		}
		
		
		public int hashCode() {
			return numerator.hashCode() + denominator.hashCode();
		}
		
		
		public String toString() {
			return numerator + "/" + denominator;
		}
		
		
		private static final Fraction HALF = new Fraction(BigInteger.ONE, BigInteger.valueOf(2));
		
	}
	
}
