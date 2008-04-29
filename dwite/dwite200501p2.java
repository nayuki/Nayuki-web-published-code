import java.io.*;
import java.util.*;


// DWITE - January 2005 - Problem 2: Minesweeper
public class dwite200501p2 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		// Read input
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		int h = Integer.parseInt(st.nextToken());
		int w = Integer.parseInt(st.nextToken());
		int[][] neighbouringmines = new int[h + 2][w + 2];
		Map<Character,Point> queries = new HashMap<Character,Point>();
		for (int y = 0; y < h; y++) {
			String line = in.readLine();
			for (int x = 0; x < w; x++) {
				char c = line.charAt(x);
				if (c == '.') ;
				else if (c == '*')
					incrementNeighbours(neighbouringmines, x, y);
				else if (c >= 'a' && c <= 'z')
					queries.put(c, new Point(x, y));
				else
					throw new AssertionError("Invalid cell");
			}
		}
		
		// Process queries and write the output
		SortedSet<Character> querykeys = new TreeSet<Character>(queries.keySet());
		for (Character key : querykeys) {
			Point p = queries.get(key);
			int mines = neighbouringmines[p.y + 1][p.x + 1];
			out.printf("%c-%d%n", key, mines);
		}
	}
	
	
	private static void incrementNeighbours(int[][] neighmines, int x, int y) {  // Uses the Moore neighbourhood
		for (int yy = y - 1; yy <= y+1; yy++) {
			for (int xx = x - 1; xx <= x+1; xx++) {
				if (xx != x || yy != y)
					neighmines[yy + 1][xx + 1]++;
			}
		}
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
	
	
	
	private static class Point {
		
		public final int x;
		public final int y;
		
		
		
		public Point(int x, int y) {
			this.x = x;
			this.y = y;
		}
		
		
		
		public String toString() {
			return String.format("(%d, %d)", x, y);
		}
		
	}
	
}