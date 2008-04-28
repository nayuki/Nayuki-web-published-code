import java.io.*;
import java.util.StringTokenizer;


// DWITE - November 2005 - Problem 1: Quadrilateral Centroid
public class dwite200511p1 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		double x = 0;
		double y = 0;
		for (int i = 0; i < 4; i++) {
			StringTokenizer st = new StringTokenizer(in.readLine(), " ");
			x += Double.parseDouble(st.nextToken());
			y += Double.parseDouble(st.nextToken());
		}
		x /= 4;  // Take the arithmetic mean
		y /= 4;
		x = Math.round(x * 100) / 100.0;
		y = Math.round(y * 100) / 100.0;
		out.printf("%.2f %.2f%n", x, y);
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