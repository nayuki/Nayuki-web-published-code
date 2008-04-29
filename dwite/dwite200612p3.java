import java.io.*;


// DWITE - December 2006 - Problem 3: Circular Primes
public class dwite200612p3 {
	
	private static boolean[] isPrime = sievePrimes(999999);
	
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		// Read input
		int n = Integer.parseInt(in.readLine());
		
		// Find next circular prime (possibly the current number)
		int i = n;
		while (!isCircularPrime(i))
			i++;
		
		// Write output
		out.println(i);
	}
	
	
	private static boolean isCircularPrime(int n) {
		String s = Integer.toString(n);
		for (int i = 0; i < s.length(); i++) {
			if (!isPrime[Integer.parseInt(s)])
				return false;
			s = rotateLeft(s, 1);
		}
		return true;
	}
	
	
	private static String rotateLeft(String str, int shift) {
		if (str.equals(""))
			return str;
		else {
			shift %= str.length();
			return str.substring(shift, str.length()) + str.substring(0, shift);
		}
	}
	
	
	
	private static boolean[] sievePrimes(int n) {
		boolean[] isPrime = new boolean[n + 1];
		if (n >= 2)
			isPrime[2] = true;
		for (int i = 3; i <= n; i += 2)
			isPrime[i] = true;
		for (int i = 3, end = sqrt(n); i <= end; i += 2) {
			if (isPrime[i]) {
				for (int j = i * 3; j <= n; j += i << 1)
					isPrime[j] = false;
			}
		}
		return isPrime;
	}
	
	
	private static int sqrt(int x) {
		int y = 0;
		for (int i = 15; i >= 0; i--) {
			y |= 1 << i;
			if (y > 46340 || y * y > x)
				y ^= 1 << i;
		}
		return y;
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