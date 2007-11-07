import java.io.*;


// DWITE - February 2005 - Problem 5: Tsunami Speed
public class dwite200502p5 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		int h = Integer.parseInt(in.readLine());         // Water depth in metres
		int d = Integer.parseInt(in.readLine()) * 1000;  // Distance in metres
		double c = Math.sqrt(9.8 * h);                   // Wave speed in metres per second
		long time = Math.round(d / c);                   // Travel time in seconds
		out.printf("%d hour(s) %d minute(s) %d second(s)%n", time / 3600, time / 60 % 60, time % 60);
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