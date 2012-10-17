/* 
 * DWITE - February 2011 - Problem 3: Balancing Act
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite201102p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite201102p3());
	}
	
	
	protected void runOnce() {
		// Dynamic programming: Knapsack program
		boolean[] feasibleSum = new boolean[30 * 1000 + 1];
		feasibleSum[0] = true;
		
		// Calculate which sums of weights are feasible
		int n = io.readIntLine();
		int total = 0;
		for (int i = 0; i < n; i++) {
			int weight = io.readIntLine();
			total += weight;
			for (int j = feasibleSum.length - 1 - weight; j >= 0; j--)
				feasibleSum[j + weight] |= feasibleSum[j];
		}
		
		// Start at half of the total weight and search downward for the first feasible weight
		for (int i = total / 2; i >= 0; i--) {
			if (feasibleSum[i]) {  // Guaranteed to execute before the loop ends
				io.println(total - i * 2);
				break;
			}
		}
	}
	
}
