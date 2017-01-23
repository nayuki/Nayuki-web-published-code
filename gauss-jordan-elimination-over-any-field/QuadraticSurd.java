/* 
 * Gauss-Jordan elimination over any field (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gauss-jordan-elimination-over-any-field
 */

import java.math.BigInteger;


// Represents the numerical value (a + b * sqrt(d)) / c.
// d must not be divisible by k^2 for some k > 1. d can be negative.
public class QuadraticSurd {
	
	// Invariants: gcd(a, b, c) = 1, and c > 0.
	public final BigInteger a, b, c, d;
	
	
	public QuadraticSurd(BigInteger a, BigInteger b, BigInteger c, BigInteger d) {
		if (c.signum() == 0)
			throw new IllegalArgumentException("Division by zero");
		
		// Simplify
		if (c.signum() == -1) {
			a = a.negate();
			b = b.negate();
			c = c.negate();
		}
		BigInteger gcd = a.gcd(b).gcd(c);
		if (!gcd.equals(BigInteger.ONE)) {
			a = a.divide(gcd);
			b = b.divide(gcd);
			c = c.divide(gcd);
		}
		
		this.a = a;
		this.b = b;
		this.c = c;
		this.d = d;
	}
	
	
	public boolean equals(Object obj) {
		if (!(obj instanceof QuadraticSurd))
			return false;
		else {
			QuadraticSurd other = (QuadraticSurd)obj;
			return a.equals(other.a) && b.equals(other.b) && c.equals(other.c) && d.equals(other.d);
		}
	}
	
	
	public int hashCode() {
		return a.hashCode() + b.hashCode() + c.hashCode() + d.hashCode();
	}
	
	
	public String toString() {
		return String.format("(%d + %d*sqrt(%d)) / %d", a, b, d, c);
	}
	
}
