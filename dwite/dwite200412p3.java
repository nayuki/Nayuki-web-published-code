import java.io.*;


// DWITE - December 2004 - Problem 3: Reflections
public class dwite200412p3 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		double length     = Double.parseDouble(in.readLine());  // Variable L
		double separation = Double.parseDouble(in.readLine());  // Variable D
		double angle      = Double.parseDouble(in.readLine());  // Variable x
		double refldist   = separation / Math.tan(Math.toRadians(angle));  // Horizontal distance between reflections
		out.println((int)Math.floor(length / refldist + 0.5));
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