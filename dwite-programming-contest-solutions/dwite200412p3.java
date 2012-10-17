/* 
 * DWITE - December 2004 - Problem 3: Reflections
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite200412p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA31.txt", "OUT31.txt", new dwite200412p3());
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
