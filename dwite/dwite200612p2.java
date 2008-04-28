import java.io.*;
import java.util.StringTokenizer;


// DWITE - December 2006 - Problem 2: Ulam Spiral Walkway
public class dwite200612p2 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		int m = Integer.parseInt(st.nextToken());
		int n = Integer.parseInt(st.nextToken());
		Point p0 = new Point(m);
		Point p1 = new Point(n);
		out.println(p0.distance(p1));
	}
	
	
	static String infile = "DATA21.txt";  // Specify null to use System.in
	static String outfile = "OUT21.txt";  // Specify null to use System.out
	
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
	
	
	static class Point {
		
		int x;
		int y;
		
		
		Point(int n) {
			int s = ceilingSqrt(n);
			if (s % 2 == 0) {
				x = 0 - (s - 2) / 2;
				y = 1 + (s - 2) / 2;
				n = s * s - n;  // 0 <= n <= (s-1)*2
				x += Math.min(n, s - 1);
				n -= Math.min(n, s - 1);
				y -= n;
			} else {
				x = 0 + (s - 1) / 2;
				y = 0 - (s - 1) / 2;
				n = s * s - n;  // 0 <= n <= (s-1)*2
				x -= Math.min(n, s - 1);
				n -= Math.min(n, s - 1);
				y += n;
			}
			
		}
		
		double distance(Point other) {
			int dx = Math.abs(x - other.x);
			int dy = Math.abs(y - other.y);
			int diag = Math.min(dx, dy);
			return diag * 1.5 + (dx - diag) + (dy - diag);
		}
		
		// Returns the smallest number y such that y*y >= x.
		static int ceilingSqrt(int x) {
			int y = 0xFFFF;
			for (int i = 15; i >= 0; i--) {
				y ^= 1 << i;
				if (y <= 46340 && y * y < x)
					y |= 1 << i;
			}
			return y;
		}
		
	}
	
}