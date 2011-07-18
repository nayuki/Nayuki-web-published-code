// DWITE - November 2005 - Problem 2: Variations on the Game of Life
// Solution by Nayuki Minase


public final class dwite200511p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA21.txt", "OUT21.txt", new dwite200511p2());
	}
	
	
	private char[][] grid;
	
	private boolean[] live;
	private boolean[] birth;
	
	
	protected void runOnce() {
		// Read input
		io.tokenizeLine();
		int height = io.readIntToken();
		int width = io.readIntToken();
		grid = io.readGridAndPad(width, height, ' ');
		
		String rule = io.readLine();
		live = parseRule(rule.split("/")[0]);
		birth = parseRule(rule.split("/")[1]);
		
		// Compute
		for (int i = 0; i < 25; i++)
			nextGeneration();
		
		// Write output
		io.println(countTotalAlive());
	}
	
	
	private void nextGeneration() {
		char[][] newGrid = new char[grid.length][grid[0].length];
		for (int y = 1; y < grid.length - 1; y++) {
			for (int x = 1; x < grid[0].length - 1; x++) {
				int liveneigh = countLiveNeighbors(x, y);
				if (grid[y][x] == '.' && birth[liveneigh])  // Birth
					newGrid[y][x] = 'X';
				else if (grid[y][x] == 'X' && !live[liveneigh])  // Death
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
	
	
	// For example, "235" becomes [false, false, true, true, false, true, false, false, false]
	private static boolean[] parseRule(String s) {
		boolean[] result = new boolean[9];
		for (int i = 0; i < s.length(); i++)
			result[s.charAt(i) - '0'] = true;
		return result;
	}
	
}
