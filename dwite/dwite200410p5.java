import java.io.*;
import java.math.BigInteger;


// DWITE - October 2004 - Problem 5: Super Long Sums 
public class dwite200410p5 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		String x = in.readLine();
		String y = in.readLine();
		out.println(new BigInteger(x).add(new BigInteger(y)));  // Easy version
		// out.println(add(x, y));  // Hard version
	}
	
	static String add(String x, String y) {  // x and y each must have at least 1 digit
		StringBuilder sb = new StringBuilder();
		int carry = 0;
		for (int i = 0; i < Math.max(x.length(), y.length()); i++) {
			int sum = carry;
			if (i < x.length())
				sum += x.charAt(x.length() - 1 - i) - '0';
			if (i < y.length())
				sum += y.charAt(y.length() - 1 - i) - '0';
			sb.insert(0, sum % 10);
			carry = sum / 10;
		}
		if (carry > 0)
			sb.insert(0, carry);
		return sb.toString();
	}
	
	
	static String infile = "DATA5"; // Specify null to use System.in
	static String outfile = "OUT5"; // Specify null to use System.out
	
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