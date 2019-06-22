/* 
 * Gauss-Jordan elimination over any field (Java)
 * 
 * Copyright (c) 2019 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gauss-jordan-elimination-over-any-field
 */


/**
 * The field of rational numbers (fractions).
 */
public final class RationalField extends Field<Fraction> {
	
	/*---- Constants ----*/
	
	/**
	 * The singleton instance of this field.
	 */
	public static RationalField FIELD = new RationalField();
	
	
	private static Fraction ZERO = new Fraction(0, 1);
	private static Fraction ONE  = new Fraction(1, 1);
	
	
	
	/*---- Methods ----*/
	
	public Fraction zero() {
		return ZERO;
	}
	
	public Fraction one() {
		return ONE;
	}
	
	
	public boolean equals(Fraction x, Fraction y) {
		return x.numerator.equals(y.numerator) && x.denominator.equals(y.denominator);
	}
	
	
	public Fraction negate(Fraction x) {
		return new Fraction(x.numerator.negate(), x.denominator);
	}
	
	
	public Fraction add(Fraction x, Fraction y) {
		return new Fraction(
			x.numerator.multiply(y.denominator).add(y.numerator.multiply(x.denominator)),
			x.denominator.multiply(y.denominator));
	}
	
	
	public Fraction multiply(Fraction x, Fraction y) {
		return new Fraction(
			x.numerator.multiply(y.numerator),
			x.denominator.multiply(y.denominator));
	}
	
	
	public Fraction reciprocal(Fraction x) {
		if (x.denominator.signum() == 0)
			throw new ArithmeticException("Reciprocal of zero");
		return new Fraction(x.denominator, x.numerator);
	}
	
}
