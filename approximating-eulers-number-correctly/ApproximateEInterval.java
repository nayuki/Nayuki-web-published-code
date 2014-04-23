/* 
 * Approximating Euler's number correctly (Java)
 * 
 * Copyright (c) 2014 Nayuki Minase
 * All rights reserved. Contact Nayuki for licensing.
 * http://nayuki.eigenstate.org/page/approximating-eulers-number-correctly
 */

import java.math.BigInteger;


public class ApproximateEInterval {
	
	// Runs a demo that prints out some numbers
	public static void main(String[] args) {
		// Print e rounded to n decimal places, for n from 0 to 60
		for (int i = 0; i <= 60; i++)
			System.out.println(computeEulersNumber(i));
		System.out.println();
		
		// Compute 1 to 100000 decimal places (exponentially increasing) and print timing
		int prev = 0;
		for (int i = 0; i <= 100; i++) {
			int digits = (int)Math.round(Math.pow(10, i / 20.0));
			if (digits == prev)
				continue;
			prev = digits;
			
			long startTime = System.nanoTime();
			computeEulersNumber(digits);
			long time = System.nanoTime() - startTime;
			System.out.printf("%6d  %7.3f s%n", digits, time / 1000000000.0);
		}
	}
	
	
	// For example: computeEulersNumber(4) = "2.7183"
	private static String computeEulersNumber(int accuracy) {
		if (accuracy < 0)
			throw new IllegalArgumentException();
		
		for (int extraPrecision = 7; ; extraPrecision += 2) {
			String result = computeEulersNumber(accuracy, extraPrecision);
			if (result != null)
				return result;
		}
	}
	
	
	private static String computeEulersNumber(int accuracy, int extraPrecision) {
		final BigInteger fullScaler  = BigInteger.TEN.pow(accuracy + extraPrecision);
		final BigInteger extraScaler = BigInteger.TEN.pow(extraPrecision);
		BigInteger sumLow  = BigInteger.ZERO;
		BigInteger sumHigh = BigInteger.ZERO;
		BigInteger termLow  = fullScaler;
		BigInteger termHigh = fullScaler;
		
		for (int i = 0; termLow.signum() != 0; i++) {
			sumLow  = sumLow .add(termLow );
			sumHigh = sumHigh.add(termHigh);
			
			if (i >= 1 && termHigh.compareTo(extraScaler) < 0) {
				BigInteger sumUpperBound = sumHigh.add(termHigh);
				BigInteger temp = divideAndRound(sumLow, extraScaler);
				if (divideAndRound(sumUpperBound, extraScaler).equals(temp)) {
					// Note: The number of terms used is i+1
					String s = temp.toString();
					return s.substring(0, s.length() - accuracy) + "." + s.substring(s.length() - accuracy);
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
	
}
