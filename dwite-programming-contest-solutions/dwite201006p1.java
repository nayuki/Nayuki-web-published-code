// DWITE - June 2010 - Problem 1: Binary Equipment
// Solution by Nayuki Minase


public final class dwite201006p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA1.txt", "OUT1.txt", new dwite201006p1());
	}
	
	
	protected void runOnce() {
		io.tokenizeLine();
		int equipped = io.readIntToken();
		int item = io.readIntToken();
		if (equipped < 0 || equipped >= 256 || item < 0 || item >= 8)
			throw new IllegalArgumentException();
		io.println((equipped >>> item) & 1);
	}
	
}
