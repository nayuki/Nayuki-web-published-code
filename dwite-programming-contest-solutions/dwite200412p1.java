// DWITE - December 2004 - Problem 1: Prime Factorization
// Solution by Nayuki Minase


public final class dwite200412p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA11.txt", "OUT11.txt", new dwite200412p1());
	}
	
	
	protected void runOnce() {
		io.println(factor(io.readIntLine()));
	}
	
	
	private static String factor(int x) {
		for (int i = 2, end = DwiteAlgorithm.sqrt(x); i <= end; i++) {
			if (x % i == 0)
				return String.format("%d*%s", i, factor(x / i));  // x is composite
		}
		return Integer.toString(x);  // x is prime
	}
	
}
