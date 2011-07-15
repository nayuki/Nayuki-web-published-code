// DWITE - October 2005 - Problem 4: Minesweeper

import dwite.*;


public final class dwite200510p4 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA41.txt", "OUT41.txt", new dwite200510p4());
	}
	
	
	private char[][] grid;
	
	
	public void run() {
		grid = io.readGridAndPad(30, 16, ' ');  // Read grid
		calculateNeighboringMines();  // Process grid
		super.run();  // Process queries
	}
	
	
	protected void runOnce() {
		// Read input
		io.tokenizeLine();
		int y = io.readIntToken();
		int x = io.readIntToken();
		
		// Make query and write output
		if (grid[y][x] == 'X')
			io.println("MINE - YOU LOSE");
		else if (grid[y][x] >= '1' && grid[y][x] <= '8')
			io.printf("NO MINE - %c SURROUNDING IT%n", grid[y][x]);
		else if (grid[y][x] == '0')
			io.printf("NO MINE - %d SQUARES REVEALED%n", reveal(x, y, new boolean[grid.length][grid[0].length]));
		else
			throw new AssertionError("Invalid cell");
	}
	
	
	private int reveal(int x, int y, boolean[][] visited) {
		if (visited[y][x] || grid[y][x] == ' ')
			return 0;
		visited[y][x] = true;
		int result = 1;
		if (grid[y][x] == '0') {
			result += reveal(x - 1, y - 1, visited);
			result += reveal(x + 0, y - 1, visited);
			result += reveal(x + 1, y - 1, visited);
			result += reveal(x - 1, y + 0, visited);
			result += reveal(x + 1, y + 0, visited);
			result += reveal(x - 1, y + 1, visited);
			result += reveal(x + 0, y + 1, visited);
			result += reveal(x + 1, y + 1, visited);
		}
		return result;
	}
	
	
	private void calculateNeighboringMines() {
		for (int y = 1; y < grid.length - 1; y++) {
			for (int x = 1; x < grid[0].length - 1; x++) {
				if (grid[y][x] == '.')
					grid[y][x] = (char)(getMineNeighborCount(x, y) + '0');
			}
		}
	}
	
	
	private int getMineNeighborCount(int x, int y) {
		int count = 0;
		if (grid[y - 1][x - 1] == 'X') count++;
		if (grid[y - 1][x + 0] == 'X') count++;
		if (grid[y - 1][x + 1] == 'X') count++;
		if (grid[y + 0][x - 1] == 'X') count++;
		if (grid[y + 0][x + 1] == 'X') count++;
		if (grid[y + 1][x - 1] == 'X') count++;
		if (grid[y + 1][x + 0] == 'X') count++;
		if (grid[y + 1][x + 1] == 'X') count++;
		return count;
	}
	
}
