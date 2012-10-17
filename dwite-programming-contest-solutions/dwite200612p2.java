/* 
 * DWITE - December 2006 - Problem 2: Ulam Spiral Walkway
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite200612p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA21.txt", "OUT21.txt", new dwite200612p2());
	}
	
	
	protected void runOnce() {
		// Read input
		io.tokenizeLine();
		int m = io.readIntToken();
		int n = io.readIntToken();
		
		// Compute and write output
		Point p0 = new Point(m);
		Point p1 = new Point(n);
		io.println(p0.distance(p1));
	}
	
	
	
	private static class Point {
		
		private int x;
		private int y;
		
		
		public Point(int n) {
			int s = ceilingSqrt(n);
			if (s % 2 == 0) {
				x = 0 - (s - 2) / 2;
				y = 1 + (s - 2) / 2;
				n = s * s - n;  // 0 <= n <= (s-1)*2
				x += Math.min(n, s - 1);
				n -= Math.min(n, s - 1);
				y -= n;
			} else {
				x = 0 + (s - 1) / 2;
				y = 0 - (s - 1) / 2;
				n = s * s - n;  // 0 <= n <= (s-1)*2
				x -= Math.min(n, s - 1);
				n -= Math.min(n, s - 1);
				y += n;
			}
			
		}
		
		
		public double distance(Point other) {
			int dx = Math.abs(x - other.x);
			int dy = Math.abs(y - other.y);
			int diag = Math.min(dx, dy);
			return diag * 1.5 + (dx - diag) + (dy - diag);
		}
		
		
		public String toString() {
			return String.format("(%d, %d)", x, y);
		}
		
		
		// Returns the smallest number y such that y*y >= x.
		private static int ceilingSqrt(int x) {
			int y = 0xFFFF;
			for (int i = 15; i >= 0; i--) {
				y ^= 1 << i;
				if (y <= 46340 && y * y < x)
					y |= 1 << i;
			}
			return y;
		}
		
	}
	
}
