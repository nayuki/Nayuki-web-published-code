// DWITE - October 2005 - Problem 2: The Game of Life

import dwite.*;


public final class dwite200510p2 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA21.txt", "OUT21.txt", new dwite200510p2());
	}
	
	
	private char[][] grid;
	
	
	public void run() {
		// Read input
		io.tokenizeLine();
		int height = io.readIntToken();
		int width = io.readIntToken();
		grid = io.readGridAndPad(width, height, '.');
		
		// Compute and write output
		for (int i = 0; i <= 100; i++) {
			if (isBreakpoint(i))
				io.println(countTotalAlive());
			nextGeneration();
		}
	}
	
	
	private void nextGeneration() {
		char[][] newGrid = new char[grid.length][grid[0].length];
		for (int y = 1; y < grid.length - 1; y++) {
			for (int x = 1; x < grid[0].length - 1; x++) {
				int liveneigh = countLiveNeighbors(x, y);
				if (grid[y][x] == '.' && liveneigh == 3)  // Birth
					newGrid[y][x] = 'X';
				else if (grid[y][x] == 'X' && (liveneigh < 2 || liveneigh > 3))  // Death
					newGrid[y][x] = '.';
				else  // Unchanged
					newGrid[y][x] = grid[y][x];
			}
		}
		for (int y = 1; y < grid.length - 1; y++)
			System.arraycopy(newGrid[y], 1, grid[y], 1, grid[y].length - 2);
	}
	
	
	private int countLiveNeighbors(int x, int y) {
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
	
	
	private int countTotalAlive() {
		int count = 0;
		for (int y = 1; y < grid.length - 1; y++) {
			for (int x = 1; x < grid[0].length - 1; x++) {
				if (grid[y][x] == 'X')
					count++;
			}
		}
		return count;
	}
	
	
	private static boolean isBreakpoint(int i) {
		return i ==   1
		    || i ==   5
		    || i ==  10
		    || i ==  50
		    || i == 100;
	}
	
}
