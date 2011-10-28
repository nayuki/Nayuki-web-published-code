// DWITE - October 2011 - Problem 4: C001 Numbers
// Solution by Nayuki Minase


public final class dwite201110p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA4.txt", "OUT4.txt", new dwite201110p4());
	}
	
	
	protected void runOnce() {
		io.println(getCoolnessFast(io.readIntLine()));
	}
	
	
	// Coolness for [0, n] in essentially constant time.
	private static int getCoolnessFast(int n) {
		int sum = n / 10 + 1;  // Initially, this is the number of times the ones digit is 0
		n++;
		for (int i = 1; i <= 8; i++) {
			int tenpow = pow(10, i);
			int nexttenpow = pow(10, i + 1);
			sum += Math.max(n / nexttenpow - 1, 0) * tenpow;
			if (n > nexttenpow)
				sum += Math.min(n % nexttenpow, tenpow);
		}
		return sum;
	}
	
	// Returns x ^ y.
	private static int pow(int x, int y) {
		int z = 1;
		for (int i = 0; i < y; i++)
			z *= x;
		return z;
	}
	
	
	// Coolness for [0, n].
	@SuppressWarnings("unused")
	private static int getCoolnessSlow(int n) {
		int sum = 0;
		for (int i = 0; i <= n; i++)
			sum += coolness(i);
		return sum;
	}
	
	// Coolness for just n.
	private static int coolness(int n) {
		int count = 0;
		do {
			if (n % 10 == 0)
				count++;
			n /= 10;
		} while (n != 0);
		return count;
	}
	
}
