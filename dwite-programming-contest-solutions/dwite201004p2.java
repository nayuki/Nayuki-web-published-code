/* 
 * DWITE - April 2010 - Problem 2: Round to power of two
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite201004p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA2.txt", "OUT2.txt", new dwite201004p2());
	}
	
	
	protected void runOnce() {
		io.println(round(io.readIntLine()));
	}
	
	
	private static int round(int n) {
		switch (n) {
			case 0:   return 1;
			case 1:   return 1;
			case 2:   return 2;
			case 3:   return 4;
			default:  return round(n / 2) * 2;
		}
	}
	
}
