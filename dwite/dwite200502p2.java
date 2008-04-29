import java.io.*;
import java.util.StringTokenizer;


// DWITE - February 2005 - Problem 2: Snakes
public class dwite200502p2 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		// Read input
		StringTokenizer st = new StringTokenizer(in.readLine(), " ");
		int height = Integer.parseInt(st.nextToken());
		int width = Integer.parseInt(st.nextToken());
		char[][] grid = readGridAndPad(in, width, height, '.');
		
		// Find the largest snakes
		int maxcoiled = 0;
		int maxuncoiled = 0;
		for (int y = 1; y <= height; y++) {
			for (int x = 1; x <= width; x++) {
				int temp = markSnakeAndGetLength(grid, x, y);
				if (isCurrentSnakeCoiled(grid))
					maxcoiled = Math.max(temp, maxcoiled);
				else
					maxuncoiled = Math.max(temp, maxuncoiled);
				clearCurrentSnake(grid);
			}
		}
		
		// Write output
		out.printf("%d %d%n", maxcoiled, maxuncoiled);
	}
	
	
	private static boolean isCurrentSnakeCoiled(char[][] grid) {
		for (int y = 1; y < grid.length - 1; y++) {
			for (int x = 1; x < grid[y].length - 1; x++) {
				if (grid[y][x] == 'O' && countCurrentNeighbours(grid, x, y) >= 3)
					return true;
			}
		}
		return false;
	}
	
	
	private static int markSnakeAndGetLength(char[][] grid, int x, int y) {
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
	
	
	private static int countCurrentNeighbours(char[][] grid, int x, int y) {
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
	
	
	private static void clearCurrentSnake(char[][] grid) {
		for (int y = 1; y < grid.length - 1; y++) {
			for (int x = 1; x < grid[y].length - 1; x++) {
				if (grid[y][x] == 'O')
					grid[y][x] = '.';
			}
		}
	}
	
	
	
	private static char[][] readGridAndPad(BufferedReader in, int width, int height, char border) throws IOException {
		char[][] map = new char[height + 2][width + 2];
		for (int y = 1; y <= height; y++) {
			String line = in.readLine();
			for (int x = 1; x <= width; x++)
				map[y][x] = line.charAt(x - 1);
			map[y][0] = border;
			map[y][width + 1] = border;
		}
		for (int x = 0; x < width + 2; x++) {
			map[0][x] = border;
			map[height + 1][x] = border;
		}
		return map;
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