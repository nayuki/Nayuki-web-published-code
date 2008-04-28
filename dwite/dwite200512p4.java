import java.io.*;


// DWITE - December 2005 - Problem 4: Now I Know My ABC's
public class dwite200512p4 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		String line = in.readLine();
		int[] freq = new int[26];
		for (int i = 0; i < line.length(); i++) {
			char c = line.charAt(i);
			if (c >= 'A' && c <= 'Z' || c >= 'a' && c <= 'z')
				freq[(c - 'A') % 32]++;
		}
		
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