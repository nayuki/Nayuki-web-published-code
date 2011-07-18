// DWITE - October 2005 - Problem 3: Sum 'Em Up
// Solution by Nayuki Minase


public final class dwite200510p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA31.txt", "OUT31.txt", new dwite200510p3());
	}
	
	
	protected void runOnce() {
		// Read input
		io.tokenizeLine();
		int a = io.readIntToken();
		int b = io.readIntToken();
		
		// Let a be smaller than or equal to b, swapping if necessary
		if (a > b) {
			int temp = a;
			a = b;
			b = temp;
		}
		
		// Compute the sum a + a+1 + a+2 + ... + b-2 + b-1 + b in closed form
		int sum = (b-a+1) * (a+b) / 2;  // Alternatively, b*(b+1)/2 - a*(a-1)/2
		
		// Build the summation expression
		StringBuffer sb = new StringBuffer();
		for (int i = a; i <= b; i++) {
			if (i != a)  // Suppress the plus for the leading number
				sb.append("+");
			sb.append(i);
		}
		
		// Write output
		io.printf("%s=%d%n", sb, sum);
	}
	
}
