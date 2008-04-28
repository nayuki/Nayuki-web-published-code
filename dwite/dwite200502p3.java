import java.io.*;


// DWITE - February 2005 - Problem 3: Simple Continued Fractions
public class dwite200502p3 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		int n = Integer.parseInt(in.readLine());
		int d = Integer.parseInt(in.readLine());
		do {
			out.print(n / d);  // Output whole part
			n %= d;  // Take fractional part
			if (n == 0)
				break;
			int temp = n;  // Reciprocate
			n = d;
			d = temp;
			out.print(",");
		} while (true);
		out.println();
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