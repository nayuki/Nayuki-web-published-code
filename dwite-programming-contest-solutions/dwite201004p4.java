/* 
 * DWITE - April 2010 - Problem 4: Time for Change
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.Arrays;


public final class dwite201004p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA4.txt", "OUT4.txt", new dwite201004p4());
	}
	
	
	protected void runOnce() {
		int m = io.readIntLine();
		int n = io.readIntLine();
		
		int[] minCoins = new int[m + 1];
		Arrays.fill(minCoins, 999);
		minCoins[0] = 0;
		
		// Dynamic programming: Knapsack program
		for (int i = 0; i < n; i++) {
			int c = io.readIntLine();
			for (int j = c; j < minCoins.length; j++)
				minCoins[j] = Math.min(minCoins[j - c] + 1, minCoins[j]);
		}
		io.println(minCoins[m]);
	}
	
}
