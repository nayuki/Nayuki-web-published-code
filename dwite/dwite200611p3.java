import java.io.*;
import java.util.StringTokenizer;


// DWITE - November 2006 - Problem 3: Linear Binomial Products
public class dwite200611p3 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		
		// Given the coefficients for (ax+b) and (cx+d)... 
		int a = Integer.parseInt(st.nextToken());
		int b = Integer.parseInt(st.nextToken());
		int c = Integer.parseInt(st.nextToken());
		int d = Integer.parseInt(st.nextToken());
		
		// ... calculate the coefficients for (a2 x^2 + a1 x + a0). Using the FOIL rule, of course.
		int a2 = a * c;
		int a1 = a * d + b * c;
		int a0 = b * d;
		
		out.printf("(%s)(%s)=%s%n", formatPolynomial(new int[]{a, b}), formatPolynomial(new int[]{c, d}), formatPolynomial(new int[]{a2, a1, a0}));
	}
	
	static String formatPolynomial(int[] coefs) {
		if (isZero(coefs))
			return "0";
		else {
			StringBuilder sb = new StringBuilder();
			boolean leading = true;
			for (int i = 0; i < coefs.length; i++) {
				if (coefs[i] == 0)
					continue;
				sb.append(formatCoefficient(coefs[i], coefs.length - 1 - i, leading));
				leading = false;
			}
			return sb.toString();
		}
	}
	
	static String formatCoefficient(int coef, int pow, boolean leading) {
		if (coef == 0)
			return "0";
		else {
			String sign;
			if      (coef > 0 &&  leading) sign = "";
			else if (coef > 0 && !leading) sign = "+";
			else if (coef < 0            ) sign = "-";
			else throw new AssertionError();
			
			String num;
			if (pow != 0 && (coef == -1 || coef == 1)) num = "";
			else num = Integer.toString(Math.abs(coef));
			return String.format("%s%s%s", sign, num, formatPowerOfX(pow));
		}
	}
	
	static String formatPowerOfX(int pow) {
		if (pow == 0) return "";
		else if (pow == 1) return "x";
		else return String.format("x^%d", pow);
	}
	
	static boolean isZero(int[] poly) {
		for (int i = 0; i < poly.length; i++) {
			if (poly[i] != 0)
				return false;
		}
		return true;
	}
	
	
	static String infile = "DATA31.txt";  // Specify null to use System.in
	static String outfile = "OUT31.txt";  // Specify null to use System.out
	
	public static void main(String[] args) throws IOException {
		InputStream in0;
		if (infile != null) in0 = new FileInputStream(infile);
		else in0 = System.in;
		Reader in1 = new InputStreamReader(in0, "US-ASCII");
		BufferedReader in = new BufferedReader(in1);
		
		OutputStream out0;
		if (outfile != null) out0 = new FileOutputStream(outfile);
		else out0 = System.out;
		Writer out1 = new OutputStreamWriter(out0, "US-ASCII");
		PrintWriter out = new PrintWriter(out1, true);
		
		main(in, out);
		
		in.close();
		in1.close();
		in0.close();
		out.close();
		out1.close();
		out0.close();
	}
	
}