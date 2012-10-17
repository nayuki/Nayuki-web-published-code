/* 
 * DWITE - October 2009 - Problem 3: That Missing Number
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite200910p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite200910p3());
	}
	
	
	protected void runOnce() {
		int m = io.readIntLine();
		int sum = (m + 1) * (m + 2) / 2;  // Sum of 1, 2, ..., m + 1
		for (int i = 0; i < m; i++)
			sum -= io.readIntLine();
		io.println(sum);
	}
	
}
