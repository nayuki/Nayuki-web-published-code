// DWITE - February 2006 - Problem 5: Prime Palindromes
// Solution by Nayuki Minase


public final class dwite200602p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA51.txt", "OUT51.txt", new dwite200602p5());
	}
	
	
	private static boolean[] isPrime = DwiteAlgorithm.sievePrimes(1000000);
	
	
	protected void runOnce() {
		// Read input
		io.tokenizeLine();
		int start = io.readIntToken();
		int end  = io.readIntToken();
		
		// Compute
		int palin = 0;
		for (int i = start; i <= end; i++) {
			if (isPrime[i] && isPalindrome(i))
				palin++;
		}
		
		// Write output
		io.println(palin);
	}
	
	
	private static boolean isPalindrome(int x) {
		String s = Integer.toString(x);
		return new StringBuilder(s).reverse().toString().equals(s);
	}
	
}
