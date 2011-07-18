// DWITE - October 2004 - Problem 1: Area of Circle
// Solution by Nayuki Minase


public final class dwite200410p1 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA1", "OUT1", new dwite200410p1());
	}
	
	
	protected void runOnce() {
		io.tokenizeLine();
		double x1 = io.readDoubleToken();
		double y1 = io.readDoubleToken();
		double x2 = io.readDoubleToken();
		double y2 = io.readDoubleToken();
		io.printf("%.3f%n", 3.14159 * distanceSquared(x1, y1, x2, y2));
	}
	
	
	private static double distanceSquared(double x0, double y0, double x1, double y1) {
		return magnitudeSquared(x0 - x1, y0 - y1);
	}
	
	private static double magnitudeSquared(double x, double y) {
		return x * x + y * y;
	}
	
}
