import java.io.*;
import java.util.StringTokenizer;


// DWITE - December 2004 - Problem 2: Squareland II
public class dwite200412p2 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		int n = Integer.parseInt(in.readLine());
		int s = Integer.parseInt(in.readLine());
		int sqrtn = sqrt(n);
		int sqrts = sqrt(s);
		int[][] grid = new int[sqrtn][sqrtn];
		for (int y = 0; y < grid.length; y++) {
			StringTokenizer st = new StringTokenizer(in.readLine(), " ");
			for (int x = 0; x < grid[y].length; x++)
				grid[y][x] = Integer.parseInt(st.nextToken());
		}
		
		int max = 0;
		for (int y = 0; y+sqrts <= sqrtn; y++) {
			for (int x = 0; x+sqrts <= sqrtn; x++)
				max = Math.max(sum(grid, x, y, sqrts, sqrts), max);
		}
		out.println(max);
	}
	
	static int sum(int[][] map, int x, int y, int w, int h) {
		int sum = 0;
		for (int i = 0; i < h; i++) {
			for (int j = 0; j < w; j++)
				sum += map[y + i][x + j];
		}
		return sum;
	}
	
	static int sqrt(int x) {
		int y = 0;
		for (int i = 15; i >= 0; i--) {
			y |= 1 << i;
			if (y > 46340 || y * y > x)
				y ^= 1 << i;
		}
		return y;
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
}