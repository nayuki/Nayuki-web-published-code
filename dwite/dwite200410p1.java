import java.io.*;
import java.util.StringTokenizer;


// DWITE - October 2004 - Problem 1: Area of Circle
public class dwite200410p1 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		double x1 = Double.parseDouble(st.nextToken());
		double y1 = Double.parseDouble(st.nextToken());
		double x2 = Double.parseDouble(st.nextToken());
		double y2 = Double.parseDouble(st.nextToken());
		out.printf("%.3f%n", 3.14159 * distanceSquared(x1, y1, x2, y2));
	}
	
	
	static double distanceSquared(double x0, double y0, double x1, double y1) {
		return magnitudeSquared(x0 - x1, y0 - y1);
	}
	
	static double magnitudeSquared(double x, double y) {
		return x * x + y * y;
	}
	
	
	
	static String infile = "DATA1";  // Specify null to use System.in
	static String outfile = "OUT1";  // Specify null to use System.out
	
	
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