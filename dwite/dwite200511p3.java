import java.io.*;


// DWITE - November 2005 - Problem 3: Cinquain Poetry
public class dwite200511p3 {
	
	static final int[] syllablePattern = {2, 4, 6, 8, 2};
	
	
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		int worstdev = 0;
		int worstline = -1;
		for (int i = 0; i < 5; i++) {
			int syllables = countSyllables(in.readLine());
			// int syllables = countSyllablesUsingRegex(in.readLine());
			int deviation = syllables - syllablePattern[i];
			if (Math.abs(deviation) > Math.abs(worstdev)) {
				worstdev = deviation;
				worstline = i;
			}
		}
		
		String manyfew;
		if      (worstdev < 0) manyfew = "FEW";
		else if (worstdev > 0) manyfew = "MANY";
		else throw new AssertionError("No mistakes made");
		out.printf("LINE %d - %d SYLLABLE(S) TOO %s%n", worstline + 1, Math.abs(worstdev), manyfew);
	}
	
	
	static int countSyllables(String s) {
		int count = 1;
		for (int i = 0; i < s.length(); i++) {
			if (s.charAt(i) == ' ' || s.charAt(i) == '-')
				count++;
		}
		return count;
	}
	
	
	static int countSyllablesUsingRegex(String s) {
		return s.replaceAll("[^ \\-]", "").length() + 1;  // One-liners rock
	}
	
	
	
	static String infile = "DATA31.txt";  // Specify null to use System.in
	static String outfile = "OUT31.txt";  // Specify null to use System.out
	
	
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