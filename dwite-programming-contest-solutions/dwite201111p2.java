// DWITE - November 2011 - Problem 2: Scratch Card
// Solution by Nayuki Minase

import java.util.Arrays;


public final class dwite201111p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA2.txt", "OUT2.txt", new dwite201111p2());
	}
	
	
	protected void runOnce() {
		// Read input
		io.tokenizeLine();
		int height = io.readIntToken();
		int width  = io.readIntToken();
		char[][] grid = new char[height][];
		for (int y = 0; y < height; y++) {
			grid[y] = io.readLine().toCharArray();
			if (grid[y].length != width)
				throw new IllegalArgumentException();
		}
		char[] phrase = io.readLine().toCharArray();
		
		// Try to find subsequence in grid
		int i = 0;  // Index in phrase
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++) {
				if (i < phrase.length && phrase[i] == grid[y][x]) {
					grid[y][x] = '.';
					i++;
				} else
					grid[y][x] = '#';
			}
		}
		
		if (i != phrase.length) {  // Phrase not found
			for (int y = 0; y < height; y++)
				Arrays.fill(grid[y], 'x');
		}
		
		for (int y = 0; y < height; y++)
			io.println(new String(grid[y]));
	}
	
}
