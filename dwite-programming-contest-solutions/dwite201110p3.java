// DWITE - October 2011 - Problem 3: Take a Walk
// Solution by Nayuki Minase


public final class dwite201110p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite201110p3());
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		
		Vector[] points = new Vector[n];
		for (int i = 0; i < n; i++) {
			io.tokenizeLine();
			points[i] = new Vector(io.readDoubleToken(), io.readDoubleToken());
		}
		
		io.tokenizeLine();
		Vector candyStore = new Vector(io.readDoubleToken(), io.readDoubleToken());
		
		double distSqr = Double.POSITIVE_INFINITY;
		for (int i = 0; i < n; i++) {
			distSqr = Math.min(points[i].dist(candyStore), distSqr);
			if (i < n - 1)
				distSqr = Math.min(minDistSqr(points[i], points[i + 1], candyStore), distSqr);
		}
		io.printf("%.2f%n", Math.sqrt(distSqr));
	}
	
	
	private static double minDistSqr(Vector lineSegStart, Vector lineSegEnd, Vector point) {
		if (lineSegStart.equals(lineSegEnd))
			return Double.POSITIVE_INFINITY;
		
		Vector vec = point.sub(lineSegStart);
		Vector dir = lineSegEnd.sub(lineSegStart);
		double dotProd = vec.dot(dir);
		double t = dotProd / dir.normSqr();
		if (0 <= t && t <= 1)
			return vec.normSqr() - t * dotProd;
		else
			return Double.POSITIVE_INFINITY;
	}
	
	
	
	private static class Vector {
		
		public final double x;
		public final double y;
		
		
		public Vector(double x, double y) {
			this.x = x;
			this.y = y;
		}
		
		
		public Vector sub(Vector v) {
			return new Vector(x - v.x, y - v.y);
		}
		
		public double dot(Vector v) {
			return x * v.x + y * v.y;
		}
		
		public double dist(Vector v) {
			return this.sub(v).normSqr();
		}
		
		public double normSqr() {
			return x * x + y * y;
		}
		
		public boolean equals(Object obj) {
			if (obj instanceof Vector) {
				Vector other = (Vector)obj;
				return x == other.x && y == other.y;
			} else
				return false;
		}
		
	}
	
}
