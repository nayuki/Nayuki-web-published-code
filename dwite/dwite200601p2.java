import java.io.*;


// DWITE - January 2006 - Problem 2: Scrabble
public class dwite200601p2 {
	
	private static final int[] lettervalue = {1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10};
	
	
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		// 0 = normal, 1 = pink, 2 = red, 3 = light blue, 4 = dark blue, 5-9 = same meaning but to be scored and cleared
		int[][] boardvalue = {
			{2, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 2},
			{0, 1, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 1, 0},
			{0, 0, 1, 0, 0, 0, 3, 0, 3, 0, 0, 0, 1, 0, 0},
			{3, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 3},
			{0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0},
			{0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0},
			{0, 0, 3, 0, 0, 0, 3, 0, 3, 0, 0, 0, 3, 0, 0},
			{2, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 2},
			{0, 0, 3, 0, 0, 0, 3, 0, 3, 0, 0, 0, 3, 0, 0},
			{0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0},
			{0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0},
			{3, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 3},
			{0, 0, 1, 0, 0, 0, 3, 0, 3, 0, 0, 0, 1, 0, 0},
			{0, 1, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 1, 0},
			{2, 0, 0, 3, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 2}};
		
		char[][] board = new char[15][15];
		
		for (int i = 0; i < 5; i++)
			mainOnce(in, out, board, boardvalue);
	}
	
	
	private static void mainOnce(BufferedReader in, PrintWriter out, char[][] board, int[][] boardvalue) throws IOException {
		int col = in.readLine().charAt(0) - 'A';
		int row = Integer.parseInt(in.readLine()) - 1;
		boolean horz = in.readLine().equals("ACROSS");
		String newletters = in.readLine();
		int dx = horz ? 1 : 0;
		int dy = horz ? 0 : 1;
		
		int score = 0;
		for (int i = 0; i < newletters.length(); row += dy, col += dx) {
			if (board[row][col] == 0) {
				board[row][col] = newletters.charAt(i);
				boardvalue[row][col] += 5;
				i++;
			}
		}
		if (horz) {
			score += scoreHorizontal(col - 1, row, board, boardvalue);
			for (int x = 0; x < boardvalue[row].length; x++) {
				if (boardvalue[row][x] >= 5)
					score += scoreVertical(x, row, board, boardvalue);
			}
		} else {
			score += scoreVertical(col, row - 1, board, boardvalue);
			for (int y = 0; y < boardvalue.length; y++) {
				if (boardvalue[y][col] >= 5)
					score += scoreHorizontal(col, y, board, boardvalue);
			}
		}
		if (newletters.length() == 7)
			score += 50;
		
		out.println(score);
		
		// Clear squares used in this turn
		for (int y = 0; y < boardvalue.length; y++) {
			for (int x = 0; x < boardvalue[y].length; x++) {
				if (boardvalue[y][x] == 5)
					boardvalue[y][x] = 0;
			}
		}
	}
	
	
	private static int scoreHorizontal(int x, int y, char[][] board, int[][] boardvalue) {
		int start, end;
		for (start = x; start >= 1 && board[y][start - 1] != 0; start--) ;
		for (end = x; end < board[y].length-1 && board[y][end + 1] != 0; end++) ;
		if (end - start + 1 == 1)
			return 0;
		
		int score = 0;
		int wordmult = 1;
		for (int i = start; i <= end; i++) {
			int letterscore = lettervalue[board[y][i] - 'A'];
			switch (boardvalue[y][i]) {
				case 5:
					break;
				case 6:
					wordmult *= 2;
					break;
				case 7:
					wordmult *= 3;
					break;
				case 8:
					letterscore *= 2;
					break;
				case 9:
					letterscore *= 3;
					break;
			}
			score += letterscore;
			if (boardvalue[y][i] >= 5)
				boardvalue[y][i] = 5;
		}
		score *= wordmult;
		return score;
	}
	
	
	private static int scoreVertical(int x, int y, char[][] board, int[][] boardvalue) {
		int start, end;
		for (start = y; start >= 1 && board[start - 1][x] != 0; start--) ;
		for (end = y; end < board.length-1 && board[end + 1][x] != 0; end++) ;
		if (end - start + 1 == 1)
			return 0;
		
		int score = 0;
		int wordmult = 1;
		for (int i = start; i <= end; i++) {
			int letterscore = lettervalue[board[i][x] - 'A'];
			switch (boardvalue[i][x]) {
				case 5:
					break;
				case 6:
					wordmult *= 2;
					break;
				case 7:
					wordmult *= 3;
					break;
				case 8:
					letterscore *= 2;
					break;
				case 9:
					letterscore *= 3;
					break;
			}
			score += letterscore;
			if (boardvalue[i][x] >= 5)
				boardvalue[i][x] = 5;
		}
		score *= wordmult;
		return score;
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