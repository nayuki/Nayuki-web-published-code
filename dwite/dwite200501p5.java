import java.io.*;
import java.util.StringTokenizer;


// DWITE - January 2005 - Problem 5: Different Bases Multiplication
public class dwite200501p5 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		StringTokenizer st;
		
		st = new StringTokenizer(in.readLine(), " ");
		String xstr = st.nextToken();
		String xbase = st.nextToken();
		int x = Integer.parseInt(xstr, Integer.parseInt(xbase));
		
		st = new StringTokenizer(in.readLine(), " ");
		String ystr = st.nextToken();
		String ybase = st.nextToken();
		int y = Integer.parseInt(ystr, Integer.parseInt(ybase));
		
		String outbase = in.readLine();
		out.println(Integer.toString(x * y, Integer.parseInt(outbase)));
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