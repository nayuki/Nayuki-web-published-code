// DWITE - November 2009 - Problem 3: Binary Test String
// Solution by Nayuki Minase


public final class dwite200911p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite200911p3());
	}
	
	
	protected void runOnce() {
		String pattern = io.readLine();
		for (int i = 0; i < 16; i++) {
			if (toBinaryString(i, 4).indexOf(pattern) == -1)
				io.println(toBinaryString(i, 4));
		}
	}
	
	
	private static String toBinaryString(int x, int digits) {
		String s = Integer.toString(x, 2);
		while (s.length() < digits)
			s = "0" + s;
		return s;
	}
	
}
