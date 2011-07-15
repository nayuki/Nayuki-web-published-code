// DWITE - February 2006 - Problem 1: Points on a Line

import dwite.*;


public final class dwite200602p1 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA11.txt", "OUT11.txt", new dwite200602p1());
	}
	
	
	private int[] px;
	private int[] py;
	
	
	public void run() {
		// Read the points
		int n = io.readIntLine();
		px = new int[n];
		py = new int[n];
		for (int i = 0; i < n; i++) {
			io.tokenizeLine();
			px[i] = io.readIntToken();
			py[i] = io.readIntToken();
		}
		
		// Process each geometric line
		super.run();
	}
	
	
	protected void runOnce() {
		// Read input (a pair of points defining the line)
		io.tokenizeLine();
		int x1 = io.readIntToken();
		int y1 = io.readIntToken();
		int x2 = io.readIntToken();
		int y2 = io.readIntToken();
		
		// Compute
		int count = 0;
		for (int i = 0; i < px.length; i++) {
			if (areCollinear(x1, y1, x2, y2, px[i], py[i]))
				count++;
		}
		
		// Write output
		io.println(count);
	}
	
	
	private static boolean areCollinear(int x0, int y0, int x1, int y1, int x2, int y2) {
		return (x1 - x0) * (y2 - y1) == (x2 - x1) * (y1 - y0);
	}
	
}
