// DWITE - October 2005 - Problem 1: Odometers
// Solution by Nayuki Minase

import java.math.BigInteger;


public final class dwite200510p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA11.txt", "OUT11.txt", new dwite200510p1());
	}
	
	
	protected void runOnce() {
		// Read input
		int[] r1 = DwiteAlgorithm.toDigits(io.readLine());
		int d1 = io.readIntLine();
		int d2 = io.readIntLine();
		
		// Find the nearest next suitable odometer reading
		int n1 = countOccurrences(r1, d1);
		int[] r2 = r1.clone();
		//r2 = solveSlow(n1, d2, r2);
		r2 = solveFast(n1, d2, r2);
		
		// Compute distance from initial reading to target reading
		BigInteger diff = toNumber(r2).subtract(toNumber(r1));
		if (diff.compareTo(BigInteger.ZERO) < 0)
			diff = diff.add(BigInteger.valueOf(10).pow(r1.length));
		
		// Write output
		io.printf("%s %d%n", toString(r2), diff);
	}
	
	
	@SuppressWarnings("unused")
	private static int[] solveSlow(int n1, int d2, int[] r2) {
		while (countOccurrences(r2, d2) != n1)
			increment(r2, r2.length - 1);
		return r2;
	}
	
	
	private static int[] solveFast(int n1, int d2, int[] r2) {
		while (true) {
			int n2 = countOccurrences(r2, d2);
			if (n2 == n1)  // Done!
				break;
			else if (n2 < n1) {
				// Try to set a lower-order non-d2 digit to d2
				for (int i = r2.length-1; i >= 0; i--) {
					if (r2[i] < d2) {
						// Set digit directly to d2. n2 will be incremented.
						r2[i] = d2;
						break;
					} else if (r2[i] > d2) {
						// Increment next digit, clear this digit and all digits below. n2 will decrease or stay the same.
						increment(r2, i - 1);
						for (; i < r2.length; i++)
							r2[i] = 0;
						break;
					}
				}
			} else {  // n2 > n1
				// Increment a lower-order d2. n2 will be decremented.
				for (int i = r2.length-1; i >= 0; i--) {
					if (r2[i] == d2) {
						increment(r2, i);
						break;
					}
				}
			}
		}
		return r2;
	}
	
	
	private static int countOccurrences(int[] digits, int digit) {
		int count = 0;
		for (int i = 0; i < digits.length; i++) {
			if (digits[i] == digit)
				count++;
		}
		return count;
	}
	
	
	private static void increment(int[] digits, int index) {
		if (index < 0)
			return;
		digits[index]++;
		while (digits[index] == 10) {
			digits[index] = 0;
			if (index - 1 >= 0)
				digits[index - 1]++;
			else
				break;
			index--;
		}
	}
	
	
	private static BigInteger toNumber(int[] digits) {
		final BigInteger TEN = BigInteger.valueOf(10);
		BigInteger sum = BigInteger.ZERO;
		for (int i = 0; i < digits.length; i++) {
			sum = sum.multiply(TEN);
			sum = sum.add(BigInteger.valueOf(digits[i]));
		}
		return sum;
	}
	
	
	private static String toString(int[] digits) {
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < digits.length; i++)
			sb.append((char)('0' + digits[i]));
		return sb.toString();
	}
	
}
