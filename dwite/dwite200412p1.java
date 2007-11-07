import java.io.*;


// DWITE - December 2004 - Problem 1: Prime Factorization
public class dwite200412p1 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		out.println(factor(Integer.parseInt(in.readLine())));
	}
	
	static String factor(int x) {
		for (int i = 2, end = sqrt(x); i <= end; i++) {
			if (x % i == 0)
				return i + "*" + factor(x / i);  // x is composite
		}
		return Integer.toString(x);  // x is prime
	}
	
	
	static int sqrt(int x) {
		int y = 0;
		for (int i = 15; i >= 0; i--) {
			y |= 1 << i;
			if (y > 46340 || y * y > x)
				y ^= 1 << i;
		}
		return y;
	}
	
	
	static String infile = "DATA11.txt";  // Specify null to use System.in
	static String outfile = "OUT11.txt";  // Specify null to use System.out
	
	public static void main(String[] args) throws IOException {
		InputStream in0;
		if (infile != null)
			in0 = new FileInputStream(infile);
		else
			in0 = System.in;
		Reader in1 = new InputStreamReader(in0, "US-ASCII");
		BufferedReader in = new BufferedReader(in1);
		
		OutputStream out0;
		if (outfile != null)
			out0 = new FileOutputStream(outfile);
		else
			out0 = System.out;
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