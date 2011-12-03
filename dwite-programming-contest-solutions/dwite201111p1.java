// DWITE - November 2011 - Problem 1: Wandering Billy
// Solution by Nayuki Minase


public final class dwite201111p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA1.txt", "OUT1.txt", new dwite201111p1());
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		
		int x = 0;
		int y = 0;
		for (int i = 1; n > 0; i++) {  // For each step size
			int temp = Math.min(i, n);
			if (i % 2 == 1)
				x += temp;
			else
				y -= temp;
			n -= temp;
		}
		
		io.printf("%d %d%n", x, y);
	}
	
}
