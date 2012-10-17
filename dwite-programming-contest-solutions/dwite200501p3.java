/* 
 * DWITE - January 2005 - Problem 3: Harshad Numbers
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite200501p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA31.txt", "OUT31.txt", new dwite200501p3());
	}
	
	
	protected void runOnce() {
		// Read input
		int start = io.readIntLine();
		int end = io.readIntLine();
		
		// Compute longest run
		int longestRun = 0;
		int currentRun = 0;
		for (int i = start; i <= end; i++) {
			if (i % getDigitSum(i) == 0)
				currentRun++;
			else {
				longestRun = Math.max(currentRun, longestRun);
				currentRun = 0;
			}
		}
		longestRun = Math.max(currentRun, longestRun);
		
		// Write output
		io.println(longestRun);
	}
	
	
	private static int getDigitSum(int n) {
		int sum = 0;
		while (n != 0) {
			sum += n % 10;
			n /= 10;
		}
		return sum;
	}
	
}
