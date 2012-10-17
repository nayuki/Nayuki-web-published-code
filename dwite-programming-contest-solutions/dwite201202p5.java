/* 
 * DWITE - February 2012 - Problem 5: Cube World
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite201202p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5.txt", "OUT5.txt", new dwite201202p5());
	}
	
	
	private int rows;
	private int cols;
	private int[][] heights;
	
	
	protected void runOnce() {
		// Read grid
		io.tokenizeLine();
		rows = io.readIntToken();
		cols = io.readIntToken();
		heights = new int[rows][cols];
		for (int i = 0; i < rows; i++) {
			io.tokenizeLine();
			for (int j = 0; j < cols; j++)
				heights[i][j] = io.readIntToken();
		}
		
		// Find water capacity at each level
		int water = 0;
		for (int i = 0; i < 50; i++) {
			water += getWaterCapacity(i);
		}
		io.println(water);
	}
	
	
	private int getWaterCapacity(int height) {
		// Find cube-occupied cells
		boolean[][] unusable = new boolean[rows][cols];
		for (int i = 0; i < rows; i++) {
			for (int j = 0; j < cols; j++)
				unusable[i][j] = heights[i][j] > height;
		}
		
		// Flood fill from the edges to disqualify cells
		for (int i = 0; i < rows; i++) {
			for (int j = 0; j < cols; j++) {
				if (i == 0 || i == rows - 1 || j == 0 || j == cols - 1)
					floodFill(unusable, i, j);
			}
		}
		
		// Count remaining cells
		int count = 0;
		for (int i = 0; i < rows; i++) {
			for (int j = 0; j < cols; j++) {
				if (!unusable[i][j])
					count++;
			}
		}
		return count;
	}
	
	
	private void floodFill(boolean[][] grid, int i, int j) {
		if (i < 0 || i >= rows || j < 0 || j >= cols)  // Out of bounds
			return;
		if (grid[i][j])  // Already filled
			return;
		grid[i][j] = true;
		floodFill(grid, i    , j - 1);
		floodFill(grid, i    , j + 1);
		floodFill(grid, i - 1, j    );
		floodFill(grid, i + 1, j    );
	}
	
}
