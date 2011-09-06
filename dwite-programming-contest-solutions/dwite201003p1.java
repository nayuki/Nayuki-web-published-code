// DWITE - March 2010 - Problem 1: ASCII bar graphs
// Solution by Nayuki Minase


public final class dwite201003p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA1.txt", "OUT1.txt", new dwite201003p1());
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		if (n >= 0) {
			print("-", 5);
			io.print("|");
			print("*", n);
			print("-", 5 - n);
		} else {
			print("-", 5 + n);
			print("*", -n);
			io.print("|");
			print("-", 5);
		}
		io.println();
	}
	
	
	private void print(String s, int n) {
		for (int i = 0; i < n; i++)
			io.print(s);
	}
	
}
