// DWITE - December 2006 - Problem 3: Circular Primes

import dwite.*;


public final class dwite200612p3 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA31.txt", "OUT31.txt", new dwite200612p3());
	}
	
	
	private static boolean[] isPrime = Algorithm.sievePrimes(999999);
	
	
	protected void runOnce() {
		// Read input
		int n = io.readIntLine();
		
		// Find next circular prime (possibly the current number)
		int i = n;
		while (!isCircularPrime(i))
			i++;
		
		// Write output
		io.println(i);
	}
	
	
	private static boolean isCircularPrime(int n) {
		String s = Integer.toString(n);
		for (int i = 0; i < s.length(); i++) {
			if (!isPrime[Integer.parseInt(s)])
				return false;
			s = rotateLeft(s, 1);
		}
		return true;
	}
	
	
	private static String rotateLeft(String str, int shift) {
		if (str.equals(""))
			return str;
		else {
			shift %= str.length();
			return str.substring(shift, str.length()) + str.substring(0, shift);
		}
	}
	
}
