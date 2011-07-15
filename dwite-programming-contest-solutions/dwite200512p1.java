// DWITE - December 2005 - Problem 1: Semiprimes

import dwite.*;


public final class dwite200512p1 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA11.txt", "OUT11.txt", new dwite200512p1());
	}
	
	
	protected void runOnce() {
		// Read input
		int start = io.readIntLine();
		int end = io.readIntLine();
		
		// Compute
		int count = 0;
		for (int i = start; i <= end; i++) {
			if (isSemiprime(i))
				count++;
		}
		
		// Write output
		io.println(count);
	}
	
	
	private static boolean isSemiprime(int n) {
		for (int i = 2, end = Algorithm.sqrt(n); i <= end; i++) {
			if (n % i == 0) {  // One factor found (always prime)
				return isPrime(n / i);
			}
		}
		return false;
	}
	
	
	
	private static boolean isPrime(int n) {
		for (int i = 2, end = Algorithm.sqrt(n); i <= end; i++) {
			if (n % i == 0)
				return false;
		}
		return true;
	}
	
}
