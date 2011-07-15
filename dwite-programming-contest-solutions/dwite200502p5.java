// DWITE - February 2005 - Problem 5: Tsunami Speed

import dwite.*;


public final class dwite200502p5 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA51.txt", "OUT51.txt", new dwite200502p5());
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
