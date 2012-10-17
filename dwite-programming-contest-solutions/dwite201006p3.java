/* 
 * DWITE - June 2010 - Problem 3: Oil Spill Area
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite201006p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite201006p3());
	}
	
	
	private char[][] grid;
	
	
	protected void runOnce() {
		grid = io.readGridAndPad(10, 10, '.');
		io.readLine();  // Discard line of equal signs
		int[] point = find('A');
		io.println(floodFill(point[0], point[1]));
	}
	
	
	private int floodFill(int x, int y) {
		int count = 1;
		grid[y][x] = '.';
		if (grid[y    ][x - 1] == '#') count += floodFill(x - 1, y    );
		if (grid[y    ][x + 1] == '#') count += floodFill(x + 1, y    );
		if (grid[y - 1][x    ] == '#') count += floodFill(x    , y - 1);
		if (grid[y + 1][x    ] == '#') count += floodFill(x    , y + 1);
		return count;
	}
	
	
	private int[] find(char val) {
		int x = -1;
		int y = -1;
		for (int i = 0; i < grid.length; i++) {
			for (int j = 0; j < grid[i].length; j++) {
				if (grid[i][j] == val) {
					x = j;
					y = i;
					break;
				}
			}
		}
		return new int[]{x, y};
	}
	
}
