/* 
 * JSON library
 * 
 * Copyright (c) 2015 Project Nayuki
 * http://www.nayuki.io/page/json-library-java
 * 
 * (MIT License)
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */

package io.nayuki.json;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.regex.Pattern;


/**
 * Represents a number parsed from JSON as a string, providing methods to convert to other number types.
 * <p>Examples of valid number strings: 0, 1, 93, -0, -2, 4.56, 8e9, 8e+9, 8e-9, -8.00e+99<br>
 * Examples of invalid number strings: +5, 01, .33, --1, 0x10, 10h, e2, 1/2</p>
 * <p>Note: For implementation simplicity, the integer conversion methods will throw an exception if the
 * number string contains a decimal point or exponent (such as 123.00 or 123e0), even if the actual value
 * represents an integer. The string must be in integer syntax (such as 123) in order to succeed.</p>
 */
public final class JsonNumber extends Number {
	
	/*---- Fields ----*/
	
	// The verbatim string from the JSON text, which is at full precision.
	private final String rawValue;
	
	
	
	/*---- Constructors ----*/
	
	/**
	 * Constructs a JSON number wrapper around the specified string.
	 * @param s the number string
	 * @throws IllegalArgumentException if the string does not match the JSON number syntax
	 * @throws NullPointerException if the string is {@code null}
	 */
	public JsonNumber(String s) {
		if (s == null)
			throw new NullPointerException();
		if (!SYNTAX.matcher(s).matches())
			throw new IllegalArgumentException("Invalid number syntax");
		rawValue = s;
	}
	
	
	
	/*---- Conversion methods ----*/
	
	/**
	 * Returns this number string parsed in base 10 as an 8-bit signed integer.
	 * @return this number parsed as a {@code byte}
	 * @throws NumberFormatException if this number string does not satisfy the syntax or range of {@code byte}
	 */
	public byte byteValue() {
		return Byte.parseByte(rawValue);
	}
	
	
	/**
	 * Returns this number string parsed in base 10 as a 16-bit signed integer.
	 * @return this number parsed as a {@code short}
	 * @throws NumberFormatException if this number string does not satisfy the syntax or range of {@code short}
	 */
	public short shortValue() {
		return Short.parseShort(rawValue);
	}
	
	
	/**
	 * Returns this number string parsed in base 10 as a 32-bit signed integer.
	 * @return this number parsed as a {@code int}
	 * @throws NumberFormatException if this number string does not satisfy the syntax or range of {@code int}
	 */
	public int intValue() {
		return Integer.parseInt(rawValue);
	}
	
	
	/**
	 * Returns this number string parsed in base 10 as a 64-bit signed integer.
	 * @return this number parsed as a {@code long}
	 * @throws NumberFormatException if this number string does not satisfy the syntax or range of {@code long}
	 */
	public long longValue() {
		return Long.parseLong(rawValue);
	}
	
	
	/**
	 * Returns this number string parsed in base 10 as a 32-bit floating-point number.
	 * The result may be normal, subnormal, or infinite, but not NaN. The result is correctly rounded. Does not throw an exception.
	 * @return this number parsed as a {@code float}
	 */
	public float floatValue() {
		return Float.parseFloat(rawValue);
	}
	
	
	/**
	 * Returns this number string parsed in base 10 as a 64-bit floating-point number.
	 * The result may be normal, subnormal, or infinite, but not NaN. The result is correctly rounded. Does not throw an exception.
	 * @return this number parsed as a {@code double}
	 */
	public double doubleValue() {
		return Double.parseDouble(rawValue);
	}
	
	
	/**
	 * Returns this number string parsed in base 10 as an arbitrary-precision signed integer.
	 * @return this number parsed as a {@code BigInteger}
	 * @throws NumberFormatException if this number string does not satisfy the syntax of an integer
	 */
	public BigInteger bigIntegerValue() {
		return new BigInteger(rawValue);
	}
	
	
	/**
	 * Returns this number string parsed in base 10 as an arbitrary-precision decimal floating-point number. The result is exact
	 * and incurs no rounding. Does not throw an exception unless the exponent is unreasonably large (beyond +/- 2 billion).
	 * @return this number parsed as a {@code BigDecimal}
	 */
	public BigDecimal bigDecimalValue() {
		String[] parts = rawValue.split("[eE]");
		BigDecimal result = new BigDecimal(parts[0]);
		if (parts.length == 2)
			result = result.movePointRight(Integer.parseInt(parts[1]));
		return result;
	}
	
	
	/*---- General methods ----*/
	
	/**
	 * Tests whether this object is equal to the specified one. This method returns {@code true} if and
	 * only if the other object is a {@code JsonNumber} with the same string contents. It does not try
	 * to compare with other {@code Number} types or check semantic equality (such as 123 vs. 123.00e0).
	 * @param obj the object to test equality with
	 * @return whether the other object is a {@code JsonNumber} with the same number string as this object's string
	 */
	public boolean equals(Object obj) {
		if (!(obj instanceof JsonNumber))
			return false;
		return rawValue.equals(((JsonNumber)obj).rawValue);
	}
	
	
	/**
	 * Returns the hash code of this object in a way consistent with {@code equals()}.
	 * @return the hash code of this object
	 */
	public int hashCode() {
		return rawValue.hashCode();
	}
	
	
	/**
	 * Returns the raw string value of this number. The string satisfies the JSON number syntax.
	 * @return the raw string value of this number
	 */
	public String toString() {
		return rawValue;
	}
	
	
	
	/*---- Constants ----*/
	
	// The regular expression that every JSON number string must match.
	static Pattern SYNTAX = Pattern.compile("-?(?:0|[1-9]\\d*)(?:\\.\\d+)?(?:[eE][+-]?\\d+)?");
	
}
