// DWITE - November 2004 - Problem 2: Squareland

import dwite.*;


public final class dwite200411p2 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA21.txt", "OUT21.txt", new dwite200411p2());
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();  // The total number of lots
		int s = io.readIntLine();  // The size of a lot to choose
		int csqrt = Algorithm.sqrt(n) - Algorithm.sqrt(s) + 1;  // The number of choices along one dimension
		io.println(csqrt * csqrt);
	}
	
}
