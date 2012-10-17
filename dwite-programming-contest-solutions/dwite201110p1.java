/* 
 * DWITE - October 2011 - Problem 1: Arab-lish Numbers
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite201110p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA1.txt", "OUT1.txt", new dwite201110p1());
	}
	
	
	protected void runOnce() {
		String str = reverse(io.readLine());  // Reverse everything
		String[] words = str.split(" ");  // Words are separated by one space
		StringBuilder sb = new StringBuilder();
		boolean head = true;
		for (String word : words) {
			if (head) head = false;
			else sb.append(" ");
			
			if (word.equals(""))
				throw new IllegalArgumentException();
			else if (word.matches("\\d+"))
				sb.append(reverse(word));  // Reverse numbers back
			else
				sb.append(word);
		}
		io.println(sb.toString());
	}
	
	
	private static String reverse(String s) {
		return new StringBuilder(s).reverse().toString();
	}
	
}
