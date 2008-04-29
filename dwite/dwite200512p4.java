import java.io.*;


// DWITE - December 2005 - Problem 4: Now I Know My ABC's
public class dwite200512p4 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		// Read input
		String line = in.readLine();
		
		// Count frequencies
		int[] freq = new int[26];
		for (int i = 0; i < line.length(); i++) {
			char c = line.charAt(i);
			if (isLetter(c))
				freq[(c - 'A') % 32]++;
		}
		
		// Write output
		boolean initial = true;
		for (int i = 0; i < freq.length; i++) {
			if (freq[i] != 0) {
				if (initial) initial = false;
				else out.print(":");
				out.printf("%c-%d", (char)('A' + i), freq[i]);
			}
		}
		out.println();
	}
	
	
	private static boolean isLetter(char c) {
		return c >= 'A' && c <= 'Z'
		    || c >= 'a' && c <= 'z';
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