import java.io.*;
import java.math.BigInteger;


// DWITE - October 2005 - Problem 1: Odometers
public class dwite200510p1 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		int[] r1 = toDigits(in.readLine());
		int d1 = Integer.parseInt(in.readLine());
		int d2 = Integer.parseInt(in.readLine());
		
		int n1 = countOccurrences(r1, d1);
		int[] r2 = r1.clone();
		// r2 = solveSlow(n1, d2, r2);
		r2 = solveFast(n1, d2, r2);
		
		BigInteger diff = toNumber(r2).subtract(toNumber(r1));
		if (diff.compareTo(BigInteger.ZERO) < 0)
			diff = diff.add(BigInteger.valueOf(10).pow(r1.length));
		out.printf("%s %d%n", toString(r2), diff);
	}
	
	
	private static int[] solveSlow(int n1, int d2, int[] r2) {
		while (countOccurrences(r2, d2) != n1)
			increment(r2, r2.length - 1);
		return r2;
	}
	
	
	private static int[] solveFast(int n1, int d2, int[] r2) {
		while (true) {
			int n2 = countOccurrences(r2, d2);
			if (n2 == n1)  // Done!
				break;
			else if (n2 < n1) {
				// Try to set a lower-order non-d2 digit to d2
				for (int i = r2.length-1; i >= 0; i--) {
					if (r2[i] < d2) {
						// Set digit directly to d2. n2 will be incremented.
						r2[i] = d2;
						break;
					} else if (r2[i] > d2) {
						// Increment next digit, clear this digit and all digits below. n2 will decrease or stay the same.
						increment(r2, i - 1);
						for (; i < r2.length; i++)
							r2[i] = 0;
						break;
					}
				}
			} else {  // n2 > n1
				// Increment a lower-order d2. n2 will be decremented.
				for (int i = r2.length-1; i >= 0; i--) {
					if (r2[i] == d2) {
						increment(r2, i);
						break;
					}
				}
			}
		}
		return r2;
	}
	
	
	private static int countOccurrences(int[] digits, int digit) {
		int count = 0;
		for (int i = 0; i < digits.length; i++) {
			if (digits[i] == digit)
				count++;
		}
		return count;
	}
	
	
	private static void increment(int[] digits, int index) {
		if (index < 0)
			return;
		digits[index]++;
		while (digits[index] == 10) {
			digits[index] = 0;
			if (index - 1 >= 0)
				digits[index - 1]++;
			else
				break;
			index--;
		}
	}
	
	
	private static BigInteger toNumber(int[] digits) {
		final BigInteger TEN = BigInteger.valueOf(10);
		BigInteger sum = BigInteger.ZERO;
		for (int i = 0; i < digits.length; i++) {
			sum = sum.multiply(TEN);
			sum = sum.add(BigInteger.valueOf(digits[i]));
		}
		return sum;
	}
	
	
	private static String toString(int[] digits) {
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < digits.length; i++)
			sb.append((char)('0' + digits[i]));
		return sb.toString();
	}
	
	
	
	private static int[] toDigits(String s) {
		int[] digits = new int[s.length()];
		for (int i = 0; i < digits.length; i++)
			digits[i] = s.charAt(i) - '0';
		return digits;
	}
	
	
	
	private static String infile = "DATA11.txt";  // Specify null to use System.in
	private static String outfile = "OUT11.txt";  // Specify null to use System.out
	
	
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