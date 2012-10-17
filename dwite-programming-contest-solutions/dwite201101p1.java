/* 
 * DWITE - January 2011 - Problem 1: Future Printer
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite201101p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA1.txt", "OUT1.txt", new dwite201101p1());
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		int width = n % 2 == 0 ? n - 1 : n;
		for (int i = 0; i < n; i++) {
			int w = i % 2 == 0 ? i + 1 : i;
			print(".", (width - w) / 2);
			print("*", w);
			print(".", (width - w) / 2);
			io.println();
		}
	}
	
	
	private void print(String s, int n) {
		for (int i = 0; i < n; i++)
			io.print(s);
	}
	
}
