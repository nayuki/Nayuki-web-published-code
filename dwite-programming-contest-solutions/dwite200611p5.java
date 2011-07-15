// DWITE - November 2006 - Problem 5: Goldbach's Weak Conjecture

import dwite.*;


public final class dwite200611p5 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA51.txt", "OUT51.txt", new dwite200611p5());
	}
	
	
	private static boolean[] isPrime;
	
	static {
		isPrime = Algorithm.sievePrimes(999999);
		isPrime[2] = false;  // For the purposes of this problem
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		io.printf("%d=%s%n", n, solve(n));
	}
	
	
	private static String solve(int n) {
		if (n % 2 == 0)
			throw new IllegalArgumentException("Not applicable to even numbers");
		if (n <= 7)
			throw new IllegalArgumentException("Not applicable for numbers 7 or less");
		return solve(n, 3, Integer.MAX_VALUE);
	}
	
	
	private static String solve(int n, int terms, int max) {
		if (n > max)
			return null;
		else if (terms == 1) {
			if (isPrime[n])
				return Integer.toString(n);
			else
				return null;
		} else {
			for (int i = Math.min(n, max), end = (n + terms - 1) / terms; i >= end; i--) {
				if (!isPrime[i])
					continue;
				String temp = solve(n - i, terms - 1, i);
				if (temp != null)
					return String.format("%d+%s", i, temp);
			}
			return null;
		}
	}
	
}
