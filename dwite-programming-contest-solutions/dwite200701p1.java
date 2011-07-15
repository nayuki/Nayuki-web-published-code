// DWITE - January 2007 - Problem 1: Filling The Cone

import dwite.*;


public final class dwite200701p1 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA11.txt", "OUT11.txt", new dwite200701p1());
	}
	
	
	protected void runOnce() {
		// Read input
		double coneHeight  = io.readDoubleLine();
		double coneRadius  = io.readDoubleLine();
		double watervolume = io.readDoubleLine();
		
		// Compute and write output
		double waterHeight = Math.cbrt(watervolume / (Math.PI * coneRadius * coneRadius * coneHeight / 3)) * coneHeight;
		io.printf("%.2f%n", waterHeight);
	}
	
}
