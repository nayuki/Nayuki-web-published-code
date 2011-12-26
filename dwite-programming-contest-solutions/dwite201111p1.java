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
		for (int stepSize = 1; n > 0; stepSize++) {
			int temp = Math.min(stepSize, n);
			if (stepSize % 2 == 1)
				x += temp;
			else
				y -= temp;
			n -= temp;
		}
		
		io.printf("%d %d%n", x, y);
	}
	
}
