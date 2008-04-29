import java.io.*;
import java.util.*;


// DWITE - December 2005 - Problem 2: The Maze
public class dwite200512p2 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		// Read input
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		int height = Integer.parseInt(st.nextToken());
		int width = Integer.parseInt(st.nextToken());
		char[][] grid = readGridAndPad(in, width, height, '#');
		
		// Find entry cell position
		int startx = -1;
		int starty = -1;
		outer:
		for (int y = 1; y <= height; y++) {
			for (int x = 1; x <= width; x++) {
				if (grid[y][x] == 'E') {
					startx = x;
					starty = y;
					break outer;
				}
			}
		}
		
		// Compute shortest path length
		// int length = findShortestPathDfs(grid, startx, starty);
		int length = findShortestPathBfs(grid, startx, starty);
		
		// Write output
		out.println(length - 1);  // The number of dots is length-1
	}
	
	
	@SuppressWarnings("unused")
	private static int findShortestPathDfs(char[][] grid, int x, int y) {
		if (grid[y][x] == 'X')
			return 0;
		if (grid[y][x] == '#')
			return Integer.MAX_VALUE / 2;
		
		int min = Integer.MAX_VALUE / 2;  // Length of the rest of the path
		grid[y][x] = '#';
		min = Math.min(findShortestPathDfs(grid, x - 1, y + 0), min);
		min = Math.min(findShortestPathDfs(grid, x + 1, y + 0), min);
		min = Math.min(findShortestPathDfs(grid, x + 0, y - 1), min);
		min = Math.min(findShortestPathDfs(grid, x + 0, y + 1), min);
		grid[y][x] = '.';
		return 1 + min;
	}
	
	
	private static int findShortestPathBfs(char[][] grid, int startx, int starty) {
		Queue<Point> queue = new LinkedList<Point>();
		queue.offer(new Point(startx, starty, 0));
		while (true) {
			Point cell = queue.poll();
			if (cell == null)
				throw new AssertionError("No path exists");
			int x = cell.x;
			int y = cell.y;
			int dist = cell.distance;
			if (grid[y][x] == 'X')
				return cell.distance;
			else if (grid[y][x] == '#')
				continue;
			else {
				grid[y][x] = '#';
				queue.offer(new Point(x - 1, y + 0, dist + 1));
				queue.offer(new Point(x + 1, y + 0, dist + 1));
				queue.offer(new Point(x + 0, y - 1, dist + 1));
				queue.offer(new Point(x + 0, y + 1, dist + 1));
			}
		}
	}
	
	
	
	private static char[][] readGridAndPad(BufferedReader in, int width, int height, char border) throws IOException {
		char[][] grid = new char[height + 2][width + 2];
		for (int y = 1; y <= height; y++) {
			String line = in.readLine();
			for (int x = 1; x <= width; x++)
				grid[y][x] = line.charAt(x - 1);
			grid[y][0] = border;
			grid[y][width + 1] = border;
		}
		for (int x = 0; x < width + 2; x++) {
			grid[0][x] = border;
			grid[height + 1][x] = border;
		}
		return grid;
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
		public final int distance;
		
		
		
		public Point(int x, int y, int dist) {
			this.x = x;
			this.y = y;
			this.distance = dist;
		}
		
		
		
		public String toString() {
			return String.format("(%d, %d)", x, y);
		}
		
	}
	
}