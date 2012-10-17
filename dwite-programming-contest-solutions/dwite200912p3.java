/* 
 * DWITE - December 2009 - Problem 3: Binary Test Strings 2
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite200912p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite200912p3());
	}
	
	
	protected void runOnce() {
		String pattern = io.readLine();
		int sum = 0;
		for (int i = 0; i < 256; i++) {
			if (toBinaryString(i, 8).indexOf(pattern) == -1)
				sum += hammingWeight(i);
		}
		io.println(sum);
	}
	
	
	private static String toBinaryString(int x, int digits) {
		String s = Integer.toString(x, 2);
		while (s.length() < digits)
			s = "0" + s;
		return s;
	}
	
	
	private static int hammingWeight(int x) {
		int sum = 0;
		while (x != 0) {
			sum += x & 1;
			x >>>= 1;
		}
		return sum;
	}
	
}
