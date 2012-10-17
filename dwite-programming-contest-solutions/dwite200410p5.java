/* 
 * DWITE - October 2004 - Problem 5: Super Long Sums
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.math.BigInteger;


public final class dwite200410p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5", "OUT5", new dwite200410p5());
	}
	
	
	protected void runOnce() {
		String x = io.readLine();
		String y = io.readLine();
		io.println(new BigInteger(x).add(new BigInteger(y)).toString());  // Easy version
		//io.println(add(x, y));  // Hard version
	}
	
	
	@SuppressWarnings("unused")
	private static String add(String x, String y) {  // x and y each must have at least 1 digit
		StringBuilder sb = new StringBuilder();
		int carry = 0;
		for (int i = 0; i < Math.max(x.length(), y.length()); i++) {
			int sum = carry;
			if (i < x.length()) sum += x.charAt(x.length() - 1 - i) - '0';
			if (i < y.length()) sum += y.charAt(y.length() - 1 - i) - '0';
			sb.insert(0, sum % 10);
			carry = sum / 10;
		}
		if (carry > 0)
			sb.insert(0, carry);
		return sb.toString();
	}
	
}
