import java.io.*;


// DWITE - February 2006 - Problem 4: Connect-4
public class dwite200602p4 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		for (int i = 0; i < 5; i++)
			mainOnce(in, out);
	}
	
	static void mainOnce(BufferedReader in, PrintWriter out) throws IOException {
		int[][] board = new int[6][7];  // 0 = unfilled, 1 = red, 2 = blue
		String moves = in.readLine();
		for (int i = 0; i < moves.length(); i++) {
			drop(board, moves.charAt(i) - '1', i % 2 + 1);
			if (hasWinner(board)) {
				String winner;
				if (i % 2 == 0) winner = "RED";
				else            winner = "BLUE";
				out.printf("%s-%d%n", winner, i + 1);
				break;
			}
		}
	}
	
	static void drop(int[][] board, int x, int color) {
		for (int y = board.length-1; y >= 0; y--) {
			if (board[y][x] == 0) {
				board[y][x] = color;
				return;
			}
		}
		throw new AssertionError();
	}
	
	static boolean hasWinner(int[][] board) {
		return hasWinner(board,  1, 0)   // Horizontal
		    || hasWinner(board,  0, 1)   // Vertical
		    || hasWinner(board,  1, 1)   // Forward diagonal
		    || hasWinner(board, -1, 1);  // Backward diagonal
	}
	
	static boolean hasWinner(int[][] board, int dirX, int dirY) {
		for (int y = 0; y < board.length; y++) {
			for (int x = 0; x < board[y].length; x++) {
				if (isWinner(board, x, y, dirX, dirY))
					return true;
			}
		}
		return false;
	}
	
	static boolean isWinner(int[][] board, int startX, int startY, int dirX, int dirY) {
		if (board[startY][startX] == 0)
			return false;
		for (int i = 1; i < 4; i++) {
			int x = startX + i * dirX;
			int y = startY + i * dirY;
			if (y < 0 || y >= board   .length) return false;
			if (x < 0 || x >= board[y].length) return false;
			if (board[y][x] != board[startY][startX]) return false;
		}
		return true;
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