/* 
 * DWITE - October 2009 - Problem 4: My First True Letter
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite200910p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA4.txt", "OUT4.txt", new dwite200910p4());
	}
	
	
	protected void runOnce() {
		String line = io.readLine();
		for (int i = 0; i < line.length(); i++) {
			char c = line.charAt(i);
			if (line.indexOf(c, i + 1) == -1 && line.lastIndexOf(c, i - 1) == -1) {
				io.println(c + "");
				return;
			}
		}
		throw new IllegalArgumentException();
	}
	
}
