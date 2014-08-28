/* 
 * Gauss-Jordan elimination over any field (Java)
 * 
 * Copyright (c) 2014 Nayuki Minase
 * All rights reserved. Contact Nayuki for licensing.
 * http://nayuki.eigenstate.org/page/gauss-jordan-elimination-over-any-field-java
 */


/**
 * The pseudo-field of double-precision floating-point numbers. This is not a true field!
 * <p>Calculations are subject to errors due to rounding, overflow, and underflow.
 * But the results for typical calculations will be near the true result, which is why this class is provided.</p>
 */
public final class Float64Field extends Field<Double> {
	
	/**
	 * The singleton instance of this field.
	 */
	public static Float64Field FIELD = new Float64Field();
	
	
	public Double zero() {
		return 0.0;
	}
	
	public Double one() {
		return 1.0;
	}
	
	
	public Double add(Double x, Double y) {
		return x + y;
	}
	
	public Double multiply(Double x, Double y) {
		return x * y;
	}
	
	
	public Double negate(Double x) {
		return -x;
	}
	
	public Double reciprocal(Double x) {
		if (x == 0)
			throw new ArithmeticException("Reciprocal of zero");
		return 1 / x;
	}
	
	
	public Double subtract(Double x, Double y) {
		return x - y;
	}
	
	public Double divide(Double x, Double y) {
		if (y == 0)
			throw new ArithmeticException("Division by zero");
		return x / y;
	}
	
	
	public boolean equals(Double x, Double y) {
		return x.equals(y);
	}
	
}
