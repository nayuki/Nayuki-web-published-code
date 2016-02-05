/* 
 * Image columns annealer (Java)
 * 
 * Usage: java AnnealImageColumns InFile.{png,bmp} OutFile.png NumIterations StartTemperature
 * This program uses simulated annealing to permute the columns of the input image to generate an output image,
 * trying to minimize the difference between adjacent columns in an attempt to unscramble the image.
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/image-unshredder-by-annealing
 */

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.Random;
import javax.imageio.ImageIO;


public class AnnealImageColumns {
	
	public static void main(String[] args) throws IOException {
		// Handle filename arguments
		if (args.length != 4) {
			System.err.println("Usage: java AnnealImageColumns InFile.{png,bmp} OutFile.png NumIterations StartTemperature");
			return;
		}
		File inFile = new File(args[0]);
		File outFile = new File(args[1]);
		if (!inFile.isFile()) {
			System.err.println("Error: Input file does not exist");
			return;
		}
		if (outFile.isFile())
			System.err.println("Warning: Overwriting an existing output file");
		
		// Handle numerical arguments
		long numIterations;
		double startTemperature;
		try {
			numIterations = Long.parseLong(args[2]);
			if (numIterations <= 0)
				throw new NumberFormatException();
		} catch (NumberFormatException e) {
			System.err.println("Invalid number of iterations");
			return;
		}
		try {
			startTemperature = Double.parseDouble(args[3]);
			if (startTemperature <= 0)
				throw new NumberFormatException();
		} catch (NumberFormatException e) {
			System.err.println("Invalid starting temperature");
			return;
		}
		
		// Load the image
		BufferedImage image = ImageIO.read(inFile);
		int width = image.getWidth();
		int height = image.getHeight();
		int[] pixels = new int[width * height];
		image.getRGB(0, 0, width, height, pixels, 0, width);
		
		// Pre-calculate all column differences
		int[] columnDiffs = new int[width * width];
		for (int i = 0; i < width; i++) {
			for (int j = 0; j < width; j++) {
				if (i <= j)
					columnDiffs[i * width + j] = columnDiff(pixels, width, height, i, j);
				else
					columnDiffs[i * width + j] = columnDiffs[j * width + i];
			}
		}
		
		// Initialize variables
		int[] colPermutation = new int[width];
		for (int i = 0; i < colPermutation.length; i++)
			colPermutation[i] = i;
		int energy = 0;
		for (int x = 0; x < width - 1; x++)
			energy += columnDiffs[x * width + x + 1];
		Random rand = new Random();
		long startTime = System.currentTimeMillis();
		long nextPrintTime = System.currentTimeMillis();
		
		// Start annealing the image columns
		System.err.println("Time (s)     Done       Iterations  Temperature       Energy");
		for (long i = 0; i < numIterations; i++) {
			double t = (double)i / numIterations;
			double temperature = (1 - t) * startTemperature;
			
			// Randomly choose two distinct columns
			int col0 = rand.nextInt(width);
			int col1 = rand.nextInt(width);
			if (col0 != col1) {
				// Calculate the change in energy if the col0 were removed and inserted at col1
				int energyDiff = 0;
				if (col0 >= 1)
					energyDiff -= columnDiffs[colPermutation[col0 - 1] * width + colPermutation[col0]];
				if (col0 + 1 < width)
					energyDiff -= columnDiffs[colPermutation[col0] * width + colPermutation[col0 + 1]];
				if (col0 >= 1 && col0 + 1 < width)
					energyDiff += columnDiffs[colPermutation[col0 - 1] * width + colPermutation[col0 + 1]];
				if (col1 < col0) {
					if (col1 >= 1) {
						energyDiff -= columnDiffs[colPermutation[col1 - 1] * width + colPermutation[col1]];
						energyDiff += columnDiffs[colPermutation[col1 - 1] * width + colPermutation[col0]];
					}
					energyDiff += columnDiffs[colPermutation[col0] * width + colPermutation[col1]];
				} else {  // col1 > col0
					energyDiff += columnDiffs[colPermutation[col1] * width + colPermutation[col0]];
					if (col1 + 1 < width) {
						energyDiff -= columnDiffs[colPermutation[col1] * width + colPermutation[col1 + 1]];
						energyDiff += columnDiffs[colPermutation[col0] * width + colPermutation[col1 + 1]];
					}
				}
				
				// Accept the proposed change if energy improves or is within the simulated annealing probability
				if (energyDiff < 0 || Math.random() < fast2Pow(-energyDiff / temperature)) {
					int temp = colPermutation[col0];
					if (col1 < col0)
						System.arraycopy(colPermutation, col1, colPermutation, col1 + 1, col0 - col1);
					else  // col1 > col0
						System.arraycopy(colPermutation, col0 + 1, colPermutation, col0, col1 - col0);
					colPermutation[col1] = temp;
					energy += energyDiff;
				}
			}
			
			// Print status/progress periodically
			if ((i & 0xFFFF) == 0 && System.currentTimeMillis() >= nextPrintTime) {
				System.err.printf("%8d  %6.2f%%  %15s  %11.2f  %11s%n",
					(System.currentTimeMillis() - startTime) / 1000, t * 100, formatWithThousandsSeparators(i), temperature, formatWithThousandsSeparators(energy));
				nextPrintTime = System.currentTimeMillis() + STATUS_PRINT_INTERVAL;
			}
		}
		
		// Permute and write the output image
		for (int x = 0; x < width; x++) {
			int xx = colPermutation[x];
			for (int y = 0; y < height; y++)
				image.setRGB(x, y, pixels[y * width + xx]);
		}
		ImageIO.write(image, "png", outFile);
	}
	
	
	private static int columnDiff(int[] pixels, int width, int height, int x0, int x1) {
		int result = 0;
		for (int y = 0; y < height; y++) {
			int p0 = pixels[y * width + x0];
			int p1 = pixels[y * width + x1];
			for (int i = 0; i < 3; i++)
				result += Math.abs(((p0 >>> (i * 8)) & 0xFF) - ((p1 >>> (i * 8)) & 0xFF));
		}
		return result;
	}
	
	
	// Computes 2^x in a fast manner. Maximum relative error of 0.019% over the input range [-1020, 1020], guaranteed.
	private static double fast2Pow(double x) {
		if (x < -1022)  // Underflow
			return 0;
		if (x >= 1024)  // Overflow
			return Double.POSITIVE_INFINITY;
		double y = Math.floor(x);
		double z = x - y;  // In the range [0.0, 1.0)
		double u = Double.longBitsToDouble((long)((int)y + 1023) << 52);  // Equal to 2^floor(x)
		// Cubic polynomial, coefficients from numerical minimization in Wolfram Mathematica
		double v = ((0.07901988694851840505 * z + 0.22412622970387342355) * z + 0.69683883597650776993) * z + 0.99981190792895544660;
		return u * v;
	}
	
	
	private static String formatWithThousandsSeparators(long n) {
		String result = Long.toString(n);
		for (int i = result.length() - 3; i > 0; i -= 3)
			result = result.substring(0, i) + " " + result.substring(i);
		return result;
	}
	
	
	private static final int STATUS_PRINT_INTERVAL = 10000;  // In milliseconds
	
}
