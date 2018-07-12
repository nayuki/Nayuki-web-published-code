/* 
 * Gauss-Jordan elimination over any field (Java)
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gauss-jordan-elimination-over-any-field
 */

import java.math.BigInteger;
import java.util.Objects;


/**
 * Fields based on the square root of an integer.
 */
public final class QuadraticSurdField extends Field<QuadraticSurd> {
	
	/**
	 * The value under the square root. All arguments and return values must have {@code d} equal to this value. Not null.
	 */
	public final BigInteger d;
	
	
	/**
	 * Constructs a quadratic surd field with the specified number under the square root.
	 * The value {@code d} must be square-free (not divisible by k^2 for some k > 1). The square-free requirement
	 * is not checked. {@code d} can be negative, in which case the values represent complex numbers.
	 * @param d the number under the square root (not {@code null})
	 * @throws NullPointerException if {@code d} is {@code null}
	 */
	public QuadraticSurdField(BigInteger d) {
		Objects.requireNonNull(d);
		this.d = d;
	}
	
	
	public boolean equals(QuadraticSurd x, QuadraticSurd y) {
		check(x);
		check(y);
		return x.equals(y);
	}
	
	
	public QuadraticSurd zero() {
		return new QuadraticSurd(BigInteger.ZERO, BigInteger.ZERO, BigInteger.ONE, d);
	}
	
	
	public QuadraticSurd one() {
		return new QuadraticSurd(BigInteger.ONE, BigInteger.ZERO, BigInteger.ONE, d);
	}
	
	
	public QuadraticSurd negate(QuadraticSurd x) {
		check(x);
		return new QuadraticSurd(x.a.negate(), x.b.negate(), x.c, x.d);
	}
	
	
	public QuadraticSurd add(QuadraticSurd x, QuadraticSurd y) {
		return new QuadraticSurd(
			x.a.multiply(y.c).add(y.a.multiply(x.c)),
			x.b.multiply(y.c).add(y.b.multiply(x.c)),
			x.c.multiply(y.c), d);
	}
	
	
	public QuadraticSurd reciprocal(QuadraticSurd x) {
		return new QuadraticSurd(
			x.a.multiply(x.c).negate(), x.b.multiply(x.c),
			x.b.multiply(x.b).multiply(d).subtract(x.a.multiply(x.a)), d);
	}
	
	
	public QuadraticSurd multiply(QuadraticSurd x, QuadraticSurd y) {
		return new QuadraticSurd(
			x.a.multiply(y.a).add(x.b.multiply(y.b).multiply(d)),
			x.a.multiply(y.b).add(y.a.multiply(x.b)), x.c.multiply(y.c), d);
	}
	
	
	private void check(QuadraticSurd x) {
		Objects.requireNonNull(x);
		if (!x.d.equals(d))
			throw new IllegalArgumentException("The value under the square root must match that of the field");
	}
	
}
