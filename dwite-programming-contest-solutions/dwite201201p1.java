/* 
 * DWITE - January 2012 - Problem 1: Crossword Count
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite201201p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA1.txt", "OUT1.txt", new dwite201201p1());
	}
	
	
	protected void runOnce() {
		io.tokenizeLine();
		int height = io.readIntToken();
		int width = io.readIntToken();
		char[][] grid = io.readGridAndPad(width, height, '#');
		
		// Count across
		int across = 0;
		for (int i = 1; i <= height; i++) {
			for (int j = 1; j <= width; ) {
				if (grid[i][j] == '.' && grid[i][j + 1] == '.') {
					across++;
					while (grid[i][j] == '.')
						j++;
				} else
					j++;
			}
		}
		
		// Count down
		int down = 0;
		for (int j = 1; j <= width; j++) {
			for (int i = 1; i <= height; ) {
				if (grid[i][j] == '.' && grid[i + 1][j] == '.') {
					down++;
					while (grid[i][j] == '.')
						i++;
				} else
					i++;
			}
		}
		
		io.println(across + " " + down);
	}
	
}
