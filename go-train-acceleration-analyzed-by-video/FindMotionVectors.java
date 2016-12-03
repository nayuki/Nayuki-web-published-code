/* 
 * Find motion vectors
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/go-train-acceleration-analyzed-by-video
 */

import java.awt.Point;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import javax.imageio.ImageIO;


public final class FindMotionVectors {
	
	/*---- Configuration ----*/
	
	private static final int NUM_FRAMES = 967;
	
	private static final int IMAGE_SCALE = 4;
	private static final int IMAGE_WIDTH = 1280 * IMAGE_SCALE;
	private static final int IMAGE_HEIGHT = 192 * IMAGE_SCALE;
	
	private static final Point SEARCH_RANGE = new Point(4, 2);
	private static final int SEARCH_WINDOW_WIDTH = 640 * IMAGE_SCALE;
	private static final int SEARCH_WINDOW_HEIGHT = 150 * IMAGE_SCALE;
	private static final int SEARCH_WINDOW_TOP = 16 * IMAGE_SCALE;
	
	private static File framesDir;
	
	
	
	/*---- Main application: High-level search logic ----*/
	
	public static void main(String[] args) throws IOException {
		// Handle command line arguments
		framesDir = new File(args[0]);
		if (!framesDir.isDirectory())
			throw new RuntimeException();
		
		// First search displacements for all adjacent frames
		System.out.print("From frame number\tTo frame number\tDisplacement x\tDisplacement y\n");
		Point[][] knownDisplacements = new Point[NUM_FRAMES][NUM_FRAMES];
		{
			Point prevDisplacement = new Point(0, 0);
			for (int i = 1; i < NUM_FRAMES; i++) {
				Point displacement = searchForDisplacement(i - 1, i, prevDisplacement, SEARCH_RANGE);
				knownDisplacements[i - 1][i] = displacement;
				System.out.printf("%d\t%d\t%d\t%d\n", i - 1, i, displacement.x, displacement.y);
				prevDisplacement = displacement;
			}
		}
		
		// Perform deep search for each starting frame
		AtomicInteger startFrame = new AtomicInteger(0);
		for (int i = 0, numThreads = Runtime.getRuntime().availableProcessors(); i < numThreads; i++) {
			new Thread() {
				public void run() {
					try {
						while (true) {
							int sf = startFrame.getAndIncrement();
							if (sf + 1 >= NUM_FRAMES)
								break;
							doDeepSearch(sf, knownDisplacements);
						}
					} catch (IOException e) {
						e.printStackTrace();
						System.exit(1);
					}
				}
			}.start();
		}
	}
	
	
	private static void doDeepSearch(int startFrame, Point[][] knownDisplacements) throws IOException {
		Point velocity = knownDisplacements[startFrame][startFrame + 1];
		Point prevDisplacement = new Point(velocity);
		for (int endFrame = startFrame + 2; endFrame < NUM_FRAMES; endFrame++) {
			
			Point displacement = new Point(prevDisplacement.x + velocity.x, prevDisplacement.y + velocity.y);  // Initial estimate
			try {
				displacement = searchForDisplacement(startFrame, endFrame, displacement, SEARCH_RANGE);
			} catch (IllegalArgumentException e) {
				break;
			}
			knownDisplacements[startFrame][endFrame] = displacement;
			synchronized(FindMotionVectors.class) {
				System.out.printf("%d\t%d\t%d\t%d\n", startFrame, endFrame, displacement.x, displacement.y);
			}
			
			velocity = new Point(displacement.x - prevDisplacement.x, displacement.y - prevDisplacement.y);
			prevDisplacement = displacement;
		}
	}
	
	
	
	/*---- Image search/matching logic ----*/
	
	private static Point searchForDisplacement(int beforeFrame, int afterFrame, Point searchCenter, Point searchRange) throws IOException {
		int[] beforePixels = getFramePixels(beforeFrame);
		int[] afterPixels  = getFramePixels(afterFrame );
		int beforeValidWidth = getValidImageWidth(beforeFrame);
		int afterValidWidth  = getValidImageWidth(afterFrame );
		int imageCenterX = (IMAGE_WIDTH - SEARCH_WINDOW_WIDTH) / 2;
		
		boolean symmetricWindow;
		{
			int minBeforeX = imageCenterX - (searchCenter.x + searchRange.x) / 2;
			int maxBeforeX = imageCenterX - (searchCenter.x - searchRange.x) / 2 + SEARCH_WINDOW_WIDTH;
			int minAfterX = imageCenterX - (searchCenter.x - searchRange.x) / 2 + (searchCenter.x - searchRange.x);
			int maxAfterX = imageCenterX - (searchCenter.x + searchRange.x) / 2 + (searchCenter.x + searchRange.x) + SEARCH_WINDOW_WIDTH;
			symmetricWindow = 0 <= minBeforeX && maxBeforeX <= beforeValidWidth && 0 <= minAfterX && maxAfterX <= afterValidWidth;
		}
		
		int bestError = Integer.MAX_VALUE;
		int resultX = 0;
		int resultY = 0;
		for (int dy = -searchRange.y; dy <= searchRange.y; dy++) {
			for (int dx = -searchRange.x; dx <= searchRange.x; dx++) {
				int dispX = searchCenter.x + dx;
				int dispY = searchCenter.y + dy;
				
				int beforeY = SEARCH_WINDOW_TOP - dispY / 2;;
				int afterY = beforeY + dispY;
				int beforeX, afterX, windowWidth;
				if (symmetricWindow) {
					beforeX = imageCenterX - dispX / 2;
					afterX = beforeX + dispX;
					windowWidth = SEARCH_WINDOW_WIDTH;
				} else {
					// Incomplete algorithm that is well-adapted to the particular situation
					windowWidth = Math.min(afterValidWidth, SEARCH_WINDOW_WIDTH);
					afterX = afterValidWidth - windowWidth;
					beforeX = afterX - dispX;
				}
				
				if (beforeX < 0 || beforeX + SEARCH_WINDOW_WIDTH > IMAGE_WIDTH || beforeY < 0 || beforeY + SEARCH_WINDOW_HEIGHT > IMAGE_HEIGHT ||
						afterX < 0 || afterX + SEARCH_WINDOW_WIDTH > IMAGE_WIDTH || afterY < 0 || afterY + SEARCH_WINDOW_HEIGHT > IMAGE_HEIGHT)
					throw new IllegalArgumentException("Motion vector too large for search window");
				int error = getSubimageDifference(beforePixels, afterPixels, beforeX, beforeY, afterX, afterY, windowWidth, SEARCH_WINDOW_HEIGHT);
				if (error < bestError) {
					bestError = error;
					resultX = dispX;
					resultY = dispY;
				}
			}
		}
		return new Point(resultX, resultY);
	}
	
	
	private static int getValidImageWidth(int frameNum) {
		if (frameNum < 0 || frameNum >= NUM_FRAMES)
			throw new IndexOutOfBoundsException();
		else if (frameNum < 909)
			return IMAGE_WIDTH;
		else {
			int sf = 909;
			int ef = 966;
			int sx = 5075;
			int ex = 106;
			return (int)Math.round((double)(frameNum - sf) / (ef - sf) * (ex - sx) + sx);
		}
	}
	
	
	
	/*---- Simple utilities ----*/
	
	// Returns the total difference for the subimages pix0[x0 : x0 + h, y0 : y0 + h] versus pix1[x1 : x1 + w, y1 : y1 + h].
	// The result is always non-negative. Pure function. Throws an exception if any range is out of bounds.
	private static int getSubimageDifference(int[] pix0, int[] pix1, int x0, int y0, int x1, int y1, int w, int h) {
		if (pix0.length != pix1.length || pix0.length != IMAGE_WIDTH * IMAGE_HEIGHT)
			throw new IllegalArgumentException();
		if (x0 < 0 || y0 < 0 || x1 < 0 || y1 < 0 || w < 0 || h < 0 ||
				x0 + w > IMAGE_WIDTH || x1 + w > IMAGE_WIDTH || y0 + h > IMAGE_HEIGHT || y1 + h > IMAGE_HEIGHT)
			throw new IndexOutOfBoundsException();
		
		int result = 0;
		for (int y = 0; y < h; y++) {
			for (int x = 0; x < w; x++) {
				int p = pix0[(y0 + y) * IMAGE_WIDTH + (x0 + x)];
				int q = pix1[(y1 + y) * IMAGE_WIDTH + (x1 + x)];
				result += Math.abs(((p >>> 16) & 0xFF) - ((q >>> 16) & 0xFF));  // Red
				result += 2 * Math.abs(((p >>> 8) & 0xFF) - ((q >>> 8) & 0xFF));  // Green
				result += Math.abs((p & 0xFF) - (q & 0xFF));  // Blue
			}
		}
		return result;
	}
	
	
	/* Image reading with caching */
	
	private static List<Object[]> framePixelCache = new ArrayList<>();
	private static final int MAX_CACHE_SIZE = 10;
	
	
	private static int[] getFramePixels(int frameNum) throws IOException {
		// Search the cache
		synchronized(FindMotionVectors.class) {
			for (int i = 0; i < framePixelCache.size(); i++) {
				if (((Integer)framePixelCache.get(i)[0]).intValue() == frameNum) {
					// Move to front
					Object[] entry = framePixelCache.remove(i);
					framePixelCache.add(0, entry);
					return (int[])entry[1];
				}
			}
		}
		
		File file = new File(framesDir, String.format("%04d.bmp", frameNum));
		BufferedImage image = ImageIO.read(file);
		int[] pixels = new int[image.getWidth() * image.getHeight()];
		image.getRGB(0, 0, image.getWidth(), image.getHeight(), pixels, 0, image.getWidth());
		
		synchronized(FindMotionVectors.class) {
			if (!framePixelCache.isEmpty() && framePixelCache.size() >= MAX_CACHE_SIZE)
				framePixelCache.remove(framePixelCache.size() - 1);
			framePixelCache.add(0, new Object[]{frameNum, pixels});
		}
		
		return pixels;
	}
	
}
