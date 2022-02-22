/* 
 * Knuth's -yllion number notation demo (Java)
 * 
 * Run main program with no arguments. Prints stuff to standard output. For Java 8+.
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/knuths-yllion-number-notation
 */

import java.io.FileDescriptor;
import java.io.FileOutputStream;
import java.io.PrintStream;
import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;


public final class IntegerToWordsDemo {
	
	public static void main(String[] args) throws UnsupportedEncodingException {
		System.setOut(new PrintStream(new FileOutputStream(FileDescriptor.out), true, "UTF-8"));
		Random rand = new Random();
		for (int i = 4; ; i++) {
			// Choose a random positive number that is exactly 'bits' bits long
			int bits = (int)Math.round(Math.pow(2, i / 2.0));
			BigInteger n = new BigInteger(bits, rand);
			n = n.setBit(bits - 1);
			int len = n.toString().length();  // Number of digits in base 10, i.e. floor(log10(n))+1
			if (len > 8192)
				break;
			System.out.printf("(%d bits, %d digits) %d%n", n.bitLength(), len, n);
			
			// Print the number in various notations
			if (len <= 69) {
				System.out.println(ConventionalEnglishNotation.toStringWithCommas(n));
				System.out.println(ConventionalEnglishNotation.numberToWords(n));
			}
			if (len <= 8192) {
				System.out.println(YllionEnglishNotation.toStringWithSeparators(n));
				System.out.println(YllionEnglishNotation.numberToWords(n));
				System.out.println(YllionChineseNotation.numberToWords(n));
			}
			System.out.println();
		}
	}
	
}



/*---- Submodules for different number formats ----*/

// See https://en.wikipedia.org/wiki/English_numerals .
final class ConventionalEnglishNotation {
	
	// For example: numberToWords(1234567) -> "one million two hundred thirty-four thousand five hundred sixty-seven".
	public static String numberToWords(BigInteger n) {
		// Simple cases
		if (n.signum() == -1)
			return "negative " + numberToWords(n.negate());
		else if (n.signum() == 0)
			return "zero";
		
		// 1 <= n <= 999
		else if (n.compareTo(BI_THOUSAND) < 0) {
			int m = n.intValue();
			String s = "";
			if (m >= 100) {
				s += ONES[m / 100] + " hundred";
				if (m % 100 != 0)
					s += " ";
				m %= 100;
			}
			s += TENS[m / 10];
			if (m < 20)
				s += ONES[m];
			else if (m % 10 != 0)
				s += "-" + ONES[m % 10];
			return s;
		}
		
		else {  // n >= 1000
			List<String> parts = new ArrayList<>();
			for (String illion : ILLIONS) {
				if (n.signum() == 0)
					break;
				BigInteger[] quotrem = n.divideAndRemainder(BI_THOUSAND);
				if (quotrem[1].signum() == 1)
					parts.add(numberToWords(quotrem[1]) + (!illion.equals("") ? " " + illion : ""));
				n = quotrem[0];
			}
			if (n.signum() != 0)
				throw new IllegalArgumentException("Number too large");
			Collections.reverse(parts);
			return String.join(" ", parts);
		}
	}
	
	
	// For example: toStringWithCommas(-123456789) -> "-123,456,798".
	public static String toStringWithCommas(BigInteger n) {
		if (n.signum() == -1)
			return "-" + toStringWithCommas(n.negate());
		else {
			StringBuilder sb = new StringBuilder(n.toString());
			for (int i = sb.length() - 3; i > 0; i -= 3)
				sb.insert(i, ",");
			return sb.toString();
		}
	}
	
	
	private static final String[] ONES = {
		"", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
		"ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"};
	
	private static final String[] TENS = {
		"", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"};
	
	private static final String[] ILLIONS = {
		"", "thousand", "million", "billion", "trillion", "quadrillion",
		"quintillion", "sextillion", "septillion", "octillion", "nonillion",
		"decillion", "undecillion", "duodecillion", "tredecillion", "quattuordecillion",
		"quindecillion", "sexdecillion", "septendecillion", "octodecillion", "novemdecillion",
		"vigintillion"};
	
	
	private static final BigInteger BI_THOUSAND = BigInteger.valueOf(1000);
	
}



// Donald Knuth's system; see https://en.wikipedia.org/wiki/-yllion .
final class YllionEnglishNotation {
	
	public static String numberToWords(BigInteger n) {
		if (n.signum() == -1)
			return "negative " + numberToWords(n.negate());
		// 0 <= n <= 99, borrow functionality from another class
		else if (n.compareTo(BigInteger.valueOf(100)) < 0)
			return ConventionalEnglishNotation.numberToWords(n);
		
		else {  // n >= 100
			String temp = n.toString();
			int yllionsLen = YLLIONS.length;
			if (temp.length() > (1 << yllionsLen))
				throw new IllegalArgumentException("Number too large");
			for (int i = yllionsLen - 1; i >= 1; i--) {
				if (temp.length() > (1 << i)) {
					int split = temp.length() - (1 << i);
					BigInteger high = new BigInteger(temp.substring(0, split));
					BigInteger low = new BigInteger(temp.substring(split));
					return (high.signum() > 0 ? numberToWords(high) + " " + YLLIONS[i] : "")
						+ (high.signum() > 0 && low.signum() > 0 ? " " : "")
						+ (low.signum() > 0 ? numberToWords(low) : "");
				}
			}
			throw new AssertionError();
		}
	}
	
	
	// For example: toStringWithSeparators(12345678901234567890) -> "1234:5678,9012;3456,7890".
	public static String toStringWithSeparators(BigInteger n) {
		if (n.signum() == -1)
			return "-" + toStringWithSeparators(n.negate());
		else {
			StringBuilder sb = new StringBuilder(n.toString());
			for (int i = sb.length() - 4, j = 1; i > 0; i -= 4, j++) {
				int k = Math.min(Integer.numberOfTrailingZeros(j), SEPARATORS.length - 1);
				sb.insert(i, SEPARATORS[k]);
			}
			return sb.toString();
		}
	}
	
	
	private static final String[] YLLIONS = {
		"", "hundred", "myriad", "myllion", "byllion", "tryllion", "quadryllion",
		"quintyllion", "sextyllion", "septyllion", "octyllion", "nonyllion", "decyllion"};
	
	private static final String[] SEPARATORS = {",", ";", ":", "'"};
	
}



// Donald Knuth's system; see https://en.wikipedia.org/wiki/-yllion .
final class YllionChineseNotation {
	
	public static String numberToWords(BigInteger n) {
		if (n.signum() == -1)
			return "\u8CA0" + numberToWords(n.negate());
		else if (n.signum() == 0)
			return "\u96F6";
		else if (n.compareTo(BigInteger.valueOf(100)) < 0) {
			int m = n.intValue();
			return (m >= 10 ? (m >= 20 ? ONES[m / 10] : "") + "\u5341" : "") + ONES[m % 10];
		} else {
			String temp = n.toString();
			int yllionsLen = YLLIONS.length;
			if (temp.length() > (1 << yllionsLen))
				throw new IllegalArgumentException("Number too large");
			for (int i = yllionsLen - 1; i >= 1; i--) {
				if (temp.length() > (1 << i)) {
					int split = temp.length() - (1 << i);
					BigInteger high = new BigInteger(temp.substring(0, split));
					BigInteger low = new BigInteger(temp.substring(split));
					return (high.signum() > 0 ? numberToWords(high) + YLLIONS[i] : "")
						+ (low.signum() > 0 ? numberToWords(low) : "");
				}
			}
			throw new AssertionError();
		}
	}
	
	
	private static final String[] ONES = {"", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u4E03", "\u516B", "\u4E5D"};
	
	private static final String[] YLLIONS = {"", "\u767E", "\u842C", "\u5104", "\u5146", "\u4EAC", "\u5793", "\u79ED", "\u7A70", "\u6E9D", "\u6F97", "\u6B63", "\u8F09"};
	
}
