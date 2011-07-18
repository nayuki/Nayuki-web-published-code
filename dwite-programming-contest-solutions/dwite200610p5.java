// DWITE - October 2006 - Problem 5: Bad Input II
// Solution by Nayuki Minase

import java.math.BigInteger;


public final class dwite200610p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA51.txt", "OUT51.txt", new dwite200610p5());
	}
	
	
	protected void runOnce() {
		String a = io.readLine().replaceAll("[^0-9]", "");
		String b = io.readLine().replaceAll("[^0-9]", "");
		io.println(new BigInteger(a).add(new BigInteger(b)).toString());
	}
	
}
