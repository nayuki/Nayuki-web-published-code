// DWITE - October 2004 - Problem 4: CD-ROM Files

import dwite.*;


public final class dwite200410p4 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA4", "OUT4", new dwite200410p4());
	}
	
	
	protected void runOnce() {
		io.tokenizeLine();
		int capacity = io.readIntToken();  // Variable A
		int files    = io.readIntToken();  // Variable n
		
		// Solve knapsack problem using dynamic programming
		boolean[] possible = new boolean[capacity + 1];
		possible[0] = true;
		for (int i = 0; i < files; i++) {
			int filesize = io.readIntToken();  // Variable s_{i+1}
			for (int j = capacity - filesize; j >= 0; j--)
				possible[j + filesize] |= possible[j];
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
