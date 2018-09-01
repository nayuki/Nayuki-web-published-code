/* 
 * Panel de Pon puzzle solver (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/paneldepon-puzzle-solver-javascript
 */

import java.io.BufferedReader;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Queue;
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
 *   .cdc..  <-- This is row 2
 *   .badd.  <-- This is row 1
 *   .abbc.  <-- This is row 0
 *   ^^^
 *   ||Column C
 *   |Column B
 *   Column A
 * 
 * And the sample output text:
 *   Solution: 3 moves
 *   1. B2-C2
 *   2. A1-B1
 *   3. B1-C1
 *   Boards visited: 977
 */
public final class PaneldeponPuzzleSolver {
	
	private static final int WIDTH = 6;
	private static final int HEIGHT = 12;
	
	
	public static void main(String[] args) throws IOException, DataFormatException {
		Object[] temp = parsePuzzleText();
		int numMoves = (int)temp[0];
		Board startState = (Board)temp[1];
		
		temp = solve(numMoves, startState);
		Board endState = (Board)temp[0];
		@SuppressWarnings("unchecked")
		Map<Board,SearchInfo> visited = (Map<Board,SearchInfo>)temp[1];
		
		printSolution(endState, visited);
	}
	
	
	private static Object[] parsePuzzleText() throws IOException, DataFormatException {
		BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
		int numMoves = Integer.parseInt(in.readLine());
		byte[] startGrid = new byte[WIDTH * HEIGHT];
		for (int y = HEIGHT - 1; y >= 0; y--) {
			String line = in.readLine();
			if (line == null)
				throw new EOFException();
			if (line.length() != WIDTH)
				throw new DataFormatException("Invalid line length");
			for (int x = 0; x < WIDTH; x++) {
				char c = line.charAt(x);
				if (c == Board.EMPTY || 'a' <= c && c <= 'z')
					Board.gridSet(startGrid, x, y, (byte)c);
				else
					throw new DataFormatException("Invalid tile character");
			}
		}
		return new Object[]{numMoves, new Board(startGrid)};
	}
	
	
	private static Object[] solve(int numMoves, Board startState) {
		// Do breadth-first search
		Queue<Board> queue = new ArrayDeque<>();
		queue.add(startState);
		Map<Board,SearchInfo> visited = new HashMap<>();
		visited.put(startState, new SearchInfo(0, null, -1, -1));
		Board endState = null;
		while (!queue.isEmpty()) {
			Board state = queue.remove();
			if (state.isClear()) {
				endState = state;
				break;
			}
			int depth = visited.get(state).depth;
			if (depth >= numMoves)
				continue;
			for (int[] move : state.getMoves()) {
				Board newState = state.applyMove(move[0], move[1]);
				if (!visited.containsKey(newState)) {
					visited.put(newState, new SearchInfo(depth + 1, state, move[0], move[1]));
					queue.add(newState);
				}
			}
		}
		return new Object[]{endState, visited};
	}
	
	
	private static void printSolution(Board endState, Map<Board,SearchInfo> visited) {
		// Print solution
		if (endState == null)
			System.out.println("No solution");
		else {
			// Retrieve previous board states
			List<int[]> moves = new ArrayList<>();
			Board state = endState;
			while (true) {
				SearchInfo info = visited.get(state);
				if (info.prevBoard == null)
					break;
				moves.add(new int[]{info.prevMoveX, info.prevMoveY});
				state = info.prevBoard;
			}
			Collections.reverse(moves);
			
			// Format the list of moves
			if (moves.isEmpty())
				System.out.println("Solution: Self-clearing");
			else {
				System.out.printf("Solution: %d move%s%n", moves.size(), moves.size() > 1 ? "s" : "");
				for (int i = 0; i < moves.size(); i++) {
					int x = moves.get(i)[0], y = moves.get(i)[1];
					System.out.printf("%d. %s%d-%s%d%n", i + 1,
						formatXCoordinate(x), y, formatXCoordinate(x + 1), y);
				}
			}
		}
		System.out.printf("Boards visited: %d%n", visited.size());
	}
	
	
	// Examples: 0 -> A, 1 -> B, ..., 25 -> Z,
	// 26 -> AA, 27 -> AB, ..., 51 -> AZ,
	// 52 -> BA, ..., 701 -> ZZ.
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
	
	
	
	private static final class Board {  // Immutable
		
		private final byte[] grid;
		private final int hash;
		
		
		public Board(byte[] grid) {
			// Apply game rules to the grid
			this.grid = grid;
			do dropTiles();
			while (matchAndClear());
			
			// Calculate hash of grid state
			int h = 0;
			for (byte b : grid) {
				h += b;
				h *= 0x7C824F73;
				h ^= 0x5C12FE83;
				h = Integer.rotateLeft(h, 5);
			}
			hash = h;
		}
		
		
		private boolean dropTiles() {
			boolean changed = false;
			for (int x = 0; x < WIDTH; x++) {
				for (int yRead = 0, yWrite = 0; yRead < HEIGHT; yRead++) {
					if (gridGet(x, yRead) != EMPTY) {
						if (yRead > yWrite) {
							gridSet(x, yWrite, gridGet(x, yRead));
							gridSet(x, yRead, EMPTY);
							changed = true;
						}
						yWrite++;
					}
				}
			}
			return changed;
		}
		
		
		private boolean matchAndClear() {
			byte[] toClear = new byte[WIDTH * HEIGHT];  // Conceptually Boolean
			
			// Find horizontal matches
			for (int y = 0; y < HEIGHT; y++) {
				for (int x = 0; x < WIDTH; ) {
					int run = getRunLength(x, y, 1, 0);
					if (run >= MINIMUM_RUN) {
						for (int i = 0; i < run; i++)
							gridSet(toClear, x + i, y, (byte)1);
					}
					x += run;
				}
			}
			
			// Find vertical matches
			for (int x = 0; x < WIDTH; x++) {
				for (int y = 0; y < HEIGHT; ) {
					int run = getRunLength(x, y, 0, 1);
					if (run >= MINIMUM_RUN) {
						for (int i = 0; i < run; i++)
							gridSet(toClear, x, y + i, (byte)1);
					}
					y += run;
				}
			}
			
			// Clear tiles
			boolean cleared = false;
			for (int y = 0; y < HEIGHT; y++) {
				for (int x = 0; x < WIDTH; x++) {
					if (gridGet(toClear, x, y) == 1) {
						gridSet(x, y, EMPTY);
						cleared = true;
					}
				}
			}
			return cleared;
		}
		
		
		private int getRunLength(int x, int y, int dx, int dy) {
			if (dx < 0 || dy < 0 || dx == 0 && dy == 0)
				throw new IllegalArgumentException();
			byte val = gridGet(x, y);
			if (val == EMPTY)
				return 1;
			int count = 0;
			while (x < WIDTH && y < HEIGHT && gridGet(x, y) == val) {
				count++;
				x += dx;
				y += dy;
			}
			return count;
		}
		
		
		public boolean isClear() {
			for (byte b : grid) {
				if (b != EMPTY)
					return false;
			}
			return true;
		}
		
		
		public Collection<int[]> getMoves() {
			Collection<int[]> result = new ArrayList<>();
			for (int y = 0; y < HEIGHT; y++) {
				for (int x = 0; x + 1 < WIDTH; x++) {
					if (gridGet(x, y) != gridGet(x + 1, y))
						result.add(new int[]{x, y});
				}
			}
			return result;
		}
		
		
		public Board applyMove(int x, int y) {
			byte[] newGrid = grid.clone();
			gridSet(newGrid, x + 0, y, gridGet(x + 1, y));
			gridSet(newGrid, x + 1, y, gridGet(x + 0, y));
			return new Board(newGrid);
		}
		
		
		public boolean equals(Object obj) {
			return obj instanceof Board && Arrays.equals(grid, ((Board)obj).grid);
		}
		
		
		public int hashCode() {
			return hash;
		}
		
		
		public String toString() {
			StringBuilder sb = new StringBuilder();
			for (int y = HEIGHT - 1; y >= 0; y--) {
				for (int x = 0; x < WIDTH; x++)
					sb.append((char)gridGet(x, y));
				sb.append(NEWLINE);
			}
			return sb.toString();
		}
		
		
		public byte gridGet(int x, int y) {
			return gridGet(grid, x, y);
		}
		
		
		private void gridSet(int x, int y, byte val) {
			gridSet(grid, x, y, val);
		}
		
		
		private static byte gridGet(byte[] grid, int x, int y) {
			if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT)
				throw new IndexOutOfBoundsException();
			return grid[y * WIDTH + x];
		}
		
		
		private static void gridSet(byte[] grid, int x, int y, byte val) {
			if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT)
				throw new IndexOutOfBoundsException();
			grid[y * WIDTH + x] = val;
		}
		
		
		public static final byte EMPTY = '.';
		private static final int MINIMUM_RUN = 3;
		private static final String NEWLINE = System.getProperty("line.separator");
		
	}
	
	
	
	private static final class SearchInfo {  // Immutable
		
		public final int depth;
		public final Board prevBoard;
		public final int prevMoveX;
		public final int prevMoveY;
		
		
		public SearchInfo(int depth, Board prevBoard, int prevMoveX, int prevMoveY) {
			this.depth = depth;
			this.prevBoard = prevBoard;
			this.prevMoveX = prevMoveX;
			this.prevMoveY = prevMoveY;
		}
		
	}
	
}
