import java.io.*;


// DWITE - December 2004 - Problem 4: Waring's Prime Number Conjecture
public class dwite200412p4 {
	
	static boolean[] isPrime;
	
	static int[] primes;
	static int primesLength;
	
	
	static {
		isPrime = sievePrimes(99999);
		primes = new int[isPrime.length];
		primesLength = 0;
		for (int i = 0; i < isPrime.length; i++) {
			if (isPrime[i]) {
				primes[primesLength] = i;
				primesLength++;
			}
		}
	}
	
	
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		int n = Integer.parseInt(in.readLine());
		if (isPrime[n])
			out.println("PRIME");
		else
			// out.println(countSums(n, 3, 0));
			// out.println(countSumsSemifast(n, 3, 0, 0));
			out.println(countSumsFast(n));
	}
	
	
	// Returns the number of unordered sums that add up to 'sum' with exactly 'terms' prime terms, each of which is at least 'minimum'.
	static int countSums(int sum, int terms, int minimum) {
		if (terms == 1) {
			if (isPrime[sum] && sum >= minimum)
				return 1;
			else
				return 0;
		} else {
			int count = 0;
			for (int i = minimum; i <= sum; i++) {
				if (isPrime[i])
					count += countSums(sum - i, terms - 1, i);
			}
			return count;
		}
	}
	
	
	// Assumes that primes[minimumIndex] >= minimum.
	static int countSumsSemifast(int sum, int terms, int minimum, int minimumIndex) {
		if (terms == 1) {
			if (isPrime[sum] && sum >= minimum)
				return 1;
			else
				return 0;
		} else {
			int count = 0;
			for (int i = minimumIndex, end = sum / terms; i < primesLength && primes[i] <= end; i++)
				count += countSumsSemifast(sum - primes[i], terms - 1, primes[i], i);
			return count;
		}
	}
	
	
	// Hard-coded for 3-term sums.
	static int countSumsFast(int sum) {
		int count = 0;
		for (int i = 0, iend = sum / 3; i < primesLength && primes[i] <= iend; i++) {
			int temp = sum - primes[i];
			for (int j = i, jend = temp / 2; j < primesLength && primes[j] <= jend; j++) {
				// temp-primes[j] >= primes[j] because of jend
				if (isPrime[temp - primes[j]])
					count++;
			}
		}
		return count;
	}
	
	
	
	static boolean[] sievePrimes(int n) {
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
	
	
	static int sqrt(int x) {
		int y = 0;
		for (int i = 15; i >= 0; i--) {
			y |= 1 << i;
			if (y > 46340 || y * y > x)
				y ^= 1 << i;
		}
		return y;
	}
	
	
	
	static String infile = "DATA41.txt";  // Specify null to use System.in
	static String outfile = "OUT41.txt";  // Specify null to use System.out
	
	
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