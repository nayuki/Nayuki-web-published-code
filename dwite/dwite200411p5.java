import java.io.*;


// DWITE - November 2004 - Problem 5: Wind Chill
public class dwite200411p5 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		// Read input
		int temp = Integer.parseInt(in.readLine());  // Variable Tair
		int wind = Integer.parseInt(in.readLine());  // Variable V10metre
		
		// Compute and write output
		int wct = (int)Math.round(13.12 + 0.6215*temp - 11.37*Math.pow(wind,0.16) + 0.3965*temp*Math.pow(wind,0.16));
		out.printf("%d %s%n", wct, getRating(wct));
	}
	
	
	private static String getRating(int wct) {
		if      (  0 < wct             ) throw new IllegalArgumentException("Undefined for positive wind chill temperature");
		else if (-10 < wct && wct <   0) return "LOW";
		else if (-25 < wct && wct < -10) return "MODERATE";
		else if (-45 < wct && wct < -25) return "COLD";
		else if (-60 < wct && wct < -45) return "EXTREME";
		else if (             wct < -60) return "DANGER";
		else throw new AssertionError();  // Impossible; defies the laws of arithmetic
	}
	
	
	
	private static String infile = "DATA51.txt";  // Specify null to use System.in
	private static String outfile = "OUT51.txt";  // Specify null to use System.out
	
	
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