// DWITE - June 2010 - Problem 5: Snapper Chain
// Solution by Nayuki Minase


public final class dwite201006p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5.txt", "OUT5.txt", new dwite201006p5());
	}
	
	
	protected void runOnce() {
		io.tokenizeLine();
		int n = io.readIntToken();
		int k = io.readIntToken();
		
		// The snappers act like a binary counter.
		// The light is on if and only if k == -1 mod 2^n
		io.println(((k + 1) & ((1 << n) - 1)) == 0 ? "ON" : "OFF");
	}
	
}
