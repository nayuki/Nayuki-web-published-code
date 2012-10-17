/* 
 * DWITE - January 2005 - Problem 2: Minesweeper
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.HashMap;
import java.util.Map;
import java.util.SortedSet;
import java.util.TreeSet;


public final class dwite200501p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA21.txt", "OUT21.txt", new dwite200501p2());
	}
	
	
	private char[][] grid;
	
	
	public void run() {
		// Read input
		io.tokenizeLine();
		int h = io.readIntToken();
		int w = io.readIntToken();
		grid = new char[h + 2][w + 2];  // Padded
		Map<Character,Point> queries = new HashMap<Character,Point>();
		for (int y = 0; y < h; y++) {
			String line = io.readLine();
			for (int x = 0; x < w; x++) {
				char c = line.charAt(x);
				if (c >= 'a' && c <= 'z')
					queries.put(c, new Point(x, y));
				else if (c != '.' && c != '*')
					throw new AssertionError("Invalid cell");
				grid[y + 1][x + 1] = c;
			}
		}
		
		// Process queries and write output
		SortedSet<Character> querykeys = new TreeSet<Character>(queries.keySet());
		for (Character key : querykeys) {
			Point p = queries.get(key);
			int mines = countNeighborMines(p.x, p.y);
			io.printf("%c-%d%n", key, mines);
		}
	}
	
	
	// Uses the Moore neighbourhood
	private int countNeighborMines(int x, int y) {
		int count = 0;
		for (int dy = -1; dy <= 1; dy++) {
			for (int dx = -1; dx <= 1; dx++) {
				if ((dx != 0 || dy != 0) && grid[y + 1 + dy][x + 1 + dx] == '*')
					count++;
			}
		}
		return count;
	}
	
	
	
	private static class Point {
		
		public final int x;
		public final int y;
		
		
		public Point(int x, int y) {
			this.x = x;
			this.y = y;
		}
		
		
		public String toString() {
			return String.format("(%d, %d)", x, y);
		}
		
	}
	
}
