/* 
 * Sinc-based image resampler
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

import javax.imageio.ImageIO;


public final class sincimageresample {
	
	/* Command-line program functions */
	
	/** 
	 * The program main entry point.
	 * Usage: java sincimageresample InFile.{png,bmp} OutWidth OutHeight OutFile.{png,bmp} [HorzFilterLen [VertFilterLen]]
	 * @param args the command-line arguments
	 */
	public static void main(String[] args) {
		// Print help
		if (args.length < 4 || args.length > 6) {
			System.err.println("Sinc-based image resampler");
			System.err.println("Copyright (c) 2013 Nayuki Minase");
			System.err.println("http://nayuki.eigenstate.org/");
			System.err.println("");
			System.err.println("Usage: java sincimageresample InFile.{png,bmp} OutWidth OutHeight OutFile.{png,bmp} [HorzFilterLen [VertFilterLen]]");
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
			resampleFile(inFile, outWidth, outHeight, horzFilterLen, vertFilterLen, outFile, tempName.substring(tempName.length() - 3).toLowerCase(), true);
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
	 * @param printInfo whether to print the image dimensions and filter lengths to standard error
	 * @throws IllegalArgumentException if any argument does not meet the requirements
	 * @throws IOException if an I/O exception occurred in reading the input image file or writing the output image file
	 */
	// (This is suitable for promotion to a public library function)
	static void resampleFile(File inFile, int outWidth, int outHeight, double horzFilterLen, double vertFilterLen, File outFile, String outType, boolean printInfo) throws IOException {
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
		BufferedImage outImg = resampleImage(inImg, outWidth, outHeight, horzFilterLen, vertFilterLen);
		
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
	 * @return the output resampled image (RGB24 format)
	 */
	// (This is suitable for promotion to a public library function)
	static BufferedImage resampleImage(BufferedImage image, int outWidth, int outHeight, double horzFilterLen, double vertFilterLen) {
		if (image == null)
			throw new NullPointerException();
		if (outWidth <= 0 || outHeight <= 0
				|| horzFilterLen <= 0 || Double.isInfinite(horzFilterLen) || Double.isNaN(horzFilterLen)
				|| vertFilterLen <= 0 || Double.isInfinite(vertFilterLen) || Double.isNaN(vertFilterLen))
			throw new IllegalArgumentException();
		
		// Resample each channel
		int inWidth = image.getWidth();
		int inHeight = image.getHeight();
		BufferedImage result = new BufferedImage(outWidth, outHeight, BufferedImage.TYPE_INT_RGB);
		for (int i = 0; i < 3; i++) {
			// Convert to float array
			float[][] temp = new float[inHeight][inWidth];
			for (int y = 0; y < inHeight; y++) {
				for (int x = 0; x < inWidth; x++) {
					temp[y][x] = (image.getRGB(x, y) >>> (i * 8)) & 0xFF;
				}
			}
			
			temp = transpose(resample(temp, outWidth , horzFilterLen));
			temp = transpose(resample(temp, outHeight, vertFilterLen));
			
			// Accumulate to output image
			for (int y = 0; y < outHeight; y++) {
				for (int x = 0; x < outWidth; x++) {
					float val = temp[y][x];
					if (val > 255)
						val = 255;
					else if (val < 0)
						val = 0;
					result.setRGB(x, y, result.getRGB(x, y) | Math.round(val) << (i * 8));
				}
			}
		}
		
		return result;
	}
	
	
	/* Internal computation functions */
	
	// Convolution-based linear resampler for the horizontal direction
	private static float[][] resample(float[][] image, int newWidth, double filterLen) {
		int oldWidth = image[0].length;
		int height = image.length;
		double sincScale = Math.min((double)newWidth / oldWidth, 1);
		float[][] result = new float[height][newWidth];
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < newWidth; x++) {  // For each output pixel
				double valueSum = 0;
				double filterSum = 0;
				double centerX = (x + 0.5) / newWidth * oldWidth;  // In input image coordinates
				double filterStartX = centerX - filterLen / 2;
				int startIndex = (int)Math.ceil(filterStartX - 0.5);
				for (int i = 0; i <= filterLen; i++) {
					int inputX = startIndex + i;
					double weight = windowedSinc((inputX + 0.5 - centerX) * sincScale, (inputX + 0.5 - filterStartX) / filterLen);
					valueSum += weight * image[y][Math.min(Math.max(inputX, 0), oldWidth - 1)];
					filterSum += weight;
				}
				result[y][x] = (float)(valueSum / filterSum);
			}
		}
		return result;
	}
	
	
	// Transposes the given image
	private static float[][] transpose(float[][] image) {
		float[][] result = new float[image[0].length][image.length];
		for (int i = 0; i < result.length; i++) {
			for (int j = 0; j < result[i].length; j++)
				result[i][j] = image[j][i];
		}
		return result;
	}
	
	
	// x is measured in half-cycles; y is for the window which has the domain [0, 1]
	private static double windowedSinc(double x, double y) {
		x *= Math.PI;
		double sinc = x != 0 ? Math.sin(x) / x : 1;
		double window = y >= 0 && y <= 1 ? 1 - Math.abs(y - 0.5) * 2 : 0;  // Triangle window
		return sinc * window;
	}
	
}
