/* 
 * Gauss-Jordan elimination over any field (Java)
 * Copyright (c) 2013 Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/gauss-jordan-elimination-over-any-field-java
 */


/**
 * A field in abstract algebra. Every field must satisfy all these axioms, where <var>x</var>, <var>y</var>, <var>z</var> are arbitrary elements of the field:
 * <ol>
 *   <li>0 is an element of the field, and 0 + <var>x</var> = <var>x</var>. (Existence of additive identity)</li>
 *   <li>1 is an element of the field, and 1 * <var>x</var> = <var>x</var>. (Existence of multiplicative identity)</li>
 *   <li>0 &ne; 1. (Distinctness of additive and multiplicative identities)</li>
 *   <li><var>x</var> + <var>y</var> = <var>y</var> + <var>x</var>. (Commutativity of addition)</li>
 *   <li><var>x</var> * <var>y</var> = <var>y</var> * <var>x</var>. (Commutativity of multiplication)</li>
 *   <li>(<var>x</var> + <var>y</var>) + <var>z</var> = <var>x</var> + (<var>y</var> + <var>z</var>). (Associativity of addition)</li>
 *   <li>(<var>x</var> * <var>y</var>) * <var>z</var> = <var>x</var> * (<var>y</var> * <var>z</var>). (Associativity of multiplication)</li>
 *   <li><var>x</var> * (<var>y</var> + <var>z</var>) = (<var>x</var> * <var>y</var>) + (<var>x</var> * <var>z</var>). (Distributivity of multiplication over addition)</li>
 *   <li>&minus;<var>x</var> is an element of the field, such that <var>x</var> + (&minus;<var>x</var>) = 0. (Existence of additive inverse)</li>
 *   <li><var>x</var><sup>&minus;1</sup> is an element of the field, such that <var>x</var> * (<var>x</var><sup>&minus;1</sup>) = 1. (Existence of multiplicative inverse)</li>
 * </ol>
 * @param <T> the type of the field's elements
 */
public abstract class Field<T> {
	
	/**
	 * Returns the additive identity of this field.
	 * @return the additive identity of this field
	 */
	public abstract T zero();
	
	/**
	 * Returns the multiplicative identity of this field.
	 * @return the multiplicative identity of this field
	 */
	public abstract T one();
	
	
	/**
	 * Returns the sum of the two specified elements.
	 * @param x an addend
	 * @param y an addend
	 * @return the sum of {@code x} and {@code y}
	 */
	public abstract T add(T x, T y);
	
	/**
	 * Returns the product of the two specified elements.
	 * @param x a multiplicand
	 * @param y a multiplicand
	 * @return the product of {@code x} and {@code y}
	 */
	public abstract T multiply(T x, T y);
	
	/**
	 * Returns the additive inverse of the specified element.
	 * @param x the element whose additive inverse to compute
	 * @return the additive inverse of the specified element
	 */
	public abstract T negate(T x);
	
	/**
	 * Returns the multiplicative inverse of the specified element.
	 * @param x the element whose multiplicative inverse to compute
	 * @return the multiplicative inverse of the specified element
	 * @throws ArithmeticException if {@code x} equals {@code zero()}
	 */
	public abstract T reciprocal(T x);
	
	/**
	 * Returns the first element minus the second element.
	 * @param x the minuend
	 * @param y the subtrahend
	 * @return the first element minus the second element
	 */
	public T subtract(T x, T y) {
		return add(x, negate(y));
	}
	
	/**
	 * Returns the first element divided by the second element.
	 * @param x the dividend
	 * @param y the divisor
	 * @return the first element divided by the second element
	 * @throws ArithmeticException if {@code y} equals {@code zero()}
	 */
	public T divide(T x, T y) {
		return multiply(x, reciprocal(y));
	}
	
	
	/**
	 * Tests whether the two specified elements are equal.
	 * Note that the elements are not required to implement their own {@code equals()} correctly &ndash; {@code x.equals(y)} can mismatch {@code f.equals(x, y)}.
	 * @param x an element to test for equality
	 * @param y an element to test for equality
	 * @return {@code true} if the two specified elements are equal, {@code false} otherwise
	 */
	public abstract boolean equals(T x, T y);
	
}
