/* 
 * DWITE - January 2010 - Problem 5: Ice Maze
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite201001p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5.txt", "OUT5.txt", new dwite201001p5());
	}
	
	
	private static final int WIDTH = 10;
	private static final int HEIGHT = 10;
	
	private char[][] grid;
	private int[][] distance;
	
	
	public void run() {
		grid = io.readGridAndPad(WIDTH, HEIGHT, '#');
		
		for (int i = 0; i < 5; i++) {
			int[] startPoint = find(grid, (char)('A' + i));
			distance = DwiteAlgorithm.newIntGrid(HEIGHT + 2, WIDTH + 2, 999);
			distance[startPoint[1]][startPoint[0]] = 0;
			for (int j = 0; j < WIDTH * HEIGHT; j++)
				propagateDistances();
			
			int[] endPoint = find(grid, (char)('B' + i));
			io.println(distance[endPoint[1]][endPoint[0]]);
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
		int newdist = distance[y][x];
		while (grid[y + dy][x + dx] != '#') {
			x += dx;
			y += dy;
			newdist++;
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
