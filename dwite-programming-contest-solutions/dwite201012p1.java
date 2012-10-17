/* 
 * DWITE - December 2010 - Problem 1: Integers along a line
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite201012p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA1.txt", "OUT1.txt", new dwite201012p1());
	}
	
	
	protected void runOnce() {
		io.tokenizeLine();
		int a = io.readIntToken();
		int b = io.readIntToken();
		int x = io.readIntToken();
		int y = io.readIntToken();
		io.println(DwiteAlgorithm.gcd(a - x, b - y) - 1);
	}
	
}
