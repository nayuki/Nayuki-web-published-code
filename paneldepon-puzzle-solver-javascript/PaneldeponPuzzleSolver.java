/* 
 * Panel de Pon puzzle solver (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/panel-de-pon-puzzle-solver-javascript
 */

import java.io.BufferedReader;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import java.util.Set;
import java.util.zip.DataFormatException;


/* 
 * Usage: java PaneldeponPuzzleSolver < Input.txt
 * 
 * This program reads the puzzle from standard input and
 * prints the sequence of moves to standard output.
 * 
 * The input text represents the initial puzzle state. For example:
 *   3       <-- Maximum number of moves allowed
 *   ......  <-- The board has 12 lines of 6 characters each
 *   ......  <-- Period ('.') denotes an empty space
 *   ......  <-- Note that there is no leading indentation in the actual input
 *   ......
 *   ......
 *   ......
 *   ......
 *   .b....  <-- Each lowercase letter represents a different-colored tile
 *   .a....
 *   .cdc..
 *   .badd.
 *   .abbc.
 * 
 * And the sample output text:
 *   Solution: 3 moves
 *   1. B2-C2
 *   2. A1-B1
 *   3. B1-C1
 *   Boards visited: 977
 */
public final class PaneldeponPuzzleSolver {
	
	public static void main(String[] args) throws IOException, DataFormatException {
		final int WIDTH = 6;
		final int HEIGHT = 12;
		
		// Read puzzle
		BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
		int numMoves = Integer.parseInt(in.readLine());
		byte[] grid = new byte[WIDTH * HEIGHT];
		for (int y = HEIGHT - 1; y >= 0; y--) {
			String line = in.readLine();
			if (line == null)
				throw new EOFException();
			if (line.length() != WIDTH)
				throw new DataFormatException("Invalid line length");
			for (int x = 0; x < WIDTH; x++) {
				char c = line.charAt(x);
				if (c == '.' || c >= 'a' && c <= 'z')
					grid[y*WIDTH + x] = (byte)c;
				else
					throw new DataFormatException("Invalid tile character");
			}
		}
		
		// Print solution
		Object[] solution = new Board(grid, WIDTH, HEIGHT, null, null, 0).solve(numMoves);
		if (solution[0] != null) {
			@SuppressWarnings("unchecked")
			List<SwapMove> moves = (List<SwapMove>)solution[0];
			if (moves.size() == 0)
				System.out.println("Solution: Self-clearing");
			else {
				System.out.printf("Solution: %d moves%n", moves.size());
				for (int i = 0; i < moves.size(); i++) {
					SwapMove move = moves.get(i);
					System.out.printf("%d. %s%d-%s%d%n", i + 1, formatXCoordinate(move.x), move.y, formatXCoordinate(move.x + 1), move.y);
				}
			}
		} else
			System.out.println("No solution");
		System.out.printf("Boards visited: %d%n", solution[1]);
	}
	
	
	private static String formatXCoordinate(int x) {
		if (x < 0 || x >= 702)
			throw new IllegalArgumentException();
		else if (x < 26)
			return "" + (char)('A' + x);
		else if (x < 702)
			return "" + (char)('A' + (x - 26) / 26) + (char)('A' + (x - 26) % 26);
		else
			throw new AssertionError();
	}
	
}



final class Board {
	
	// Immutable
	public final int width;
	public final int height;
	private byte[] grid;
	
	public final Board prevBoard;
	public final SwapMove prevMove;
	public final int depth;
	
	private int hash;
	
	
	
	public Board(byte[] grid, int width, int height, Board prevBoard, SwapMove prevMove, int depth) {
		this.grid = grid;
		this.width = width;
		this.height = height;
		this.prevBoard = prevBoard;
		this.prevMove = prevMove;
		this.depth = depth;
		hash = 0;
		
		dropTiles();
		while (matchAndClear()) {
			if (!dropTiles())
				break;
		}
	}
	
	
	
	public Object[] solve(int moves) {
		Set<Board> visited = new HashSet<>();
		Queue<Board> queue = new LinkedList<>();
		queue.add(this);
		visited.add(this);
		
		// Breadth-first search
		while (!queue.isEmpty()) {
			Board board = queue.remove();
			if (board.isEmpty()) {  // Solution found
				List<SwapMove> solution = new ArrayList<>();
				while (board.prevBoard != null) {
					solution.add(0, board.prevMove);
					board = board.prevBoard;
				}
				return new Object[]{solution, visited.size()};
			}
			
			else if (board.depth < moves) {  // Enqueue neighbors
				for (Board next : board.getNextBoards()) {
					if (!visited.contains(next)) {
						queue.add(next);
						visited.add(next);
					}
				}
			}
		}
		return new Object[]{null, visited.size()};
	}
	
	
	private Collection<Board> getNextBoards() {
		Collection<Board> result = new ArrayList<>();
		for (int y = 0; y < height; y++) {
			for (int x = 0; x + 1 < width; x++) {
				Board next = swap(x, y);
				if (next != null)
					result.add(next);
			}
		}
		return result;
	}
	
	
	private Board swap(int x, int y) {
		if (x < 0 || x + 1 >= width || y < 0 || y >= height)
			throw new IndexOutOfBoundsException();
		if (grid[y*width + x + 0] == grid[y*width + x + 1])
			return null;
		
		byte[] newGrid = grid.clone();
		newGrid[y*width + x + 0] = grid[y*width + x + 1];
		newGrid[y*width + x + 1] = grid[y*width + x + 0];
		return new Board(newGrid, width, height, this, new SwapMove(x, y), depth + 1);
	}
	
	
	private boolean isEmpty() {
		for (byte b : grid) {
			if (b != EMPTY)
				return false;
		}
		return true;
	}
	
	
	private boolean dropTiles() {
		boolean changed = false;
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++) {
				if (grid[y*width + x] == EMPTY)
					continue;
				for (int i = y; i - 1 >= 0 && grid[(i-1)*width + x] == EMPTY; i--) {
					grid[(i-1)*width + x] = grid[i*width + x];
					grid[i*width + x] = EMPTY;
					changed = true;
				}
			}
		}
		return changed;
	}
	
	
	private boolean matchAndClear() {
		boolean[] toClear = new boolean[width * height];
		
		// Find horizontal matches
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width - MINIMUM_RUN + 1; ) {
				int run = getRunLength(x, y, 1, 0);
				if (run >= MINIMUM_RUN) {
					for (int i = 0; i < run; i++)
						toClear[y*width + x + i] = true;
				}
				x += run;
			}
		}
		
		// Find vertical matches
		for (int x = 0; x < width; x++) {
			for (int y = 0; y < height - MINIMUM_RUN + 1; ) {
				int run = getRunLength(x, y, 0, 1);
				if (run >= MINIMUM_RUN) {
					for (int i = 0; i < run; i++)
						toClear[(y+i)*width + x] = true;
				}
				y += run;
			}
		}
		
		// Clear tiles
		boolean cleared = false;
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++) {
				if (toClear[y*width + x]) {
					grid[y*width + x] = EMPTY;
					cleared = true;
				}
			}
		}
		return cleared;
	}
	
	
	private int getRunLength(int x, int y, int dx, int dy) {
		byte val = grid[y*width + x];
		if (val == EMPTY)
			return 1;
		int count = 1;
		x += dx;
		y += dy;
		while (x < width && y < height && grid[y*width + x] == val) {
			count++;
			x += dx;
			y += dy;
		}
		return count;
	}
	
	
	public boolean equals(Object obj) {
		if (obj == this)
			return true;
		else if (!(obj instanceof Board))
			return false;
		else {
			Board other = (Board)obj;
			return width  == other.width
				&& height == other.height
				&& Arrays.equals(grid, other.grid);
		}
	}
	
	
	public int hashCode() {
		if (hash == 0) {
			int h = 0;
			for (byte b : grid) {
				h += b;
				h *= 0x7C824F73;
				h ^= 0x5C12FE83;
				h = Integer.rotateLeft(h, 5);
			}
			hash = h;
		}
		return hash;
	}
	
	
	public String toString() {
		StringBuilder sb = new StringBuilder();
		String newline = System.getProperty("line.separator");
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++)
				sb.append((char)grid[y*width + x]);
			sb.append(newline);
		}
		return sb.toString();
	}
	
	
	private static final byte EMPTY = '.';
	private static final int MINIMUM_RUN = 3;
	
}



class SwapMove {
	
	// Immutable
	public final int x;
	public final int y;
	
	
	public SwapMove(int x, int y) {
		this.x = x;
		this.y = y;
	}
	
	
	public String toString() {
		return String.format("(%d, %d)", x, y);
	}
	
}
