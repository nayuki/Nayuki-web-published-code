import java.io.*;
import java.util.*;


// DWITE - January 2005 - Problem 2: Minesweeper
public class dwite200501p2 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
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
		
		SortedSet<Character> querykeys = new TreeSet<Character>(queries.keySet());
		for (Character key : querykeys) {
			Point p = queries.get(key);
			out.printf("%c-%d%n", key, neighbouringmines[p.y + 1][p.x + 1]);
		}
	}
	
	
	static void incrementNeighbours(int[][] neighmines, int x, int y) {  // Uses the Moore neighbourhood
		for (int yy = y - 1; yy <= y+1; yy++) {
			for (int xx = x - 1; xx <= x+1; xx++) {
				if (xx != x || yy != y)
					neighmines[yy + 1][xx + 1]++;
			}
		}
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
		
		
		
		Point(int x, int y) {
			this.x = x;
			this.y = y;
		}
		
	}
	
}