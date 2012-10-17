/* 
 * DWITE - February 2005 - Problem 5: Tsunami Speed
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite200502p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA51.txt", "OUT51.txt", new dwite200502p5());
	}
	
	
	protected void runOnce() {
		// Read input
		int h = io.readIntLine();         // Water depth in metres
		int d = io.readIntLine() * 1000;  // Distance in metres
		
		// Compute and write output
		double c = Math.sqrt(9.8 * h);  // Wave speed in metres per second
		long time = Math.round(d / c);  // Travel time in seconds
		io.printf("%d hour(s) %d minute(s) %d second(s)%n", time / 3600, time / 60 % 60, time % 60);
	}
	
}
