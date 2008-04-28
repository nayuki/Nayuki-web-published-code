import java.io.*;
import java.math.BigInteger;


// DWITE - October 2006 - Problem 5: Bad Input II
public class dwite200610p5 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		BigInteger x = new BigInteger(sanitizeUsingRegex(in.readLine()));
		BigInteger y = new BigInteger(sanitizeUsingRegex(in.readLine()));
		out.println(x.add(y));
	}
	
	
	static String sanitize(String s) {
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < s.length(); i++) {
			char c = s.charAt(i);
			if (isDigit(c))
				sb.append(c);
		}
		return sb.toString();
	}
	
	
	static String sanitizeUsingRegex(String s) {
		return s.replaceAll("[^0-9]", "");
	}
	
	
	static boolean isDigit(char c) {
		return c >= '0' && c <= '9';
	}
	
	
	
	static String infile = "DATA51.txt";  // Specify null to use System.in
	static String outfile = "OUT51.txt";  // Specify null to use System.out
	
	
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