// DWITE - March 2010 - Problem 2: Round to Second Prime
// Solution by Nayuki Minase


public final class dwite201003p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA2.txt", "OUT2.txt", new dwite201003p2());
	}
	
	
	private static boolean[] isPrime = DwiteAlgorithm.sievePrimes(150);
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		
		int low = n;
		do low--;
		while (!isPrime[low]);
		do low--;
		while (!isPrime[low]);
		
		int high = n;
		do high++;
		while (!isPrime[high]);
		do high++;
		while (!isPrime[high]);
		
		if (high - n <= n - low)
			io.println(high);
		else
			io.println(low);
	}
	
}
