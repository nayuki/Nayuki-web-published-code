// DWITE - November 2004 - Problem 3: Factoring

import dwite.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;


public final class dwite200411p3 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA31.txt", "OUT31.txt", new dwite200411p3());
	}
	
	
	protected void runOnce() {
		// Read input
		Polynomial poly = readPolynomial(io);
		
		// Find factors
		ArrayList<Integer> output = new ArrayList<Integer>();
		int a0 = poly.getCoefficient(poly.getDegree());
		while (true) {
			int[] root = findRoot(poly);
			if (root == null)
				break;
			output.add(a0 / root[0] * root[1]);
			poly = poly.divide(root[0], root[1]);
		}
		
		// Sort ascending and write output
		Collections.sort(output);
		boolean initial = true;
		for (int i : output) {
			if (initial) initial = false;
			else io.print(" ");
			io.print(i);
		}
		io.println();
	}
	
	
	private static Polynomial readPolynomial(Io io) {
		io.tokenizeLine();
		int degree = io.readIntToken();
		List<Integer> coef = new ArrayList<Integer>();
		for (int i = 0; i < degree + 1; i++)
			coef.add(io.readIntToken());
		Collections.reverse(coef);
		return new Polynomial(coef);
	}
	
	
	private static int[] findRoot(Polynomial poly) {
		int p = Math.abs(poly.getCoefficient(0));
		int q = Math.abs(poly.getCoefficient(poly.getDegree()));
		for (int i = 1; i <= p; i++) {
			if (p % i == 0) {  // Find a factor of p
				for (int j = 1; j <= q; j++) {
					if (q % j == 0) {  // Find a factor of q
						if (poly.hasRootAt( j, i)) return new int[]{ j, i};
						if (poly.hasRootAt(-j, i)) return new int[]{-j, i};
					}
				}
			}
		}
		return null;
	}
	
	
	
	private static class Polynomial {
		
		private final List<Integer> coefficients;  // From lowest power upward
		
		
		
		public Polynomial(List<Integer> coef) {
			coefficients = new ArrayList<Integer>(coef);
		}
		
		
		
		public int getDegree() {
			return coefficients.size() - 1;
		}
		
		
		// Returns the coefficient of the monomial with the specified power.
		public int getCoefficient(int i) {
			return coefficients.get(i);
		}
		
		
		public boolean hasRootAt(int c, int d) {
			return divide(c, d) != null;
		}
		
		
		// Returns a new polynomial representing this polynomial divided by (cx - d).
		public Polynomial divide(int c, int d) {
			List<Integer> coef = new ArrayList<Integer>();
			int remainder = 0;
			for (int i = getDegree(); i >= 1; i--) {
				remainder += getCoefficient(i);
				if (remainder % c != 0)
					return null;
				int quotient = remainder / c;
				coef.add(quotient);
				remainder = quotient * d;
			}
			
			if (getCoefficient(0) + remainder == 0) {
				Collections.reverse(coef);
				return new Polynomial(coef);
			} else
				return null;
		}
		
		
		public String toString() {
			StringBuilder sb = new StringBuilder();
			boolean initial = true;
			for (int i = getDegree(); i >= 0; i--) {
				if (initial) {
					if (getCoefficient(i) < 0)
						sb.append("-");
					initial = false;
				} else {
					if (getCoefficient(i) >= 0)
						sb.append(" + ");
					else
						sb.append(" - ");
				}
				sb.append(Math.abs(getCoefficient(i))).append(" x^").append(i);
			}
			return sb.toString();
		}
		
	}
	
}
