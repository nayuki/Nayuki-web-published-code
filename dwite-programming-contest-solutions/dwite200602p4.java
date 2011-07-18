// DWITE - February 2006 - Problem 4: Connect-4
// Solution by Nayuki Minase


public final class dwite200602p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA41.txt", "OUT41.txt", new dwite200602p4());
	}
	
	
	private int[][] board;
	
	
	protected void runOnce() {
		board = new int[6][7];  // 0 = unfilled, 1 = red, 2 = blue
		String moves = io.readLine();
		for (int i = 0; i < moves.length(); i++) {
			drop(moves.charAt(i) - '1', i % 2 + 1);
			if (hasWinner()) {
				String winner;
				if (i % 2 == 0) winner = "RED";
				else            winner = "BLUE";
				io.printf("%s-%d%n", winner, i + 1);
				break;
			}
		}
	}
	
	
	private void drop(int x, int color) {
		for (int y = board.length - 1; y >= 0; y--) {
			if (board[y][x] == 0) {
				board[y][x] = color;
				return;
			}
		}
		throw new AssertionError("No free cell in column");
	}
	
	
	private boolean hasWinner() {
		return hasWinner( 1, 0)   // Horizontal
		    || hasWinner( 0, 1)   // Vertical
		    || hasWinner( 1, 1)   // Forward diagonal
		    || hasWinner(-1, 1);  // Backward diagonal
	}
	
	
	private boolean hasWinner(int dirX, int dirY) {
		for (int y = 0; y < board.length; y++) {
			for (int x = 0; x < board[y].length; x++) {
				if (isWinner(x, y, dirX, dirY))
					return true;
			}
		}
		return false;
	}
	
	
	private boolean isWinner(int startX, int startY, int dirX, int dirY) {
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
	
}
