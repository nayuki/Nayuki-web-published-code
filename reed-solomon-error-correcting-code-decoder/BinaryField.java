/* 
 * Reed-Solomon error-correcting code decoder
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/reed-solomon-error-correcting-code-decoder
 */


/**
 * A Galois field of the form GF(2^n/mod). Each element of this kind of field is a
 * polynomial of degree less than n where each monomial coefficient is either 0 or 1.
 * Both the field and the elements are immutable and thread-safe.
 */
public final class BinaryField extends Field<Integer> {
	
	/*---- Fields ----*/
	
	/**
	 * The modulus of this field represented as a string of bits in natural order.
	 * For example, the modulus x^5 + x^1 + x^0 is represented by the integer value 0b100011 (binary) or 35 (decimal).
	 */
	public final int modulus;
	
	
	/**
	 * The number of (unique) elements in this field. It is a positive power of 2, e.g. 2, 4, 8, 16, etc.
	 * The size of the field is equal to 2 to the power of the degree of the modulus.
	 */
	public final int size;
	
	
	
	/*---- Constructor ----*/
	
	/**
	 * Constructs a binary field with the specified modulus. The modulus must have degree
	 * between 1 and 30, inclusive. Also the modulus must be irreducible (not factorable)
	 * in Z_2, but this critical property is not checked by the constructor.
	 * @param mod the modulus
	 */
	public BinaryField(int mod) {
		if (mod == 0)
			throw new IllegalArgumentException("Division by zero");
		if (mod == 1)
			throw new IllegalArgumentException("Degenerate field");
		if (mod < 0)
			throw new IllegalArgumentException("Modulus too large");
		int degree = 31 - Integer.numberOfLeadingZeros(mod);
		modulus = mod;
		size = 1 << degree;
	}
	
	
	
	/*---- Methods ----*/
	
	// Checks if the given object is non-null and within the range
	// of valid values, and returns the unboxed primitive value.
	private int check(Integer x) {
		if (x == null)
			throw new NullPointerException();
		int y = x.intValue();
		if (y < 0 || y >= size)
			throw new IllegalArgumentException("Not an element of this field: " + y);
		return y;
	}
	
	
	public boolean equals(Integer x, Integer y) {
		return check(x) == check(y);
	}
	
	
	public Integer zero() {
		return 0;
	}
	
	
	public Integer one() {
		return 1;
	}
	
	
	public Integer negate(Integer x) {
		return check(x);
	}
	
	
	public Integer add(Integer x, Integer y) {
		return check(x) ^ check(y);
	}
	
	
	public Integer subtract(Integer x, Integer y) {
		return add(x, y);
	}
	
	
	public Integer multiply(Integer x, Integer y) {
		return multiply(check(x), check(y));
	}
	
	
	private int multiply(int x, int y) {
		int result = 0;
		for (; y != 0; y >>>= 1) {
			if ((y & 1) != 0)
				result ^= x;
			x <<= 1;
			if (x >= size)
				x ^= modulus;
		}
		return result;
	}
	
	
	public Integer reciprocal(Integer w) {
		// Extended Euclidean GCD algorithm
		int x = modulus;
		int y = check(w);
		if (y == 0)
			throw new ArithmeticException("Division by zero");
		int a = 0;
		int b = 1;
		while (y != 0) {
			int[] quotrem = divideAndRemainder(x, y);
			int z = quotrem[1];
			int c = a ^ multiply(quotrem[0], b);
			x = y;
			y = z;
			a = b;
			b = c;
		}
		if (x == 1)
			return a;
		else  // All non-zero values must have a reciprocal
			throw new AssertionError("Modulus is not irreducible");
	}
	
	
	// Returns a new array containing the pair of values (x div y, x mod y).
	private static int[] divideAndRemainder(int x, int y) {
		int quotient = 0;
		for (int i = Integer.numberOfLeadingZeros(y) - Integer.numberOfLeadingZeros(x); i >= 0; i--) {
			if (Integer.highestOneBit(x) == Integer.highestOneBit(y << i)) {
				x ^= y << i;
				quotient |= 1 << i;
			}
		}
		return new int[]{quotient, x};
	}
	
}
