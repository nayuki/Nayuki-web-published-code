/* 
 * DWITE - March 2010 - Problem 5: Weak Passwords
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite201003p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5.txt", "OUT5.txt", new dwite201003p5());
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		
		int[] a = new int[4];
		while (true) {
			// Check hash
			if (hash(a) == n) {
				char[] c = new char[4];
				for (int i = 0; i < 4; i++)
					c[i] = (char)(a[i] + 'A');
				io.println(new String(c));
				break;
			}
			
			// Increment
			int i = a.length - 1;
			while (i >= 0 && a[i] == 25) {
				a[i] = 0;
				i--;
			}
			if (i == -1)
				throw new IllegalArgumentException("No match");
			a[i]++;
		}
	}
	
	
	private static int hash(int[] a) {
		int[] n = new int[4];
		for (int i = 0; i < 4; i++)
			n[i] = a[i] + 'A';
		
		int k = n[0] * 1000000 + n[1] * 10000 + n[2] * 100 + n[3];
		int m = n[0] * 11 + n[1] * 101 + n[2] * 1009 + n[3] * 10007;
		
		return k % m;
	}
	
}
