import java.io.*;


// DWITE - October 2004 - Problem 2: 24 Hour Clock
public class dwite200410p2 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		String line = in.readLine();
		int hour = Integer.parseInt(line.substring(0, 2));
		String ap;
		if (hour < 12) ap = "AM";
		else           ap = "PM";
		hour = (hour + 11) % 12 + 1;  // Convert hour from [0, 24) to [1, 12] branchlessly using modular arithmetic magic
		out.printf("%d:%s %s%n", hour, line.substring(3, 5), ap);
	}
	
	
	
	static String infile = "DATA2";  // Specify null to use System.in
	static String outfile = "OUT2";  // Specify null to use System.out
	
	
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