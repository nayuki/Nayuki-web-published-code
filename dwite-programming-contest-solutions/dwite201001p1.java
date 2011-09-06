// DWITE - January 2010 - Problem 1: Social Media Overload
// Solution by Nayuki Minase


public final class dwite201001p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA1.txt", "OUT1.txt", new dwite201001p1());
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		io.println(Math.round((double)30 * 5 * 60 / n));
	}
	
}
