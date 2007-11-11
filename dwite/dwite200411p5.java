import java.io.*;


// DWITE - November 2004 - Problem 5: Wind Chill
public class dwite200411p5 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		int temp = Integer.parseInt(in.readLine());  // Variable Tair
		int wind = Integer.parseInt(in.readLine());  // Variable V10metre
		long wct = Math.round(13.12 + 0.6215*temp - 11.37*Math.pow(wind, 0.16) + 0.3965*temp*Math.pow(wind, 0.16));
		String rating;
		if      (wct > -10) rating = "LOW";
		else if (wct > -25) rating = "MODERATE";
		else if (wct > -45) rating = "COLD";
		else if (wct > -60) rating = "EXTREME";
		else                rating = "DANGER";
		out.printf("%d %s%n", wct, rating);
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