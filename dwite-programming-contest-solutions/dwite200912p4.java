// DWITE - December 2009 - Problem 4: Spiral Out
// Solution by Nayuki Minase


public final class dwite200912p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA4.txt", "OUT4.txt", new dwite200912p4());
	}
	
	
	protected void runOnce() {
		// It's not worth the effort to write an algorithm to generate the spiral,
		// so I just manually created it and hard-coded the values.
		int[][] spiral = {
			{20, 19, 18, 17, 16},
			{21,  6,  5,  4, 15},
			{22,  7,  0,  3, 14},
			{23,  8,  1,  2, 13},
			{24,  9, 10, 11, 12},
		};
		
		int n = io.readIntLine();
		
		// Filter
		for (int y = 0; y < spiral.length; y++) {
			for (int x = 0; x < spiral[y].length; x++) {
				if (spiral[y][x] > n)
					spiral[y][x] = -1;
			}
		}
		
		// Find bounds
		int minX = spiral[0].length - 1;
		int maxX = 0;
		int minY = spiral.length - 1;
		int maxY = 0;
		for (int y = 0; y < spiral.length; y++) {
			for (int x = 0; x < spiral[y].length; x++) {
				if (spiral[y][x] != -1) {
					minX = Math.min(x, minX);
					maxX = Math.max(x, maxX);
					minY = Math.min(y, minY);
					maxY = Math.max(y, maxY);
				}
			}
		}
		
		// Print
		for (int y = minY; y <= maxY; y++) {
			for (int x = minX; x <= maxX; x++) {
				if (spiral[y][x] != -1)
					io.print(spiral[y][x]);
				else
					io.print(".");
			}
			io.println();
		}
	}
	
}
