// DWITE - November 2006 - Problem 3: Linear Binomial Products

import dwite.*;


public final class dwite200611p3 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA31.txt", "OUT31.txt", new dwite200611p3());
	}
	
	
	protected void runOnce() {
		// Read input (the coefficients for (ax+b) and (cx+d))
		io.tokenizeLine();
		int a = io.readIntToken();
		int b = io.readIntToken();
		int c = io.readIntToken();
		int d = io.readIntToken();
		
		// Calculate the coefficients for (a2 x^2 + a1 x + a0). Using the distributive property, of course.
		int a2 = a * c;
		int a1 = a * d + b * c;
		int a0 = b * d;
		
		// Write output
		io.printf("(%s)(%s)=%s%n", formatPolynomial(a, b), formatPolynomial(c, d), formatPolynomial(a2, a1, a0));
	}
	
	
	private static String formatPolynomial(int... coefs) {
		StringBuilder sb = new StringBuilder();
		boolean leading = true;
		for (int i = 0; i < coefs.length; i++) {
			if (coefs[i] != 0) {
				sb.append(formatCoefficient(coefs[i], coefs.length - 1 - i, leading));
				leading = false;
			}
		}
		
		if (leading)  // The polynomial has only coefficients of zero
			return "0";
		else  // Otherwise, the polynomial is not uniformly zero
			return sb.toString();
	}
	
	
	private static String formatCoefficient(int coef, int power, boolean isLeading) {
		String sign;
		if      (coef > 0 &&  isLeading) sign = "";
		else if (coef > 0 && !isLeading) sign = "+";
		else if (coef < 0              ) sign = "-";
		else throw new IllegalArgumentException("Formatting zero coefficient not supported");
			
		String num;
		if (power != 0 && (coef == -1 || coef == 1)) num = "";
		else num = Integer.toString(Math.abs(coef));
		return sign + num + formatPowerOfX(power);
	}
	
	
	private static String formatPowerOfX(int power) {
		if (power == 0) return "";
		else if (power == 1) return "x";
		else return "x^" + power;
	}
	
}
