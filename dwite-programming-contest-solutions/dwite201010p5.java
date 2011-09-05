// DWITE - October 2010 - Problem 5: Ricochet Robot
// Solution by Nayuki Minase


public final class dwite201010p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5.txt", "OUT5.txt", new dwite201010p5());
	}
	
	
	private static final int WIDTH = 10;
	private static final int HEIGHT = 10;
	
	private char[][] grid;
	private int[][] distance;
	
	
	protected void runOnce() {
		// Read grid and pad
		grid = io.readGridAndPad(WIDTH, HEIGHT, '#');
		distance = DwiteAlgorithm.newIntGrid(HEIGHT + 2, WIDTH + 2, 999);
		int[] startPoint = find(grid, 'A');
		distance[startPoint[1]][startPoint[0]] = 0;
		io.readLine();  // Discard line of hyphens
		
		// Propagate distances
		for (int i = 0; i < WIDTH * HEIGHT; i++)
			propagateDistances();
		
		// Find ending position and print
		for (int i = 0; i < HEIGHT; i++) {
			for (int j = 0; j < WIDTH; j++) {
				if (grid[i + 1][j + 1] == 'B')
					io.println(distance[i + 1][j + 1]);
			}
		}
	}
	
	
	private void propagateDistances() {
		for (int i = 1; i <= HEIGHT; i++) {
			for (int j = 1; j <= WIDTH; j++) {
				if (distance[i][j] != 999) {
					shoot(j, i,  0, -1);
					shoot(j, i,  0,  1);
					shoot(j, i, -1,  0);
					shoot(j, i,  1,  0);
				}
			}
		}
	}
	
	
	private void shoot(int x, int y, int dx, int dy) {
		int newdist = distance[y][x] + 1;
		while (grid[y + dy][x + dx] != '#') {
			x += dx;
			y += dy;
		}
		distance[y][x] = Math.min(newdist, distance[y][x]);
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
