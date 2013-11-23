/* 
 * Sinc-based image resampler (fast version)
 * 
 * Copyright (c) 2013 Nayuki Minase
 * http://nayuki.eigenstate.org/page/sinc-based-image-resampler
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program (see COPYING.txt).
 * If not, see <http://www.gnu.org/licenses/>.
 */

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;

import javax.imageio.ImageIO;


public final class fastsincimageresample {
	
	/* Command-line program functions */
	
	/** 
	 * The program main entry point.
	 * Usage: java fastsincimageresample InFile.{png,bmp} OutWidth OutHeight OutFile.{png,bmp} [HorzFilterLen [VertFilterLen]]
	 * @param args the command-line arguments
	 */
	public static void main(String[] args) {
		// Print help
		if (args.length < 4 || args.length > 6) {
			System.err.println("Sinc-based image resampler");
			System.err.println("Copyright (c) 2013 Nayuki Minase");
			System.err.println("http://nayuki.eigenstate.org/");
			System.err.println("");
			System.err.println("Usage: java fastsincimageresample InFile.{png,bmp} OutWidth OutHeight OutFile.{png,bmp} [HorzFilterLen [VertFilterLen]]");
			System.exit(1);
			return;
		}
		
		// Run main program
		String msg = main1(args);
		if (msg != null) {
			System.err.println(msg);
			System.exit(1);
		}
	}
	
	
	private static String main1(String[] args) {
		// Parse and check numerical arguments
		int outWidth  = parsePositiveInt(args[1]);
		int outHeight = parsePositiveInt(args[2]);
		if (outWidth <= 0)
			return "Output width must be a positive integer";
		if (outHeight <= 0)
			return "Output height must be a positive integer";
		
		double horzFilterLen;
		double vertFilterLen;
		if (args.length >= 5) {
			horzFilterLen = parsePositiveDouble(args[4]);
			if (horzFilterLen == 0)
				return "Horizontal filter length must be a positive real number";
			
			if (args.length >= 6) {
				vertFilterLen = parsePositiveDouble(args[5]);
				if (vertFilterLen == 0)
					return "Vertical filter length must be a positive real number";
			} else
				vertFilterLen = horzFilterLen;
		} else {
			horzFilterLen = 0;
			vertFilterLen = 0;
		}
		
		// Check file arguments
		File inFile = new File(args[0]);
		File outFile = new File(args[3]);
		if (!inFile.isFile())
			return "Input file does not exist";
		String tempName = outFile.getName().toLowerCase();
		if (!tempName.endsWith(".bmp") && !tempName.endsWith(".png"))
			return "Output file must be BMP or PNG";
		
		// Do the work!
		try {
			resampleFile(inFile, outWidth, outHeight, horzFilterLen, vertFilterLen, outFile, tempName.substring(tempName.length() - 3).toLowerCase(), Runtime.getRuntime().availableProcessors(), true);
		} catch (IOException e) {
			return e.getMessage();
		}
		return null;
	}
	
	
	/* Simple utility functions */
	
	private static int parsePositiveInt(String s) {
		try {
			return Math.max(Integer.parseInt(s), 0);
		} catch (NumberFormatException e) {
			return 0;
		}
	}
	
	
	private static double parsePositiveDouble(String s) {
		try {
			double result = Double.parseDouble(s);
			if (result <= 0 || Double.isInfinite(result) || Double.isNaN(result))
				return 0;
			return result;
		} catch (NumberFormatException e) {
			return 0;
		}
	}
	
	
	/* Exportable library functions */
	
	/**
	 * Resamples the specified image file to the specified output dimensions with the specified filter lengths, writing to the specified output file.
	 * 
	 * @param inFile the input image file (must be in BMP or PNG format)
	 * @param outWidth the output image width (must be positive)
	 * @param outHeight the output image height (must be positive)
	 * @param horzFilterLen the horizontal filter length (0 for automatic according to a default value, otherwise must be positive)
	 * @param vertFilterLen the vertical filter length (0 for automatic according to a default value, otherwise must be positive)
	 * @param outFile the output image file
	 * @param outType the output image format (must be {@code "bmp"} or {@code "png"})
	 * @param threads the number of threads to use (must be positive)
	 * @param printInfo whether to print the image dimensions and filter lengths to standard error
	 * @throws IllegalArgumentException if any argument does not meet the requirements
	 * @throws IOException if an I/O exception occurred in reading the input image file or writing the output image file
	 */
	// (This is suitable for promotion to a public library function)
	static void resampleFile(File inFile, int outWidth, int outHeight, double horzFilterLen, double vertFilterLen, File outFile, String outType, int threads, boolean printInfo) throws IOException {
		// Read input image
		BufferedImage inImg;
		try {
			inImg = ImageIO.read(inFile);
		} catch (IOException e) {
			throw new IOException("Error reading input image file: " + e.getMessage(), e);
		}
		
		// Calculate default automatic filter length
		if (horzFilterLen == 0)
			horzFilterLen = Math.max((double)inImg.getWidth() / outWidth, 1) * 4.0;
		if (vertFilterLen == 0)
			vertFilterLen = Math.max((double)inImg.getHeight() / outHeight, 1) * 4.0;
		
		// Print info
		if (printInfo) {
			System.err.printf("Input  image dimensions: %d * %d%n", inImg.getWidth(), inImg.getHeight());
			System.err.printf("Output image dimensions: %d * %d%n", outWidth, outHeight);
			System.err.printf("Horizontal filter length: %.2f%n", horzFilterLen);
			System.err.printf("Vertical   filter length: %.2f%n", vertFilterLen);
		}
		
		// Resample
		BufferedImage outImg = resampleImage(inImg, outWidth, outHeight, horzFilterLen, vertFilterLen, threads);
		
		// Write output image
		try {
			ImageIO.write(outImg, outType, outFile);
		} catch (IOException e) {
			throw new IOException("Error writing output image file: " + e.getMessage(), e);
		}
	}
	
	
	/**
	 * Takes the specified image, resamples it to the specified output dimensions with the specified filter lengths, and returning the resulting image.
	 * 
	 * @param image the input image (treated as RGB24)
	 * @param outWidth the output image width (must be positive)
	 * @param outHeight the output image height (must be positive)
	 * @param horzFilterLen the horizontal filter length (must be positive)
	 * @param vertFilterLen the vertical filter length (must be positive)
	 * @param threads the number of threads to use (must be positive)
	 * @return the output resampled image (RGB24 format)
	 */
	// (This is suitable for promotion to a public library function)
	static BufferedImage resampleImage(BufferedImage image, int outWidth, int outHeight, double horzFilterLen, double vertFilterLen, int threads) {
		if (image == null)
			throw new NullPointerException();
		if (outWidth <= 0 || outHeight <= 0
				|| horzFilterLen <= 0 || Double.isInfinite(horzFilterLen) || Double.isNaN(horzFilterLen)
				|| vertFilterLen <= 0 || Double.isInfinite(vertFilterLen) || Double.isNaN(vertFilterLen))
			throw new IllegalArgumentException();
		
		// Convert image to array
		int inWidth = image.getWidth();
		int inHeight = image.getHeight();
		int[] inPixels = new int[inWidth * inHeight];
		image.getRGB(0, 0, inWidth, inHeight, inPixels, 0, inWidth);
		
		// Resample
		float[][] temp = resampleHorizontal(inPixels, inWidth, outWidth, horzFilterLen, threads);
		int[] outPixels = resampleVertical(temp, outWidth, outHeight, vertFilterLen, threads);
		
		// Convert array to image
		BufferedImage result = new BufferedImage(outWidth, outHeight, BufferedImage.TYPE_INT_RGB);
		result.setRGB(0, 0, outWidth, outHeight, outPixels, 0, outWidth);
		return result;
	}
	
	
	/* Internal computation functions */
	
	// Convolution-based linear resampler
	private static float[][] resampleHorizontal(final int[] image, final int oldWidth, final int newWidth, final double filterLen, int numThreads) {
		if (image.length % oldWidth != 0)
			throw new IllegalArgumentException();
		final int height = image.length / oldWidth;
		final float[][] result = new float[3][newWidth * height];
		final double sincScale = Math.min((double)newWidth / oldWidth, 1) * Math.PI;
		final double windowScale = 2.0 / filterLen;
		
		final AtomicInteger sharedY = new AtomicInteger(0);
		Thread[] threads = new Thread[numThreads];
		for (int i = 0; i < threads.length; i++) {
			threads[i] = new Thread() {
				public void run() {
					while (true) {
						int y = sharedY.getAndIncrement();
						if (y >= height)
							break;
						int inRowOff = y * oldWidth;
						int outRowOff = y * newWidth;
						for (int x = 0; x < newWidth; x++) {  // For each output pixel
							double redSum = 0, greenSum = 0, blueSum = 0;
							double filterSum = 0;
							double centerX = (x + 0.5) / newWidth * oldWidth;  // In input image coordinates
							double filterStartX = centerX - filterLen / 2;
							int startIndex = (int)Math.ceil(filterStartX - 0.5);
							for (int i = 0; i <= filterLen; i++) {
								int inputX = startIndex + i;
								double sincPos = (inputX + 0.5 - centerX) * sincScale;
								double sinc = sincPos != 0 ? Math.sin(sincPos) / sincPos : 1;
								double windowPos = (inputX + 0.5 - filterStartX) * windowScale - 1;  // Usually in the range [0, 2]
								double weight = sinc * Math.max(1 - Math.abs(windowPos), 0);
								int pixel = image[inRowOff + Math.min(Math.max(inputX, 0), oldWidth - 1)];
								redSum    += weight * ((pixel >>> 16) & 0xFF);
								greenSum  += weight * ((pixel >>> 8) & 0xFF);
								blueSum   += weight * (pixel & 0xFF);
								filterSum += weight;
							}
							result[0][outRowOff + x] = (float)(redSum   / filterSum);
							result[1][outRowOff + x] = (float)(greenSum / filterSum);
							result[2][outRowOff + x] = (float)(blueSum  / filterSum);
						}
					}
				}
			};
			threads[i].start();
		}
		for (Thread th : threads) {
			try {
				th.join();
			} catch (InterruptedException e) {
				throw new RuntimeException(e);
			}
		}
		return result;
	}
	
	
	// Convolution-based linear resampler
	private static int[] resampleVertical(final float[][] image, final int width, final int newHeight, final double filterLen, int numThreads) {
		if (image.length != 3 || image[0].length != image[1].length || image[1].length != image[2].length || image[0].length % width != 0)
			throw new IllegalArgumentException();
		final int[] result = new int[width * newHeight];
		final int oldHeight = image[0].length / width;
		final double sincScale = Math.min((double)newHeight / oldHeight, 1) * Math.PI;
		final double windowScale = 2.0 / filterLen;
		
		final AtomicInteger sharedX = new AtomicInteger(0);
		Thread[] threads = new Thread[numThreads];
		for (int i = 0; i < threads.length; i++) {
			threads[i] = new Thread() {
				public void run() {
					while (true) {
						int x = sharedX.getAndIncrement();
						if (x >= width)
							break;
						for (int y = 0; y < newHeight; y++) {  // For each output pixel
							double redSum = 0, greenSum = 0, blueSum = 0;
							double filterSum = 0;
							double centerY = (y + 0.5) / newHeight * oldHeight;  // In input image coordinates
							double filterStartY = centerY - filterLen / 2;
							int startIndex = (int)Math.ceil(filterStartY - 0.5);
							for (int i = 0; i <= filterLen; i++) {
								int inputY = startIndex + i;
								double sincPos = (inputY + 0.5 - centerY) * sincScale;
								double sinc = sincPos != 0 ? Math.sin(sincPos) / sincPos : 1;
								double windowPos = (inputY + 0.5 - filterStartY) * windowScale - 1;  // Usually in the range [0, 2]
								double weight = sinc * Math.max(1 - Math.abs(windowPos), 0);
								int index = Math.min(Math.max(inputY, 0), oldHeight - 1) * width + x;
								redSum    += weight * image[0][index];
								greenSum  += weight * image[1][index];
								blueSum   += weight * image[2][index];
								filterSum += weight;
							}
							double red   = (float)(redSum   / filterSum); if (red   < 0) red   = 0; else if (red   > 255) red   = 255;
							double green = (float)(greenSum / filterSum); if (green < 0) green = 0; else if (green > 255) green = 255;
							double blue  = (float)(blueSum  / filterSum); if (blue  < 0) blue  = 0; else if (blue  > 255) blue  = 255;
							result[y * width + x] = (int)(red + 0.5) << 16 | (int)(green + 0.5) << 8 | (int)(blue + 0.5);
						}
					}
				}
			};
			threads[i].start();
		}
		for (Thread th : threads) {
			try {
				th.join();
			} catch (InterruptedException e) {
				throw new RuntimeException(e);
			}
		}
		return result;
	}
	
}
