import java.io.*;
import java.util.StringTokenizer;


// DWITE - February 2005 - Problem 2: Snakes
public class dwite200502p2 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}	
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		int h = Integer.parseInt(st.nextToken());
		int w = Integer.parseInt(st.nextToken());
		int[][] grid = new int[h + 2][w + 2];
		for (int y = 0; y < grid.length; y++) {  // Fill the grid with '.'
			for (int x = 0; x < grid[y].length; x++)
				grid[y][x] = '.';
		}
		for (int y = 0; y < h; y++) {  // Fill the inner part of the grid from the input
			String s = in.readLine();
			for (int x = 0; x < w; x++)
				grid[y + 1][x + 1] = s.charAt(x);
		}
		
		int maxcoiled = 0;
		int maxuncoiled = 0;
		for (int y = 1; y <= h; y++) {
			for (int x = 1; x <= w; x++) {
				int temp = markSnakeAndGetLength(grid, x, y);
				if (isCurrentSnakeCoiled(grid))
					maxcoiled = Math.max(temp, maxcoiled);
				else
					maxuncoiled = Math.max(temp, maxuncoiled);
				clearCurrentSnake(grid);
			}
		}
		out.println(maxcoiled + " " + maxuncoiled);
	}
	
	
	static boolean isCurrentSnakeCoiled(int[][] grid) {
		for (int y = 1; y < grid.length - 1; y++) {
			for (int x = 1; x < grid[y].length - 1; x++) {
				if (grid[y][x] == 'O' && countCurrentNeighbours(grid, x, y) >= 3)
					return true;
			}
		}
		return false;
	}
	
	static int markSnakeAndGetLength(int[][] grid, int x, int y) {
		if (grid[y][x] != 'X')
			return 0;
		int count = 1;
		grid[y][x] = 'O';
		count += markSnakeAndGetLength(grid, x - 1, y - 1);
		count += markSnakeAndGetLength(grid, x - 1, y + 0);
		count += markSnakeAndGetLength(grid, x - 1, y + 1);
		count += markSnakeAndGetLength(grid, x + 0, y - 1);
		count += markSnakeAndGetLength(grid, x + 0, y + 1);
		count += markSnakeAndGetLength(grid, x + 1, y - 1);
		count += markSnakeAndGetLength(grid, x + 1, y + 0);
		count += markSnakeAndGetLength(grid, x + 1, y + 1);
		return count;
	}
	
	static int countCurrentNeighbours(int[][] grid, int x, int y) {
		int count = 0;
		if (grid[y - 1][x - 1] == 'O') count++;
		if (grid[y - 1][x + 0] == 'O') count++;
		if (grid[y - 1][x + 1] == 'O') count++;
		if (grid[y + 0][x - 1] == 'O') count++;
		if (grid[y + 0][x + 1] == 'O') count++;
		if (grid[y + 1][x - 1] == 'O') count++;
		if (grid[y + 1][x + 0] == 'O') count++;
		if (grid[y + 1][x + 1] == 'O') count++;
		return count;
	}
	
	static void clearCurrentSnake(int[][] grid) {
		for (int y = 1; y < grid.length - 1; y++) {
			for (int x = 1; x < grid[y].length - 1; x++) {
				if (grid[y][x] == 'O')
					grid[y][x] = '.';
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
}