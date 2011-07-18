// DWITE - February 2005 - Problem 2: Snakes
// Solution by Nayuki Minase


public final class dwite200502p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA21.txt", "OUT21.txt", new dwite200502p2());
	}
	
	
	private char[][] grid;
	
	
	protected void runOnce() {
		// Read input
		io.tokenizeLine();
		int height = io.readIntToken();
		int width = io.readIntToken();
		grid = io.readGridAndPad(width, height, '.');
		
		// Find the largest snakes
		int maxcoiled = 0;
		int maxuncoiled = 0;
		for (int y = 1; y <= height; y++) {
			for (int x = 1; x <= width; x++) {
				int temp = markSnakeAndGetLength(x, y);
				if (isCurrentSnakeCoiled())
					maxcoiled = Math.max(temp, maxcoiled);
				else
					maxuncoiled = Math.max(temp, maxuncoiled);
				clearCurrentSnake();
			}
		}
		
		// Write output
		io.printf("%d %d%n", maxcoiled, maxuncoiled);
	}
	
	
	private boolean isCurrentSnakeCoiled() {
		for (int y = 1; y < grid.length - 1; y++) {
			for (int x = 1; x < grid[y].length - 1; x++) {
				if (grid[y][x] == 'O' && countCurrentNeighbors(x, y) >= 3)
					return true;
			}
		}
		return false;
	}
	
	
	private int markSnakeAndGetLength(int x, int y) {
		if (grid[y][x] != 'X')
			return 0;
		int count = 1;
		grid[y][x] = 'O';
		count += markSnakeAndGetLength(x - 1, y - 1);
		count += markSnakeAndGetLength(x - 1, y + 0);
		count += markSnakeAndGetLength(x - 1, y + 1);
		count += markSnakeAndGetLength(x + 0, y - 1);
		count += markSnakeAndGetLength(x + 0, y + 1);
		count += markSnakeAndGetLength(x + 1, y - 1);
		count += markSnakeAndGetLength(x + 1, y + 0);
		count += markSnakeAndGetLength(x + 1, y + 1);
		return count;
	}
	
	
	private int countCurrentNeighbors(int x, int y) {
		int count = 0;
		if (grid[y - 1][x - 1] == 'O') count++;
		if (grid[y - 1][x + 0] == 'O') count++;
		if (grid[y - 1][x + 1] == 'O') count++;
		if (grid[y + 0][x - 1] == 'O') count++;
		if (grid[y + 0][x + 1] == 'O') count++;
		if (grid[y + 1][x - 1] == 'O') count++;
		if (grid[y + 1][x + 0] == 'O') count++;
		if (grid[y + 1][x + 1] == 'O') count++;
		return count;
	}
	
	
	private void clearCurrentSnake() {
		for (int y = 1; y < grid.length - 1; y++) {
			for (int x = 1; x < grid[y].length - 1; x++) {
				if (grid[y][x] == 'O')
					grid[y][x] = '.';
			}
		}
	}
	
}
