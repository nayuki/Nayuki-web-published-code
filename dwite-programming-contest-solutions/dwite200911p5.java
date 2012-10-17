/* 
 * DWITE - November 2009 - Problem 5: Portals Redux
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite200911p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5.txt", "OUT5.txt", new dwite200911p5());
	}
	
	
	private int width;
	private int height;
	
	private char[][] grid;
	
	private char[][] tempGrid;
	
	
	public void run() {
		height = io.readIntLine();
		width  = io.readIntLine();
		grid = io.readGridAndPad(width, height, '#');
		
		for (int i = 0; i < 5; i++) {
			tempGrid = grid.clone();
			for (int j = 0; j < tempGrid.length; j++)
				tempGrid[j] = tempGrid[j].clone();
			
			int[] startPoint = find(grid, (char)('1' + i));
			floodFill(startPoint[0], startPoint[1]);
			
			boolean head = true;
			io.printf("%d:", i + 1);
			for (int j = 0; j < 5; j++) {
				int[] point = find(grid, (char)('1' + j));
				if (j != i && tempGrid[point[1]][point[0]] == '#') {
					if (head) head = false;
					else io.print(" ");
					io.print("" + (char)('1' + j));
				}
			}
			io.println();
		}
	}
	
	
	private void floodFill(int x, int y) {
		char c = tempGrid[y][x];
		if (c >= 'a' && c <= 'j') {  // Portal entrance
			tempGrid[y][x] = '#';
			int[] exit = find(grid, (char)(c - 'a' + 'A'));
			floodFill(exit[0], exit[1]);
		}
		
		tempGrid[y][x] = '#';
		if (tempGrid[y    ][x - 1] != '#') floodFill(x - 1, y    );
		if (tempGrid[y    ][x + 1] != '#') floodFill(x + 1, y    );
		if (tempGrid[y - 1][x    ] != '#') floodFill(x    , y - 1);
		if (tempGrid[y + 1][x    ] != '#') floodFill(x    , y + 1);
	}
	
	
	private static int[] find(char[][] grid, char val) {
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
