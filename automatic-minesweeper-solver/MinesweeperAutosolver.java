/* 
 * Automatic Minesweeper solver
 * Copyright (c) 2012 Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/automatic-minesweeper-solver
 */

import java.awt.AWTException;
import java.awt.GraphicsConfiguration;
import java.awt.GraphicsDevice;
import java.awt.GraphicsEnvironment;
import java.awt.MouseInfo;
import java.awt.Point;
import java.awt.Rectangle;
import java.awt.Robot;
import java.awt.event.InputEvent;
import java.awt.image.BufferedImage;
import java.awt.image.DataBuffer;
import java.awt.image.SampleModel;
import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.Random;
import javax.imageio.ImageIO;


/* Main application class, containing the Minesweeper solver logic */ 

public final class MinesweeperAutosolver {
	
	private static Random random = new Random();
	
	private static MinesweeperGame game;
	
	
	public static void main(String[] args) throws AWTException, InterruptedException {
		Thread.sleep(2000);
		game = new MinesweeperGame(50);
		
		// Play until win
		for (int i = 0; ; i++) {
			System.out.println("Game " + i);
			if (solveGame())
				break;
		}
		System.out.println("Win!");
	}
	
	
	private static boolean solveGame() {
		game.clickSmiley();
		game.rereadCells();
		
		while (true) {
			// Choose a random unopened cell to click
			int x, y;
			do {
				x = random.nextInt(game.numColumns);
				y = random.nextInt(game.numRows);
			} while (game.getCell(x, y) != 9);
			
			game.clickCell(x, y, InputEvent.BUTTON1_MASK);  // Left click
			game.rereadSmiley();
			if (game.smileyState == 1)  // Frown
				return false;
			else if (game.smileyState == 2)  // Sunglasses
				return true;
			game.rereadCells();
			
			// Try to make deterministic safe moves
			while (true) {
				boolean changed = false;
				while (solveSingles() || solvePairs())  // Try to solve as much as possible without the expensive screen reread
					changed = true;
				if (!changed)
					break;
				game.rereadSmiley();
				if (game.smileyState == 2)  // Sunglasses
					return true;
				if (game.smileyState == 1)
					throw new RuntimeException("Cannot lose with safe strategy");
				game.rereadCells();
			}
		}
	}
	
	
	private static boolean solveSingles() {
		boolean changed = false;
		for (int y = 0; y < game.numRows; y++) {
			for (int x = 0; x < game.numColumns; x++) {
				int state = game.getCell(x, y);
				if (state < 1 || state > 8)
					continue;  // Skip non-numerical cell
				
				int flag = countNeighboring(x, y, 10);
				int unopened = countNeighboring(x, y, 9);
				if (flag > state)
					throw new RuntimeException("Inconsistent game board");
				
				if (flag == state && unopened >= 1) {
					game.clickCell(x, y, InputEvent.BUTTON2_MASK);  // Middle click to open neighbors
					for (int yy = y - 1; yy <= y + 1; yy++) {
						for (int xx = x - 1; xx <= x + 1; xx++) {
							if (game.getCell(xx, yy) == 9)
								game.setCell(xx, yy, 12);
						}
					}
					changed = true;
					
				} else if (unopened >= 1 && flag + unopened == state) {
					for (int yy = y - 1; yy <= y + 1; yy++) {
						for (int xx = x - 1; xx <= x + 1; xx++) {
							if (game.getCell(xx, yy) == 9) {
								game.clickCell(xx, yy, InputEvent.BUTTON3_MASK);  // Right click to flag the cell
								game.setCell(xx, yy, 10);
							}
						}
					}
					changed = true;
				}
			}
		}
		return changed;
	}
	
	
	private static boolean solvePairs() {
		boolean changed = false;
		// For each cell (x, y) with a number on it
		for (int y = 0; y < game.numRows; y++) {
			for (int x = 0; x < game.numColumns; x++) {
				int state = game.getCell(x, y);
				if (state < 1 || state > 8)
					continue;
				state -= countNeighboring(x, y, 10);
				
				// For each neighbor (nx, ny) with a number on it
				for (int ny = y - 1; ny <= y + 1; ny++) {
					fail:
					for (int nx = x - 1; nx <= x + 1; nx++) {
						if (nx == x && ny == y || !game.isInBounds(nx, ny))
							continue;
						int neighstate = game.getCell(nx, ny);
						if (neighstate < 1 || neighstate > 8)
							continue;
						neighstate -= countNeighboring(nx, ny, 10);
						
						// Check if each unopened neighbor of (x, y) is a neighbor of (nx, ny)
						for (int yy = y - 1; yy <= y + 1; yy++) {
							for (int xx = x - 1; xx <= x + 1; xx++) {
								if (game.getCell(xx, yy) == 9 && !isNeighbor(xx, yy, nx, ny))
									continue fail;
							}
						}
						
						if (neighstate == state) {  // Open all cells unique to the neighbor
							for (int yy = ny - 1; yy <= ny + 1; yy++) {
								for (int xx = nx - 1; xx <= nx + 1; xx++) {
									if (game.getCell(xx, yy) == 9 && !isNeighbor(xx, yy, x, y)) {
										game.clickCell(xx, yy, InputEvent.BUTTON1_MASK);
										game.setCell(xx, yy, 12);
										changed = true;
									}
								}
							}
							
						} else if (neighstate - state == countNeighboring(nx, ny, 9) - countNeighboring(x, y, 9)) {  // Flag all cells unique to the neighbor
							for (int yy = ny - 1; yy <= ny + 1; yy++) {
								for (int xx = nx - 1; xx <= nx + 1; xx++) {
									if (game.getCell(xx, yy) == 9 && !isNeighbor(xx, yy, x, y)) {
										game.clickCell(xx, yy, InputEvent.BUTTON3_MASK);
										game.setCell(xx, yy, 10);
										changed = true;
									}
								}
							}
						}
					}
				}
			}
		}
		return changed;
	}
	
	
	private static int countNeighboring(int x, int y, int value) {
		int count = 0;
		for (int yy = y - 1; yy <= y + 1; yy++) {
			for (int xx = x - 1; xx <= x + 1; xx++) {
				if (game.getCell(xx, yy) == value)
					count++;
			}
		}
		return count;
	}
	
	
	private static boolean isNeighbor(int x0, int y0, int x1, int y1) {
		return Math.max(Math.abs(x0 - x1), Math.abs(y0 - y1)) <= 1;
	}
	
}



/* Minesweeper game, which lets the solver read the data from the GUI and perform actions on it */

final class MinesweeperGame {
	
	private MyRobot robot;
	
	// UI configuration for screen-scraping
	private final Rectangle smileyButton;
	private final Rectangle gameBoard;
	private final Point cellSize;
	
	public int numColumns;
	public int numRows;
	
	// 0 = smile, 1 = frown, 2 = sunglasses
	public int smileyState;
	
	// 0 = blank, 1 = 1 neighboring mine, ..., 8 = 8 neighboring mines,
	// 9 = unopened, 10 = flagged, 11 = question mark,
	// 12 = opened but unknown (written by the solver but never produced by this class), 13 = out of bounds
	public int[][] cellStates;
	
	
	public MinesweeperGame(int actionDelay) throws AWTException {
		robot = new MyRobot(actionDelay);
		
		// Detect screen resolution
		Rectangle allScreensBounds = new Rectangle();
		for (GraphicsDevice gd : GraphicsEnvironment.getLocalGraphicsEnvironment().getScreenDevices()) {
			for (GraphicsConfiguration gc : gd.getConfigurations())
				allScreensBounds = allScreensBounds.union(gc.getBounds());
		}
		
		// Find smiley button
		MyImage screenshot = robot.getScreenshot(allScreensBounds);
		Point smiley = findRegion(screenshot, SMILEY_IMAGES[0]);  // Try to find smile face
		if (smiley == null)
			smiley = findRegion(screenshot, SMILEY_IMAGES[1]);  // Or try to find frown face
		if (smiley == null)
			smiley = findRegion(screenshot, SMILEY_IMAGES[2]);  // Or try to find sunglasses face
		if (smiley == null)
			throw new RuntimeException("Smile button not found on screen");
		smileyButton = new Rectangle(allScreensBounds.x + smiley.x, allScreensBounds.y + smiley.y, SMILEY_IMAGES[0].width, SMILEY_IMAGES[0].height);
		clickSmiley();  // Give focus to Minesweeper (if not focused it will give focus without activating the button; else it will click the button)
		clickSmiley();  // Click the button for sure
		System.out.printf("Smiley button: left=%d top=%d width=%d height=%d%n", smileyButton.x, smileyButton.y, smileyButton.width, smileyButton.height);
		
		// Find mine grid and its size
		MyImage UNOPENED = CELL_IMAGES[9];
		screenshot = robot.getScreenshot(allScreensBounds);
		
		// Find top left cell
		Point topLeft = findRegion(screenshot, UNOPENED);  // Relative to image coordinates (always non-negative), not screen coordinates (possibly negative or offset from zero)
		if (topLeft == null)
			throw new RuntimeException("Top left unopened cell not found on screen");
		
		// Find number of columns
		cellSize = new Point(UNOPENED.width, UNOPENED.height);
		numColumns = 0;
		for (int x = topLeft.x; x + cellSize.x <= screenshot.width && UNOPENED.equals(screenshot, x, topLeft.y); x += cellSize.x)
			numColumns++;
		
		// Find number of rows
		numRows = 0;
		for (int y = topLeft.y; y + cellSize.y <= screenshot.height && UNOPENED.equals(screenshot, topLeft.x, y); y += cellSize.y)
			numRows++;
		
		gameBoard = new Rectangle(allScreensBounds.x + topLeft.x, allScreensBounds.y + topLeft.y, numColumns * cellSize.x, numRows * cellSize.y);
		System.out.printf("Game board: cols=%d rows=%d; left=%d top=%d width=%d height=%d%n", numColumns, numRows, gameBoard.x, gameBoard.y, gameBoard.width, gameBoard.height);
		
		cellStates = new int[numRows][numColumns];
		System.out.printf("Action delay: %d ms%n", actionDelay);
		System.out.println();
	}
	
	
	public boolean isInBounds(int x, int y) {
		return x >= 0 && x < numColumns && y >= 0 && y < numRows;
	}
	
	
	public int getCell(int x, int y) {
		if (isInBounds(x, y))
			return cellStates[y][x];
		else
			return 13;
	}
	
	
	public void setCell(int x, int y, int val) {
		if (isInBounds(x, y))
			cellStates[y][x] = val;
	}
	
	
	public void clickSmiley() {
		robot.click(smileyButton.x + smileyButton.width / 2, smileyButton.y + smileyButton.height / 2, InputEvent.BUTTON1_MASK);
	}
	
	
	public void clickCell(int x, int y, int button) {
		if (!isInBounds(x, y))
			throw new IllegalArgumentException();
		robot.click(gameBoard.x + x * cellSize.x + cellSize.x / 2, gameBoard.y + y * cellSize.y + cellSize.y / 2, button);
	}
	
	
	public void rereadSmiley() {
		for (int delay = 1; delay < 1000; delay *= 2) {
			smileyState = findMatchingImageIndex(robot.getScreenshot(smileyButton), 0, 0, SMILEY_IMAGES);
			if (smileyState != -1)
				return;
			
			try {
				Thread.sleep(delay);
			} catch (InterruptedException e) {}
		}
		throw new RuntimeException("Unknown smiley state");
	}
	
	
	public void rereadCells() {
		for (int delay = 1; delay < 1000; delay *= 2) {
			MyImage image = robot.getScreenshot(gameBoard);
			boolean fail = false;
			middle:
			for (int y = 0; y < numRows; y++) {
				for (int x = 0; x < numColumns; x++) {
					cellStates[y][x] = findMatchingImageIndex(image, x * cellSize.x, y * cellSize.y, CELL_IMAGES);
					if (cellStates[y][x] == -1) {
						fail = true;
						break middle;
					}
				}
			}
			if (!fail)
				return;
			
			try {
				Thread.sleep(delay);
			} catch (InterruptedException e) {}
		}
		throw new RuntimeException("Unknown cell state");
	}
	
	
	private static Point findRegion(MyImage image, MyImage pattern) {
		for (int y = 0; y + pattern.height <= image.height; y++) {
			for (int x = 0; x + pattern.width <= image.width; x++) {
				if (pattern.equals(image, x, y))
					return new Point(x, y);
			}
		}
		return null;
	}
	
	
	private static int findMatchingImageIndex(MyImage image, int offX, int offY, MyImage[] patterns) {
		for (int i = 0; i < patterns.length; i++) {
			if (patterns[i].equals(image, offX, offY))
				return i;
		}
		return -1;
	}
	
	
	// Image constants
	
	private static MyImage[] SMILEY_IMAGES = {
		new MyImage("smile.png"),
		new MyImage("frown.png"),
		new MyImage("sunglasses.png")
	};
	
	private static MyImage[] CELL_IMAGES = {
		new MyImage("neighbor0.png"),
		new MyImage("neighbor1.png"),
		new MyImage("neighbor2.png"),
		new MyImage("neighbor3.png"),
		new MyImage("neighbor4.png"),
		new MyImage("neighbor5.png"),
		new MyImage("neighbor6.png"),
		new MyImage("neighbor7.png"),
		new MyImage("neighbor8.png"),
		new MyImage("unopened.png"),
		new MyImage("flag.png"),
		new MyImage("question.png")
	};
	
}



/* Lightweight image class */

final class MyImage {
	
	public final int[] pixels;
	public final int width;
	public final int height;
	
	
	public MyImage(BufferedImage image) {
		width = image.getWidth();
		height = image.getHeight();
		pixels = new int[width * height];
		
		SampleModel sm = image.getRaster().getSampleModel();
		if (image.getType() == BufferedImage.TYPE_INT_RGB &&
		    sm.getDataType() == DataBuffer.TYPE_INT &&
		    Arrays.equals(sm.getSampleSize(), new int[]{8, 8, 8})) {  // Fast path
			
			int[] temp = image.getRaster().getPixels(0, 0, width, height, (int[])null);
			for (int i = 0; i < pixels.length; i++) {
				pixels[i] = temp[i * 3 + 0] << 16
				          | temp[i * 3 + 1] <<  8
				          | temp[i * 3 + 2] <<  0;
			}
			
		} else {  // General path
			image.getRGB(0, 0, width, height, pixels, 0, width);
			for (int i = 0; i < pixels.length; i++)
				pixels[i] &= 0xFFFFFF;  // Get rid of alpha channel
		}
	}
	
	
	public MyImage(String filename) {
		this(readFile(filename));
	}
	
	
	public boolean equals(MyImage other, int offX, int offY) {
		if (other.width < width || other.height < height)
			throw new IllegalArgumentException();
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++) {
				if (other.pixels[(offY + y) * other.width + offX + x] != pixels[y * width + x])
					return false;
			}
		}
		return true;
	}
	
	
	private static BufferedImage readFile(String filename) {
		File file = new File(filename);
		if (!file.isFile()) {
			System.err.println("File does not exist: " + file);
			System.exit(1);
		}
		try {
			return ImageIO.read(file);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}
	
}



/* Convenience wrapper for java.awt.Robot */

final class MyRobot {
	
	private Robot robot;
	private int delay;  // Milliseconds
	private Point lastMouseLocation;
	
	
	public MyRobot(int delay) throws AWTException {
		robot = new Robot();
		robot.setAutoWaitForIdle(true);
		lastMouseLocation = null;
		this.delay = delay;
	}
	
	
	public MyImage getScreenshot(Rectangle rect) {
		return new MyImage(robot.createScreenCapture(rect));
	}
	
	
	public void click(int x, int y, int button) {
		if (lastMouseLocation != null && !MouseInfo.getPointerInfo().getLocation().equals(lastMouseLocation)) {
			System.err.println("Mouse moved. Program aborted");
			System.exit(1);
			return;
		}
		robot.mouseMove(x, y);
		lastMouseLocation = new Point(x, y);
		robot.mousePress(button);
		robot.mouseRelease(button);
		robot.delay(delay);
	}
	
}
