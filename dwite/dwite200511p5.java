import java.io.*;


// DWITE - November 2005 - Problem 5: Base64 Encoding
public class dwite200511p5 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		String line = in.readLine();
		for (int i = 0; i < line.length(); i += 4) {
			int word = 0;  // 24 bits
			for (int j = 0; j < 4; j++)
				word = word << 6 | fromBase64(line.charAt(i + j));
			
			String str;
			if      (line.charAt(i + 3) != '=') str = toString(word, 3);
			else if (line.charAt(i + 2) != '=') str = toString(word, 2);
			else if (line.charAt(i + 1) != '=') str = toString(word, 1);
			else throw new AssertionError();
			out.print(str);
		}
		out.println();
	}
	
	static int fromBase64(char c) {
		if (c >= 'A' && c <= 'Z') return c - 'A';
		if (c >= 'a' && c <= 'z') return c - 'a' + 26;
		if (c >= '0' && c <= '9') return c - '0' + 52;
		if (c == '+') return 62;
		if (c == '/') return 63;
		if (c == '=') return 0;
		throw new AssertionError();
	}
	
	static String toString(int word, int n) {
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < n; i++)
			sb.append((char)(word >>> (2 - i) * 8 & 0xFF));
		return sb.toString();
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