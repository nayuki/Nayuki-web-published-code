// DWITE - December 2011 - Problem 4: ABCA Maze
// Solution by Nayuki Minase

import java.util.HashSet;
import java.util.Set;


public final class dwite201112p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA4.txt", "OUT4.txt", new dwite201112p4());
	}
	
	
	protected void runOnce() {
		io.tokenizeLine();
		int height = io.readIntToken();
		int width  = io.readIntToken();
		char[][] grid = io.readGridAndPad(width, height, '#');
		io.println(distance(grid, 'A', 'B') + distance(grid, 'B', 'C') + distance(grid, 'C', 'A'));
	}
	
	
	private static int distance(char[][] grid, char from, char to) {
		// Breadth-first search by keeping track of only 3 layers
		int dist = 0;
		Set<Point> prevLayer = new HashSet<Point>();
		Set<Point> currLayer = new HashSet<Point>();
		currLayer.add(find(grid, from));
		while (!currLayer.isEmpty()) {
			Set<Point> nextLayer = new HashSet<Point>();
			for (Point p : currLayer) {
				if (grid[p.y][p.x] == to)
					return dist;
				Point n;
				n = new Point(p.x - 1, p.y);  if (grid[n.y][n.x] != '#' && !prevLayer.contains(n) && !currLayer.contains(n)) nextLayer.add(n);
				n = new Point(p.x + 1, p.y);  if (grid[n.y][n.x] != '#' && !prevLayer.contains(n) && !currLayer.contains(n)) nextLayer.add(n);
				n = new Point(p.x, p.y - 1);  if (grid[n.y][n.x] != '#' && !prevLayer.contains(n) && !currLayer.contains(n)) nextLayer.add(n);
				n = new Point(p.x, p.y + 1);  if (grid[n.y][n.x] != '#' && !prevLayer.contains(n) && !currLayer.contains(n)) nextLayer.add(n);
			}
			prevLayer = currLayer;
			currLayer = nextLayer;
			dist++;
		}
		throw new IllegalArgumentException();
	}
	
	
	private static Point find(char[][] grid, char target) {
		for (int y = 0; y < grid.length; y++) {
			for (int x = 0; x < grid[0].length; x++) {
				if (grid[y][x] == target)
					return new Point(x, y);
			}
		}
		throw new IllegalArgumentException();
	}
	
	
	
	private static class Point {
		
		public final int x;
		public final int y;
		
		
		public Point(int x, int y) {
			this.x = x;
			this.y = y;
		}
		
		
		public boolean equals(Object obj) {
			if (obj instanceof Point) {
				Point other = (Point)obj;
				return x == other.x && y == other.y;
			} else
				return false;
		}
		
		
		public int hashCode() {
			return x + y;
		}
		
	}
	
}
