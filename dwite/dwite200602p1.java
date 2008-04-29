import java.io.*;
import java.util.StringTokenizer;


// DWITE - February 2006 - Problem 1: Points on a Line
public class dwite200602p1 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		// Read input (the points)
		int n = Integer.parseInt(in.readLine());
		int[] px = new int[n];
		int[] py = new int[n];
		for (int i = 0; i < n; i++) {
			StringTokenizer st = new StringTokenizer(in.readLine(), " ");
			px[i] = Integer.parseInt(st.nextToken());
			py[i] = Integer.parseInt(st.nextToken());
		}
		
		// Process each geometric line
		for (int i = 0; i < 5; i++)
			mainOnce(in, out, px, py);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out, int[] px, int[] py) throws IOException {
		// Read input (a pair of points defining the line)
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		int x1 = Integer.parseInt(st.nextToken());
		int y1 = Integer.parseInt(st.nextToken());
		int x2 = Integer.parseInt(st.nextToken());
		int y2 = Integer.parseInt(st.nextToken());
		
		// Compute
		int count = 0;
		for (int i = 0; i < px.length; i++) {
			if (areCollinear(x1, y1, x2, y2, px[i], py[i]))
				count++;
		}
		
		// Write output
		out.println(count);
	}
	
	
	private static boolean areCollinear(int x0, int y0, int x1, int y1, int x2, int y2) {
		return (x1 - x0) * (y2 - y1) == (x2 - x1) * (y1 - y0);
	}
	
	
	
	private static String infile = "DATA21.txt";  // Specify null to use System.in
	private static String outfile = "OUT21.txt";  // Specify null to use System.out
	
	
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