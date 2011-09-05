// DWITE - January 2011 - Problem 3: Binary Weight
// Solution by Nayuki Minase


public final class dwite201101p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite201101p3());
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		if (n <= 0)
			throw new IllegalArgumentException();
		
		// Take the rightmost "01" and swap the digits
		for (int i = 0; i <= 30; i++) {
			if (((n >>> i) & 3) == 1) {  // Guaranteed to execute
				n ^= 3 << i;
				break;
			}
		}
		
		io.println(n);
	}
	
}
