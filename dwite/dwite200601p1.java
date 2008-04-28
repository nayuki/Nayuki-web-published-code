import java.io.*;


// DWITE - January 2006 - Problem 1: Filling The Cone
public class dwite200601p1 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		double h = Double.parseDouble(in.readLine());
		double r = Double.parseDouble(in.readLine());
		double v = Double.parseDouble(in.readLine());
		double x = Math.pow(3 * v * h * h / (3.1415926 * r * r), 1 / 3D);  // Height of water
		out.printf("%.2f%n", x);
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