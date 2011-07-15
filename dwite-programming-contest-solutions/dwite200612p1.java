// DWITE - December 2006 - Problem 1: Jimmy's Lost His Marbles

import dwite.*;


public final class dwite200612p1 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA11.txt", "OUT11.txt", new dwite200612p1());
	}
	
	
	protected void runOnce() {
		int capacity = io.readIntLine();  // Capacity of storage box
		int bags = io.readIntLine();
		io.tokenizeLine();
		
		// Solve knapsack problem using dynamic programming
		boolean[] possible = new boolean[capacity + 1];
		possible[0] = true;
		for (int i = 0; i < bags; i++) {
			int marbles = io.readIntToken();
			for (int j = capacity - marbles; j >= 0; j--)
				possible[j + marbles] |= possible[j];
		}
		
		// Write the largest possible total size
		for (int i = capacity; i >= 0; i--) {
			if (possible[i]) {  // Guaranteed to execute before the loop ends
				io.println(i);
				break;
			}
		}
	}
	
}
