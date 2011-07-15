// DWITE - December 2004 - Problem 3: Reflections

import dwite.*;


public final class dwite200412p3 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA31.txt", "OUT31.txt", new dwite200412p3());
	}
	
	
	protected void runOnce() {
		// Read input
		double length     = io.readDoubleLine();  // Variable L
		double separation = io.readDoubleLine();  // Variable D
		double angle      = io.readDoubleLine();  // Variable x
		
		// Compute and write output
		double refldist = separation / Math.tan(Math.toRadians(angle));  // Horizontal distance between reflections
		io.println((int)Math.floor(length / refldist + 0.5));
	}
	
}
