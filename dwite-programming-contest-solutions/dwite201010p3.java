/* 
 * DWITE - October 2010 - Problem 3: Power tiles
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite201010p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite201010p3());
	}
	
	
	protected void runOnce() {
		io.tokenizeLine();
		int width = io.readIntToken();
		int height = io.readIntToken();
		io.println(getTileCount(width, height));
	}
	
	
	private static int getTileCount(int width, int height) {
		if (width == 0 || height == 0)                return 0;  // Nothing to tile
		else if (width % 2 == 0 && height % 2 == 0)   return getTileCount(width / 2, height / 2);           // Halving both dimensions doesn't change the number of tiles
		else if (width % 2 == 0 && height % 2 == 1)   return width  + getTileCount(width / 2, height / 2);  // Use a row of 1x1 tiles
		else if (width % 2 == 1 && height % 2 == 0)   return height + getTileCount(width / 2, height / 2);  // Use a column of 1x1 tiles
		else  /* width % 2 == 1 && height % 2 == 1 */ return width + height - 1 + getTileCount(width / 2, height / 2);  // Use a row and a column (which overlap)
	}
	
}
