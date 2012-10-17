/* 
 * DWITE - January 2010 - Problem 3: Moving at the same time
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.Arrays;


public final class dwite201001p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite201001p3());
	}
	
	
	protected void runOnce() {
		String line = io.readLine();
		for (int i = 0; i < 5; i++)
			io.println(iterate(line, i));
	}
	
	
	private static String iterate(String line, int steps) {
		char[] result = new char[line.length()];
		Arrays.fill(result, '.');
		
		for (int i = 0; i < line.length(); i++) {
			char c = line.charAt(i);
			if (c >= '0' && c <= '9') {
				int index = i + (c - '0') * steps;
				if (index < result.length) {
					if (result[index] == '.')
						result[index] = '0';
					result[index] += c - '0';
				}
			}
		}
		return new String(result);
	}
	
}
