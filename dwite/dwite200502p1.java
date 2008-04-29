import java.io.*;


// DWITE - February 2005 - Problem 1: Bretschneider's Formula
public class dwite200502p1 {
	
	private static final int[] x = { 1, -1, -2,  2,  2, -2, -3,  1,  3, -1, -4,  3,  4, -4, -4,  4,  2, -4, -2,  1};
	private static final int[] y = { 1,  2, -1, -2,  2,  3, -3, -3,  3,  4, -2, -5,  5,  5, -5, -5,  4,  1, -4, -1};
	
	
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		String s = in.readLine();
		int a = s.charAt(0) - 'A';
		int b = s.charAt(1) - 'A';
		int c = s.charAt(2) - 'A';
		int d = s.charAt(3) - 'A';
		long area = Math.round(getArea(a, b, c, d) * 10);
		out.printf("%d.%d%n", area / 10, area % 10);
	}
	
	
	private static double getArea(int A, int B, int C, int D) {
		int temp = distanceSquared(B,C) + distanceSquared(D,A) - distanceSquared(A,B) - distanceSquared(C,D);
		return Math.sqrt(4*distanceSquared(B,D)*distanceSquared(A,C) - temp*temp) / 4;
	}
	
	
	private static int distanceSquared(int A, int B) {
		return magnitudeSquared(x[A] - x[B], y[A] - y[B]);
	}
	
	
	private static int magnitudeSquared(int x, int y) {
		return x * x + y * y;
	}
	
	
	
	private static String infile = "DATA11.txt";  // Specify null to use System.in
	private static String outfile = "OUT11.txt";  // Specify null to use System.out
	
	
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