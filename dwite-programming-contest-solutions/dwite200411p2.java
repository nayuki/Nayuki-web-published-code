// DWITE - November 2004 - Problem 2: Squareland
// Solution by Nayuki Minase


public final class dwite200411p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA21.txt", "OUT21.txt", new dwite200411p2());
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();  // The total number of lots
		int s = io.readIntLine();  // The size of a lot to choose
		int csqrt = DwiteAlgorithm.sqrt(n) - DwiteAlgorithm.sqrt(s) + 1;  // The number of choices along one dimension
		io.println(csqrt * csqrt);
	}
	
}
