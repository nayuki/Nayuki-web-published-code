import java.io.*;


// DWITE - November 2004 - Problem 1: Credit Card Check Digit
public class dwite200411p1 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		int[] digits = toDigits(in.readLine());
		int sum = calculateLuhnSum(digits);
		if (sum % 10 == 0)
			out.println("VALID");
		else {
			for (int i = 0; i < 10; i++) {  // Try all values for last digit
				digits[digits.length - 1] = i;
				if (calculateLuhnSum(digits) % 10 == 0) {
					out.printf("INVALID %d%n", digits[digits.length - 1]);
					break;
				}
			}
		}
	}
	
	static int[] toDigits(String str) {
		int[] digits = new int[str.length()];
		for (int i = 0; i < digits.length; i++) {
			char c = str.charAt(i);
			if (c < '0' || c > '9')
				throw new IllegalArgumentException();
			digits[i] = c - '0';
		}
		return digits;
	}
	
	static int calculateLuhnSum(int[] digits) {
		int sum = 0;
		for (int i = 0; i < digits.length; i++) {
			if ((i + digits.length) % 2 == 1)
				sum += digits[i];
			else
				sum += digits[i] / 5 + digits[i] % 5 * 2;
		}
		return sum;
	}
	
	
	static String infile = "DATA11.txt";  // Specify null to use System.in
	static String outfile = "OUT11.txt";  // Specify null to use System.out
	
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