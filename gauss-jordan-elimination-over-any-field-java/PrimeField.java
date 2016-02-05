/* 
 * Gauss-Jordan elimination over any field (Java)
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gauss-jordan-elimination-over-any-field-java
 */


/**
 * The field of integers modulo a prime number.
 * For a given size, the valid elements of the field are the set of integers in the range [0, size).
 */
public final class PrimeField extends Field<Integer> {
	
	/**
	 * The number of elements in this finite field. Must be positive and prime.
	 */
	public final int size;
	
	
	/**
	 * Constructs a finite field of the specified size.
	 * The size must be a prime number, but this requirement is not checked.
	 * @param size the size of this finite field
	 * @throws IllegalArgumentException if {@code size} &lt; 2
	 */
	public PrimeField(int size) {
		if (size < 2)
			throw new IllegalArgumentException("Invalid field size");
		this.size = size;
	}
	
	
	public Integer zero() {
		return 0;
	}
	
	public Integer one() {
		return 1;
	}
	
	
	public Integer add(Integer x, Integer y) {
		return (int)(((long)check(x) + check(y)) % size);
	}
	
	public Integer multiply(Integer x, Integer y) {
		return (int)((long)check(x) * check(y) % size);
	}
	
	
	public Integer negate(Integer x) {
		return (size - check(x)) % size;
	}
	
	
	public Integer reciprocal(Integer x) {
		if (x == 0)
			throw new ArithmeticException("Reciprocal of zero");
		
		// Extended Euclidean algorithm
		int f = size;
		int g = check(x);
		int a = 0;
		int b = 1;
		while (g != 0) {
			int h = f % g;
			int c = a - f / g * b;
			f = g;
			g = h;
			a = b;
			b = c;
		}
		if (f == 1)
			return (int)(((long)a + size) % size);
		else
			throw new IllegalArgumentException("Field size is not prime");
	}
	
	
	public boolean equals(Integer x, Integer y) {
		return check(x) == check(y);
	}
	
	
	// Returns the same value if it's within the range [0, size); otherwise throws an exception.
	private int check(Integer x) {
		int y = x;
		if (y < 0 || y >= size)
			throw new IllegalArgumentException("Not an element of this field: " + x);
		return y;
	}
	
}
