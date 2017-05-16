/* 
 * Min/max image filter (Java)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/sliding-window-minimum-maximum-algorithm
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import javax.imageio.ImageIO;


public final class MinMaxImageFilter {
	
	public static void main(String[] args) throws IOException {
		// Print command line help
		if (args.length != 5) {
			System.err.println("Usage: java MinMaxImageFilter InImg.(bmp|png) (min|max) (box|disc) Radius OutImg.png");
			System.exit(1);
			return;
		}
		
		// Parse and check some arguments
		boolean maximize;
		if (args[1].equals("min"))
			maximize = false;
		else if (args[1].equals("max"))
			maximize = true;
		else
			throw new IllegalArgumentException();
		double radius = Double.parseDouble(args[3]);
		if (radius <= 0)
			throw new IllegalArgumentException();
		
		// Read input image and prepend grayscale value to each pixel
		BufferedImage img = ImageIO.read(new File(args[0]));
		int width = img.getWidth();
		int height = img.getHeight();
		long[] pixels = new long[width * height];
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++) {
				int color = img.getRGB(x, y);
				int red   = (color >>> 16) & 0xFF;
				int green = (color >>>  8) & 0xFF;
				int blue  = (color >>>  0) & 0xFF;
				int gray = red * 2126 + green * 7152 + blue * 722;
				pixels[y * width + x] = (long)gray << 24 | (color & 0xFFFFFF);
			}
		}
		
		// Perform min or max filtering by box or disc pattern
		if (args[2].equals("box"))  // Filter horizontal and vertical axes separately (easy)
			filterByBoxPattern(pixels, width, height, radius, maximize);
		else if (args[2].equals("disc"))  // Filter in 2 dimensions monolithically (hard)
			pixels = filterByDiscPattern(pixels, width, height, radius, maximize);
		else
			throw new IllegalArgumentException();
		
		// Copy pixels to new image and write output file
		img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++)
				img.setRGB(x, y, (int)pixels[y * width + x] & 0xFFFFFF);
		}
		ImageIO.write(img, "png", new File(args[4]));
	}
	
	
	private static void filterByBoxPattern(long[] pixels, int width, int height, double radius, boolean maximize) {
		int halfFilterLen = (int)radius;
		long[] newRow = new long[width];
		for (int y = 0; y < height; y++) {
			WindowMinMax wmm = new WindowMinMax(maximize);
			for (int x = -halfFilterLen; x < width; x++) {
				int i = x + halfFilterLen;
				if (i < width)
					wmm.addTail(pixels[y * width + i]);
				if (x >= 0) {
					newRow[x] = wmm.getExtremum();
					int j = x - halfFilterLen;
					if (j >= 0)
						wmm.removeHead(pixels[y * width + j]);
				}
			}
			System.arraycopy(newRow, 0, pixels, y * width, newRow.length);
		}
		
		long[] newCol = new long[height];
		for (int x = 0; x < width; x++) {
			WindowMinMax wmm = new WindowMinMax(maximize);
			for (int y = -halfFilterLen; y < height; y++) {
				int i = y + halfFilterLen;
				if (i < height)
					wmm.addTail(pixels[i * width + x]);
				if (y >= 0) {
					newCol[y] = wmm.getExtremum();
					int j = y - halfFilterLen;
					if (j >= 0)
						wmm.removeHead(pixels[j * width + x]);
				}
			}
			for (int y = 0; y < height; y++)
				pixels[y * width + x] = newCol[y];
		}
	}
	
	
	private static long[] filterByDiscPattern(long[] pixels, int width, int height, double radius, boolean maximize) {
		int[] halfFilterLens = new int[(int)radius + 1];
		for (int i = 0; i < halfFilterLens.length; i++)
			halfFilterLens[i] = (int)Math.sqrt(radius * radius - i * i);
		
		long[] result = new long[pixels.length];
		for (int y = 0; y < height; y++) {
			WindowMinMax[] wmms = new WindowMinMax[halfFilterLens.length * 2 - 1];
			for (int i = 0; i < wmms.length; i++)
				wmms[i] = new WindowMinMax(maximize);
			for (int x = -(int)radius; x < width; x++) {
				
				for (int dy = -halfFilterLens.length + 1; dy < halfFilterLens.length; dy++) {
					int ay = y + dy;
					if (ay < 0 || ay >= height)
						continue;
					int ax = x + halfFilterLens[Math.abs(dy)];
					if (ax < 0 || ax >= width)
						continue;
					wmms[dy + halfFilterLens.length - 1].addTail(pixels[ay * width + ax]);
				}
				
				if (x >= 0) {
					long temp = -1;
					for (WindowMinMax wmm : wmms) {
						if (wmm.isEmpty())
							continue;
						long val = wmm.getExtremum();
						if (temp == -1 || !maximize && val < temp || maximize && val > temp)
							temp = val;
					}
					result[y * width + x] = temp;
				}
				
				for (int dy = -halfFilterLens.length + 1; dy < halfFilterLens.length; dy++) {
					int ay = y + dy;
					if (ay < 0 || ay >= height)
						continue;
					int ax = x - halfFilterLens[Math.abs(dy)];
					if (ax < 0)
						continue;
					if (ax >= width)
						throw new AssertionError();
					wmms[dy + halfFilterLens.length - 1].removeHead(pixels[ay * width + ax]);
				}
			}
		}
		return result;
	}
	
	
	
	private static final class WindowMinMax {
		
		private final boolean maximize;
		private Deque<Long> deque;
		private int count;
		
		
		public WindowMinMax(boolean max) {
			maximize = max;
			deque = new ArrayDeque<>();
			count = 0;
		}
		
		
		public boolean isEmpty() {
			return count == 0;
		}
		
		
		public long getExtremum() {
			return deque.getFirst();
		}
		
		
		public void addTail(long val) {
			while (!deque.isEmpty() && (!maximize && val < deque.getLast() || maximize && val > deque.getLast()))
				deque.removeLast();
			deque.addLast(val);
			count++;
		}
		
		
		public void removeHead(long val) {
			if (count <= 0)
				throw new IllegalStateException();
			if (val == deque.getFirst())
				deque.removeFirst();
			count--;
		}
		
	}
	
}
