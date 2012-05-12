// DWITE - January 2012 - Problem 2: Prime Time
// Solution by Nayuki Minase

import java.util.*;


public final class dwite201201p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA2.txt", "OUT2.txt", new dwite201201p2());
	}
	
	
	private static int[] smallestPrimeFactor = new int[10001];
	
	static {
		// Modified sieve of Eratosthenes
		for (int i = 2; i < smallestPrimeFactor.length; i++) {
			if (smallestPrimeFactor[i] == 0) {  // i is prime
				for (int j = i; j < smallestPrimeFactor.length; j += i) {
					if (smallestPrimeFactor[j] == 0)
						smallestPrimeFactor[j] = i;
				}
			}
		}
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		Map<Integer,Integer> factors = new TreeMap<Integer,Integer>();
		for (int i = 1; i <= n; i++) {
			int temp = i;
			while (temp != 1) {
				int p = smallestPrimeFactor[temp];
				if (!factors.containsKey(p))
					factors.put(p, 0);
				factors.put(p, factors.get(p) + 1);
				temp /= p;
			}
		}
		
		boolean head = true;
		for (int p : factors.keySet()) {
			if (head)
				head = false;
			else
				io.print(" * ");
			io.print(p + "^" + factors.get(p));
		}
		io.println();
	}
	
}
