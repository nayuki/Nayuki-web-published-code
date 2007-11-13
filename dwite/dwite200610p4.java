import java.io.*;
import java.util.StringTokenizer;


// DWITE - October 2006 - Problem 4: Count Squares
public class dwite200610p4 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		int height = Integer.parseInt(st.nextToken());
		int width = Integer.parseInt(st.nextToken());
		char[][] grid = new char[height][width];
		for (int y = 0; y < height; y++) {
			String line = in.readLine();
			for (int x = 0; x < width; x++)
				grid[y][x] = line.charAt(x);
		}
		
		int count = 0;
		for (int i = 1; i <= Math.min(width, height); i++)
			count += countSquares(grid, i);
		out.println(count);
	}
	
	static int countSquares(char[][] grid, int size) {
		int count = 0;
		for (int y = 0; y < grid.length-size+1; y++) {
			for (int x = 0; x < grid[y].length-size+1; x++) {
				count += isSquare(grid, x, y, size);
			}
		}
		return count;
	}
	
	static int isSquare(char[][] grid, int x, int y, int size) {
		for (int i = 0; i < size; i++) {
			for (int j = 0; j < size; j++) {
				if (grid[y + i][x + j] != '*')
					return 0;
			}
		}
		return 1;
	}
	
	
	static String infile = "DATA41.txt";  // Specify null to use System.in
	static String outfile = "OUT41.txt";  // Specify null to use System.out
	
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