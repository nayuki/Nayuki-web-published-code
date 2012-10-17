/* 
 * DWITE - February 2005 - Problem 1: Bretschneider's Formula
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite200502p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA11.txt", "OUT11.txt", new dwite200502p1());
	}
	
	
	private static final int[] x = { 1, -1, -2,  2,  2, -2, -3,  1,  3, -1, -4,  3,  4, -4, -4,  4,  2, -4, -2,  1};
	private static final int[] y = { 1,  2, -1, -2,  2,  3, -3, -3,  3,  4, -2, -5,  5,  5, -5, -5,  4,  1, -4, -1};
	
	
	protected void runOnce() {
		String s = io.readLine();
		int a = s.charAt(0) - 'A';
		int b = s.charAt(1) - 'A';
		int c = s.charAt(2) - 'A';
		int d = s.charAt(3) - 'A';
		long area = Math.round(getArea(a, b, c, d) * 10);
		io.printf("%d.%d%n", area / 10, area % 10);
	}
	
	
	// Each of a, b, c, d is the index of a point
	private static double getArea(int a, int b, int c, int d) {
		int temp = distSqr(b, c) + distSqr(d, a) - distSqr(a, b) - distSqr(c, d);
		return Math.sqrt(4 * distSqr(b, d) * distSqr(a, c) - temp * temp) / 4;
	}
	
	
	// Each of a, b is the index of a point
	private static int distSqr(int a, int b) {
		int dx = x[a] - x[b];
		int dy = y[a] - y[b];
		return dx * dx + dy * dy;
	}
	
}
