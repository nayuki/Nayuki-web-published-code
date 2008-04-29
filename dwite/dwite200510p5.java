import java.io.*;
import java.util.StringTokenizer;


// DWITE - October 2005 - Problem 5: Five Digit Divisibility
public class dwite200510p5 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		int d1 = Integer.parseInt(st.nextToken());
		int d2 = Integer.parseInt(st.nextToken());
		int[] digits = new int[d1];
		int divisible = 0;
		for (int i = 0, end = factorial(d1); i < end; i++) {
			for (int j = 0; j < d1; j++)
				digits[j] = j + 1;
			permute(digits, i);
			if (toNumber(digits) % d2 == 0)
				divisible++;
		}
		out.println(divisible);
	}
	
	
	
	private static int toNumber(int[] digits) {
		int num = 0;
		for (int i = digits.length - 1; i >= 0; i--)
			num = num * 10 + digits[i];
		return num;
	}
	
	
	private static void permute(int[] array, int perm) {
		// A modification of the Knuth shuffle
		for (int i = array.length - 1; i >= 0; i--) {
			int temp = array[i];
			array[i] = array[perm % (i + 1)];
			array[perm % (i + 1)] = temp;
			perm /= i + 1;
		}
	}
	
	
	private static int factorial(int x) {
		int prod = 1;
		for (int i = 1; i <= x; i++)
			prod *= i;
		return prod;
	}
	
	
	
	private static String infile = "DATA51.txt";  // Specify null to use System.in
	private static String outfile = "OUT51.txt";  // Specify null to use System.out
	
	
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