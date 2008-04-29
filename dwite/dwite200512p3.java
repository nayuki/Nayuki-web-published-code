import java.io.*;
import java.util.StringTokenizer;


// DWITE - December 2005 - Problem 3: Reducing Fractions
public class dwite200512p3 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		int n = Integer.parseInt(st.nextToken());
		int d = Integer.parseInt(st.nextToken());
		
		// Make only the numerator be possibly negative
		if (d < 0) {
			d = -d;
			n = -n;
		}
		
		// Write the sign and handle positive fractions from now on
		if (n < 0) {
			out.print("-");
			n = -n;
		}
		
		// Reduce to lowest terms
		int gcd = gcd(n, d);
		n /= gcd;
		d /= gcd;
		
		// Select the appropriate output format
		if (d == 1)     out.printf("%d%n", n);                      // Integer
		else if (n < d) out.printf("%d/%d%n", n, d);                // Simple fraction
		else            out.printf("%d %d/%d%n", n / d, n % d, d);  // Mixed fraction
	}
	
	
	
	private static int gcd(int x, int y) {
		while (y != 0) {
			int z = x % y;
			x = y;
			y = z;
		}
		return x;
	}
	
	
	
	private static String infile = "DATA31.txt";  // Specify null to use System.in
	private static String outfile = "OUT31.txt";  // Specify null to use System.out
	
	
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