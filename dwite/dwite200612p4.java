import java.io.*;
import java.math.BigInteger;


// DWITE - December 2006 - Problem 4: The Ubiquitous 196
public class dwite200612p4 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		BigInteger n = new BigInteger(in.readLine());
		BigInteger temp = n;
		for (int i = 0; ; i++) {
			if (i > 100) {
				out.printf("%d-UBIQUITOUS%n", n);
				break;
			} else if (isPalindrome(temp)) {
				out.printf("%d-%d-%d%n", n, i, temp);
				break;
			} else
				temp = iterate(temp);
		}
	}
	
	
	private static BigInteger iterate(BigInteger n) {
		return n.add(reverse(n));
	}
	
	
	private static boolean isPalindrome(BigInteger n) {
		return isPalindrome(n.toString());
	}
	
	
	private static boolean isPalindrome(String s) {
		return s.equals(reverse(s));
	}
	
	
	private static BigInteger reverse(BigInteger n) {
		return new BigInteger(reverse(n.toString()));
	}
	
	
	private static String reverse(String s) {
		return new StringBuffer(s).reverse().toString();
	}
	
	
	
	private static String infile = "DATA41.txt";  // Specify null to use System.in
	private static String outfile = "OUT41.txt";  // Specify null to use System.out
	
	
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