/* 
 * DWITE - December 2005 - Problem 1: Semiprimes
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite200512p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA11.txt", "OUT11.txt", new dwite200512p1());
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
		for (int i = 2, end = DwiteAlgorithm.sqrt(n); i <= end; i++) {
			if (n % i == 0) {  // One factor found (always prime)
				return isPrime(n / i);
			}
		}
		return false;
	}
	
	
	
	private static boolean isPrime(int n) {
		for (int i = 2, end = DwiteAlgorithm.sqrt(n); i <= end; i++) {
			if (n % i == 0)
				return false;
		}
		return true;
	}
	
}
