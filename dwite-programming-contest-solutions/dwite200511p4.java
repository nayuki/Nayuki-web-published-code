/* 
 * DWITE - November 2005 - Problem 4: Stacking Blocks
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite200511p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA41.txt", "OUT41.txt", new dwite200511p4());
	}
	
	
	private static final int MAX_HEIGHT = 32000;
	
	
	protected void runOnce() {
		int[] minBlocks = new int[MAX_HEIGHT + 1];  // minBlocks[i] is the minimum number of blocks to build a tower of height i
		minBlocks[0] = 0;
		for (int i = 1; i < minBlocks.length; i++)
			minBlocks[i] = Integer.MAX_VALUE / 2;
		
		int n = io.readIntLine();  // The number of kinds of blocks
		for (int i = 0; i < n; i++) {
			io.tokenizeLine();
			int h = io.readIntToken();
			int m = io.readIntToken();
			update(minBlocks, h, m);
		}
		
		int t = io.readIntLine();  // The desired height of the tower
		io.println(minBlocks[t]);
	}
	
	
	private static void update(int[] minBlocks, int blockHeight, int blockCount) {
		for (int i = minBlocks.length - 1; i >= 0; i--) {
			if (minBlocks[i] == Integer.MAX_VALUE / 2)
				continue;
			for (int j = 1; j <= blockCount && i + j * blockHeight < minBlocks.length; j++) {
				minBlocks[i + j * blockHeight] = Math.min(minBlocks[i] + j, minBlocks[i + j * blockHeight]);
			}
		}
	}
	
}
