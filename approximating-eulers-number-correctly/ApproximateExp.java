/* 
 * Approximating the exponential function correctly (Java)
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/approximating-eulers-number-correctly
 */

import java.math.BigInteger;


public class ApproximateExp {
	
	// Runs a demo that prints out some numbers
	public static void main(String[] args) {
		// Print e rounded to n decimal places, for n from 0 to 60
		for (int i = 0; i <= 30; i++) {  // x = 0.0, 0.1, 0.2, ..., 3.0
			for (int j = 1; j <= 10; j++) {  // Accuracy
				BigInteger x = BigInteger.valueOf(i).multiply(BigInteger.TEN.pow(j - 1));
				System.out.printf("exp(%-12s) = %s%n", formatDecimal(x, j), computeExp(x, j));
			}
			System.out.println();
		}
	}
	
	
	// For example: computeExp(20000, 4) = "7.3891"
	private static String computeExp(BigInteger x, int accuracy) {
		if (accuracy < 0)
			throw new IllegalArgumentException();
		if (x.signum() == -1)
			throw new IllegalArgumentException("Negative numbers not supported");
		if (x.signum() == 0)
			return formatDecimal(BigInteger.TEN.pow(accuracy), accuracy);
		
		int extraPrecision = x.multiply(BigInteger.valueOf(4343)).divide(BigInteger.TEN.pow(accuracy + 4)).intValue() + 10;  // Initial estimate based on x / log(10)
		while (true) {
			String result = computeExp(x, accuracy, extraPrecision);
			if (result != null)
				return result;
			extraPrecision += 2;
		}
	}
	
	
	private static String computeExp(BigInteger x, int accuracy, int extraPrecision) {
		final BigInteger accuracyScaler = BigInteger.TEN.pow(accuracy);
		final BigInteger extraScaler    = BigInteger.TEN.pow(extraPrecision);
		final BigInteger fullScaler = accuracyScaler.multiply(extraScaler);
		
		BigInteger sumLow  = BigInteger.ZERO;
		BigInteger sumHigh = BigInteger.ZERO;
		BigInteger termLow  = fullScaler;
		BigInteger termHigh = fullScaler;
		final BigInteger floorXBig = x.divide(accuracyScaler);
		if (floorXBig.bitLength() > 30)
			throw new IllegalArgumentException("x is too large");
		final int floorX = floorXBig.intValue();
		
		for (int i = 0; termLow.signum() != 0; i++) {
			sumLow  = sumLow .add(termLow );
			sumHigh = sumHigh.add(termHigh);
			termLow  = termLow .multiply(x).divide(accuracyScaler);
			termHigh = termHigh.multiply(x).divide(accuracyScaler).add(BigInteger.ONE);
			
			if (i > floorX && termHigh.compareTo(extraScaler) < 0) {
				BigInteger sumUpperBound = sumHigh.add(termHigh);
				BigInteger temp = divideAndRound(sumLow, extraScaler);
				if (divideAndRound(sumUpperBound, extraScaler).equals(temp)) {
					// Note: The number of terms used is i+1
					return formatDecimal(temp, accuracy);
				}
			}
			
			BigInteger j = BigInteger.valueOf(i + 1);
			termLow  = termLow .divide(j);
			termHigh = termHigh.divide(j).add(BigInteger.ONE);
		}
		return null;
	}
	
	
	// Any rounding mode works correctly with computeEulersNumber().
	// Round-half-to-even is implemented here, but truncation, flooring, etc. are acceptable too.
	private static BigInteger divideAndRound(BigInteger num, BigInteger div) {
		BigInteger[] quotRem = num.divideAndRemainder(div);
		BigInteger result = quotRem[0];
		int cmp = quotRem[1].shiftLeft(1).compareTo(div);
		if (cmp > 0 || cmp == 0 && result.testBit(0))
			result = result.add(BigInteger.ONE);
		return result;
	}
	
	
	private static String formatDecimal(BigInteger num, int accuracy) {
		String temp = num.toString();
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < accuracy + 1 - temp.length(); i++)  // Add leading zeros so that we have at least accuracy+1 digits
			sb.append('0');
		sb.append(temp);
		sb.insert(sb.length() - accuracy, '.');
		return sb.toString();
	}
	
}
