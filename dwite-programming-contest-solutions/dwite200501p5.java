// DWITE - January 2005 - Problem 5: Different Bases Multiplication
// Solution by Nayuki Minase


public final class dwite200501p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA51.txt", "OUT51.txt", new dwite200501p5());
	}
	
	
	protected void runOnce() {
		io.tokenizeLine();
		String xstr = io.readToken();
		String xbase = io.readToken();
		int x = Integer.parseInt(xstr, Integer.parseInt(xbase));
		
		io.tokenizeLine();
		String ystr = io.readToken();
		String ybase = io.readToken();
		int y = Integer.parseInt(ystr, Integer.parseInt(ybase));
		
		String outbase = io.readLine();
		io.println(Integer.toString(x * y, Integer.parseInt(outbase)));
	}
	
}
