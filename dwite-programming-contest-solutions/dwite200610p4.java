// DWITE - October 2006 - Problem 4: Count Squares
// Solution by Nayuki Minase


public final class dwite200610p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA41.txt", "OUT41.txt", new dwite200610p4());
	}
	
	
	private char[][] grid;
	
	
	protected void runOnce() {
		// Read input
		io.tokenizeLine();
		int height = io.readIntToken();
		int width = io.readIntToken();
		grid = new char[height][width];
		for (int y = 0; y < height; y++) {
			String line = io.readLine();
			for (int x = 0; x < width; x++)
				grid[y][x] = line.charAt(x);
		}
		
		// Compute
		int count = 0;
		for (int i = 1; i <= Math.min(width, height); i++)
			count += countSquares(i);
		
		// Write output
		io.println(count);
	}
	
	
	private int countSquares(int size) {
		int count = 0;
		for (int y = 0; y < grid.length - size + 1; y++) {
			for (int x = 0; x < grid[y].length - size + 1; x++) {
				count += isSquare(x, y, size);
			}
		}
		return count;
	}
	
	
	private int isSquare(int x, int y, int size) {
		for (int i = 0; i < size; i++) {
			for (int j = 0; j < size; j++) {
				if (grid[y + i][x + j] != '*')
					return 0;
			}
		}
		return 1;
	}
	
}
