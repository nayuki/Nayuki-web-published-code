import java.io.*;


// DWITE - February 2006 - Problem 3: UPC Check Digit
public class dwite200602p3 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		String line = in.readLine();
		if (line.length() != 12)
			throw new AssertionError("Invalid length for UPC digit sequence");
		int sum = getUpcSumWithoutCheckDigit(toDigits(line));
		out.printf("%s%d%n", line.substring(0, 11), (10 - sum) % 10);  // Calculate the correct check digit using modular arithmetic magic
	}
	
	
	private static int getUpcSumWithoutCheckDigit(int[] digits) {
		int sum = 0;
		for (int i = 0; i < digits.length - 1; i++) {
			if (i % 2 == 0) sum += digits[i] * 3;
			else            sum += digits[i] * 1;
		}
		return sum % 10;
	}
	
	
	
	private static int[] toDigits(String s) {
		int[] digits = new int[s.length()];
		for (int i = 0; i < digits.length; i++)
			digits[i] = s.charAt(i) - '0';
		return digits;
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