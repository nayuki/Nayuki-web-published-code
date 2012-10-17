/* 
 * DWITE - December 2011 - Problem 1: Weighted Presents
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite201112p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA1.txt", "OUT1.txt", new dwite201112p1());
	}
	
	
	protected void runOnce() {
		int weight = io.readIntLine();
		
		int bestDiff = 0;
		String bestName = null;
		for (int i = 0 ; i < 4; i++) {
			io.tokenizeLine();
			String name = io.readToken();
			int w = io.readIntToken();
			
			int diff = Math.abs(w - weight);
			if (bestName == null || (diff < bestDiff || diff == bestDiff && w > weight)) {
				bestDiff = diff;
				bestName = name;
			}
		}
		
		io.println(bestName);
	}
	
}
