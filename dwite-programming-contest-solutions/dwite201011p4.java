/* 
 * DWITE - November 2010 - Problem 4: Fractions to Decimal
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.HashMap;
import java.util.Map;


public final class dwite201011p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA4.txt", "OUT4.txt", new dwite201011p4());
	}
	
	
	protected void runOnce() {
		io.tokenizeLine();
		int n = io.readIntToken();
		int d = io.readIntToken();
		if (!(1 <= n && n < d))
			throw new IllegalArgumentException();

		io.print("0.");
		Map<Integer,Integer> stateToIndex = new HashMap<Integer,Integer>();
		StringBuilder sb = new StringBuilder();
		while (true) {
			if (n == 0) {
				io.println(sb.toString());
				break;
			}
			if (stateToIndex.containsKey(n)) {
				int index = stateToIndex.get(n);
				io.printf("%s(%s)%n", sb.substring(0, index), sb.substring(index));
				break;
			}
			stateToIndex.put(n, sb.length());
			n *= 10;
			sb.append(n / d);
			n %= d;
		}
	}
	
}
