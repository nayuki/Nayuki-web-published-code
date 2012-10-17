/* 
 * DWITE - December 2010 - Problem 3: Dominos Tiling
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite201012p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite201012p3());
	}
	
	
	// tilings[i] is the number of ways to tile an (i*2) x 3 rectangle with dominoes, allowing tilings that can be split vertically
	private static long[] tilings;
	
	static {
		tilings = new long[16];
		for (int i = 0; i < tilings.length; i++) {
			tilings[i] = countTilingsWithoutSplits(i * 2);
			
			// Accumulate all choices for the leftmost split
			for (int j = 1; j < i; j++) {
				tilings[i] += countTilingsWithoutSplits(j * 2) * tilings[i - j];
				tilings[i] %= 1000000;
			}
		}
	}
	
	
	/*
	 * Returns the number of vertically indivisible ways to tile an n x 3 rectangle with dominoes.
	 */
	private static long countTilingsWithoutSplits(int n) {
		if (n < 0)
			throw new IllegalArgumentException();
		else if (n % 2 != 0)  // Odd number
			return 0;
		
		// The 0 x 3 empty board can be tiled in one way.
		else if (n == 0)
			return 1;
		
		/*
		 * Tilings for 2 x 3:
		 * +---+  +-+-+  +---+
		 * |o o|  |o|o|  |o o|
		 * +---+  | | |  +-+-+
		 * |o o|  |o|o|  |o|o|
		 * +---+  +-+-+  | | |
		 * |o o|  |o o|  |o|o|
		 * +---+  +---+  +-+-+
		 */
		else if (n == 2)
			return 3;
		
		/*
		 * For n x 3, we have these two vertically indivisible tilings that look like this:
		 * +-+---+-+  +---+---+
		 * |o|o o|o|  |o o|o o|
		 * | +---+ |  +-+---+-+
		 * |o|o o|o|  |o|o o|o|
		 * +-+---+-+  | +---+ |
		 * |o o|o o|  |o|o o|o|
		 * +---+---+  +-+---+-+
		 */
		else
			return 2;
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		if (n % 2 == 0)
			io.println(tilings[n / 2]);
		else
			io.println(0);
	}
	
}
