// DWITE - February 2006 - Problem 2: Floppy Disk 3 1/2-inch High Density
// Solution by Nayuki Minase


public final class dwite200602p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA21.txt", "OUT21.txt", new dwite200602p2());
	}
	
	
	private static final int CAPACITY = 1440;
	
	
	protected void runOnce() {
		// Solve knapsack problem using dynamic programming
		boolean[] possible = new boolean[CAPACITY + 1];
		possible[0] = true;
		int n = io.readIntLine();
		for (int i = 0; i < n; i++) {
			int filesize = io.readIntLine();
			for (int j = CAPACITY - filesize; j >= 0; j--)
				possible[j + filesize] |= possible[j];
		}
		
		// Write the largest possible total size
		for (int i = CAPACITY; i >= 0; i--) {
			if (possible[i]) {  // Guaranteed to execute before the loop ends
				io.println(CAPACITY - i);
				break;
			}
		}
	}
	
}
