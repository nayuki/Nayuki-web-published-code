// DWITE - November 2010 - Problem 3: Escape and Loot
// Solution by Nayuki Minase


public final class dwite201011p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite201011p3());
	}
	
	
	protected void runOnce() {
		final int WIDTH = 8;
		final int HEIGHT = 8;

		// Read grid
		char[][] grid = new char[HEIGHT][WIDTH];
		for (int i = 0; i < HEIGHT; i++) {
			String line = io.readLine();
			for (int j = 0; j < WIDTH; j++)
				grid[i][j] = line.charAt(j);
		}
		io.readLine();  // Discard line of hyphens
		
		// Dynamic programming
		int[][] value = new int[HEIGHT][WIDTH];
		for (int i = HEIGHT - 1; i >= 0; i--) {
			for (int j = 0; j < WIDTH; j++) {
				if (grid[i][j] == '#')
					value[i][j] = -1;
				else if (i == HEIGHT - 1 && j == 0)  // Special case for bottom left
					value[i][j] = getValue(grid[i][j]);
				else {
					int temp = -1;
					if (i + 1 < HEIGHT)
						temp = Math.max(value[i + 1][j], temp);
					if (j - 1 >= 0)
						temp = Math.max(value[i][j - 1], temp);
					if (temp != -1)
						temp += getValue(grid[i][j]);
					value[i][j] = temp;
				}
			}
		}
		
		io.println(value[0][WIDTH - 1]);
	}
	
	
	private static int getValue(char cell) {
		if (cell == '.')
			return 0;
		else if (cell == '#')
			return -1;
		else if (cell >= '0' && cell <= '9')
			return cell - '0';
		else
			throw new IllegalArgumentException();
	}
	
}
