/* 
 * Factorize Gaussian integer (Java)
 * 
 * Run this program with a single argument containing the complex number to be factorized. Examples:
 * - Command line: java FactorizeGaussianInteger "-1"
 *   Output: (-1)
 * - Command line: java FactorizeGaussianInteger "2"
 *   Output: (-1i)(1 + 1i)(1 + 1i)
 * - Command line: java FactorizeGaussianInteger "7"
 *   Output: (7)
 * - Command line: java FactorizeGaussianInteger "5 + 9i"
 *   Output: (1 + 1i)(7 + 2i)
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/factorize-gaussian-integer-javascript
 */

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


public final class FactorizeGaussianInteger {
	
	public static void main(String[] args) {
		GaussianInteger num = new GaussianInteger(args[0]);
		List<GaussianInteger> factorization = num.factorize();
		for (GaussianInteger factor : factorization)
			System.out.print("(" + factor.toString() + ")");
		System.out.println();
	}
	
}



// Immutable complex number where real and imag are integers, and (0 <= real, imag < 2^31).
final class GaussianInteger {
	
	/* Fields */
	
	public final int real;
	public final int imag;
	
	
	
	/* Constructors */
	
	public GaussianInteger(int real, int imag) {
		if (real == Integer.MIN_VALUE || imag == Integer.MIN_VALUE)
			throw new IllegalArgumentException("Value out of range");
		this.real = real;
		this.imag = imag;
	}
	
	
	private GaussianInteger(long real, long imag) {
		if (real <= Integer.MIN_VALUE || real > Integer.MAX_VALUE ||
		    imag <= Integer.MIN_VALUE || imag > Integer.MAX_VALUE)
			throw new IllegalArgumentException("Value out of range");
		this.real = (int)real;
		this.imag = (int)imag;
	}
	
	
	public GaussianInteger(String s) {
		// Spaces are not allowed between digits. Otherwise remove all whitespace as preprocessing.
		if (WHITESPACE_BETWEEN_DIGITS_REGEX.matcher(s).matches())
			throw new IllegalArgumentException("Invalid number");
		s = WHITESPACE_REGEX.matcher(s).replaceAll("");
		
		// Match one of the syntax cases
		Matcher m;
		if ((m = REAL_REGEX.matcher(s)).matches()) {  // e.g. 1, +0, -2
			real = Integer.parseInt(m.group(1));
			imag = 0;
		} else if ((m = IMAG_REGEX.matcher(s)).matches()) {  // e.g. i, 4i, -3i
			real = 0;
			imag = Integer.parseInt(m.group(1) + (m.group(2).equals("") ? "1" : m.group(2)));
		} else if ((m = REAL_IMAG_REGEX.matcher(s)).matches()) {  // e.g. 1+2i, -3-4i, +5+i
			real = Integer.parseInt(m.group(1));
			imag = Integer.parseInt(m.group(2) + (m.group(3).equals("") ? "1" : m.group(3)));
		} else if ((m = IMAG_REAL_REGEX.matcher(s)).matches()) {  // e.g. 2i+1, -4i-3, +i+5
			real = Integer.parseInt(m.group(3));
			imag = Integer.parseInt(m.group(1) + (m.group(2).equals("") ? "1" : m.group(2)));
		} else
			throw new IllegalArgumentException("Invalid number");
		
		if (real == Integer.MIN_VALUE || imag == Integer.MIN_VALUE)
			throw new IllegalArgumentException("Value out of range");
	}
	
	
	
	/* Methods */
	
	public long norm() {
		return (long)real * real + (long)imag * imag;  // Does not overflow
	}
	
	
	public GaussianInteger multiply(GaussianInteger other) {
		long re = (long)real * other.real - (long)imag * other.imag;  // Does not overflow
		long im = (long)imag * other.real + (long)real * other.imag;  // Does not overflow
		try {
			return new GaussianInteger(re, im);
		} catch (IllegalArgumentException e) {
			throw new ArithmeticException("Overflow");
		}
	}
	
	
	public boolean isDivisibleBy(int re, int im) {
		long divisorNorm = (long)re * re + (long)im * im;
		return ((long) real * re + (long)imag * im) % divisorNorm == 0 &&
		       ((long)-real * im + (long)imag * re) % divisorNorm == 0;
	}
	
	
	public GaussianInteger divide(GaussianInteger other) {
		if (!isDivisibleBy(other.real, other.imag))
			throw new ArithmeticException("Cannot divide");
		long re = ((long) real * other.real + (long)imag * other.imag) / other.norm();
		long im = ((long)-real * other.imag + (long)imag * other.real) / other.norm();
		try {
			return new GaussianInteger(re, im);
		} catch (IllegalArgumentException e) {
			throw new AssertionError(e);
		}
	}
	
	
	public List<GaussianInteger> factorize() {
		List<GaussianInteger> result = new ArrayList<>();
		if (norm() <= 1) {  // 0, 1, -1, i, -i
			result.add(this);
			return result;
		}
		
		GaussianInteger temp = this;
		GaussianInteger check = new GaussianInteger(1, 0);
		while (temp.norm() > 1) {
			GaussianInteger factor = temp.findPrimeFactor();
			result.add(factor);
			temp = temp.divide(factor);
			check = check.multiply(factor);
		}
		check = check.multiply(temp);
		if (temp.norm() != 1 || check.real != real || check.imag != imag)
			throw new AssertionError();
		if (temp.real != 1)  // -1, i, -i
			result.add(temp);
		
		Collections.sort(result, new Comparator<GaussianInteger>() {
			public int compare(GaussianInteger x, GaussianInteger y) {
				if      (x.norm() < y.norm()) return -1;
				else if (x.norm() > y.norm()) return +1;
				else if (x.real > y.real) return -1;
				else if (x.real < y.real) return +1;
				else return 0;
			}
		});
		return result;
	}
	
	
	private GaussianInteger findPrimeFactor() {
		long norm = norm();
		if (norm % 2 == 0)
			return new GaussianInteger(1, 1);
		
		for (long i = 3, end = sqrt(norm); i <= end; i += 2) {  // Find factors of norm
			if (norm % i == 0) {
				if (i % 4 == 3)
					return new GaussianInteger(i, 0);
				else {
					for (long re = sqrt(i); re > 0; re--) {
						long im = sqrt(i - re * re);
						if (re * re + im * im == i) {
							if (re > Integer.MAX_VALUE || im > Integer.MAX_VALUE)
								throw new ArithmeticException("Overflow");
							else if (isDivisibleBy((int)re, (int)im))
								return new GaussianInteger(re, im);
						}
					}
				}
			}
		}
		
		// This number itself is prime. Rotate so that the argument is in [0, pi/2)
		GaussianInteger temp = this;
		while (temp.real < 0 || temp.imag < 0)
			temp = temp.multiply(new GaussianInteger(0, 1));
		return temp;
	}
	
	
	public String toString() {
		if (imag == 0)
			return real + "";
		else if (real == 0)
			return imag + "i";
		else if (real != 0 && imag > 0)
			return real + " + " + imag + "i";
		else if (real != 0 && imag < 0)
			return real + " - " + (-imag) + "i";
		else
			throw new AssertionError();
	}
	
	
	
	/* Static members */
	
	private static long sqrt(long x) {
		if (x < 0)
			throw new IllegalArgumentException("Square root of negative number");
		long y = 0;
		for (long i = 1L << 31; i != 0; i >>>= 1) {
			y |= i;
			if (y > 3037000499L || y * y > x)
				y ^= i;
		}
		return y;
	}
	
	
	private static final Pattern WHITESPACE_BETWEEN_DIGITS_REGEX = Pattern.compile("\\d\\s+\\d");
	private static final Pattern WHITESPACE_REGEX = Pattern.compile("\\s+");
	
	private static final Pattern REAL_REGEX = Pattern.compile("([+-]?\\d+)");
	private static final Pattern IMAG_REGEX = Pattern.compile("([+-]?)(\\d*)i");
	private static final Pattern REAL_IMAG_REGEX = Pattern.compile("([+-]?\\d+)([+-])(\\d*)i");
	private static final Pattern IMAG_REAL_REGEX = Pattern.compile("([+-]?)(\\d*)i([+-]\\d+)");
	
}
