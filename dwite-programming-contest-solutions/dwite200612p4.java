/* 
 * DWITE - December 2006 - Problem 4: The Ubiquitous 196
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.math.BigInteger;


public final class dwite200612p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA41.txt", "OUT41.txt", new dwite200612p4());
	}
	
	
	protected void runOnce() {
		BigInteger n = new BigInteger(io.readLine());
		BigInteger temp = n;
		for (int i = 0; ; i++) {
			if (i > 100) {
				io.printf("%d-UBIQUITOUS%n", n);
				break;
			} else if (isPalindrome(temp)) {
				io.printf("%d-%d-%d%n", n, i, temp);
				break;
			} else
				temp = iterate(temp);
		}
	}
	
	
	private static BigInteger iterate(BigInteger n) {
		return n.add(reverse(n));
	}
	
	
	private static boolean isPalindrome(BigInteger n) {
		return isPalindrome(n.toString());
	}
	
	
	private static boolean isPalindrome(String s) {
		return s.equals(reverse(s));
	}
	
	
	private static BigInteger reverse(BigInteger n) {
		return new BigInteger(reverse(n.toString()));
	}
	
	
	private static String reverse(String s) {
		return new StringBuffer(s).reverse().toString();
	}
	
}
