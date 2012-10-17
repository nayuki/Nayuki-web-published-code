/* 
 * DWITE - December 2004 - Problem 2: Squareland II
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite200412p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA21.txt", "OUT21.txt", new dwite200412p2());
	}
	
	
	protected void runOnce() {
		// Read input
		int n = io.readIntLine();
		int s = io.readIntLine();
		int sqrtn = DwiteAlgorithm.sqrt(n);
		int sqrts = DwiteAlgorithm.sqrt(s);
		int[][] grid = new int[sqrtn][sqrtn];
		for (int y = 0; y < grid.length; y++) {
			io.tokenizeLine();
			for (int x = 0; x < grid[y].length; x++)
				grid[y][x] = io.readIntToken();
		}
		
		// Find square with maximum sum
		int maxsum = 0;
		for (int y = 0; y + sqrts <= sqrtn; y++) {
			for (int x = 0; x + sqrts <= sqrtn; x++)
				maxsum = Math.max(sum(grid, x, y, sqrts, sqrts), maxsum);
		}
		
		// Write output
		io.println(maxsum);
	}
	
	
	// Naive algorithm
	private static int sum(int[][] grid, int x, int y, int w, int h) {
		int sum = 0;
		for (int i = 0; i < h; i++) {
			for (int j = 0; j < w; j++)
				sum += grid[y + i][x + j];
		}
		return sum;
	}
	
}
