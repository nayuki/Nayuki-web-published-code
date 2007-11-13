import java.io.*;
import java.util.StringTokenizer;


// DWITE - December 2006 - Problem 1: Jimmy's Lost His Marbles
public class dwite200612p1 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		int capacity = Integer.parseInt(in.readLine());  // Capacity of storage box
		int bags = Integer.parseInt(in.readLine());
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		
		// Subset sum problem using dynamic programming
		boolean[] possible = new boolean[capacity + 1];
		possible[0] = true;
		for (int i = 0; i < bags; i++) {
			int marbles = Integer.parseInt(st.nextToken());
			for (int j = capacity - marbles; j >= 0; j--)
				possible[j + marbles] |= possible[j];
		}
		
		for (int i = capacity; i >= 0; i--) {
			if (possible[i]) {  // Guaranteed to execute before the loop ends
				out.println(i);
				break;
			}
		}
	}
	
	
	static String infile = "DATA11.txt";  // Specify null to use System.in
	static String outfile = "OUT11.txt";  // Specify null to use System.out
	
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