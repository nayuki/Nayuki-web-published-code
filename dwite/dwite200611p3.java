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
		
		out.printf("(%s)(%s)=%s%n", formatPolynomial(a, b), formatPolynomial(c, d), formatPolynomial(a2, a1, a0));
	}
	
	
	static String formatPolynomial(int... coefs) {
		StringBuilder sb = new StringBuilder();
		boolean leading = true;
		for (int i = 0; i < coefs.length; i++) {
			if (coefs[i] != 0) {
				sb.append(formatCoefficient(coefs[i], coefs.length - 1 - i, leading));
				leading = false;
			}
		}
		
		if (leading)  // The polynomial had only coefficients of zero
			return "0";
		else
			return sb.toString();
	}
	
	
	static String formatCoefficient(int coef, int power, boolean isLeading) {
		String sign;
		if      (coef > 0 &&  isLeading) sign = "";
		else if (coef > 0 && !isLeading) sign = "+";
		else if (coef < 0              ) sign = "-";
		else throw new IllegalArgumentException("Formatting zero coefficient not supported");
			
		String num;
		if (power != 0 && (coef == -1 || coef == 1)) num = "";
		else num = Integer.toString(Math.abs(coef));
		return String.format("%s%s%s", sign, num, formatPowerOfX(power));
	}
	
	
	static String formatPowerOfX(int power) {
		if (power == 0) return "";
		else if (power == 1) return "x";
		else return String.format("x^%d", power);
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