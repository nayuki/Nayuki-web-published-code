import java.io.*;


// DWITE - December 2006 - Problem 5: Caesar's Cipher
public class dwite200612p5 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		String ciphertext = in.readLine();
		String someplaintext = in.readLine();
		
		// Derive shift from the leading character
		int shift = (ciphertext.charAt(0) - someplaintext.charAt(0) + 26) % 26;
		out.println(decrypt(ciphertext, shift));
	}
	
	
	static String encrypt(String s, int shift) {
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < s.length(); i++) {
			char c = s.charAt(i);
			if (c >= 'A' && c <= 'Z')
				sb.append((char)((c - 'A' + shift) % 26 + 'A'));
			else
				sb.append(c);
		}
		return sb.toString();
	}
	
	
	static String decrypt(String s, int shift) {
		return encrypt(s, (26 - shift) % 26);
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