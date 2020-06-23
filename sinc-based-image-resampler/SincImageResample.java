/* 
 * Sinc-based image resampler
 * 
 * Copyright (c) 2017 Project Nayuki
 * https://www.nayuki.io/page/sinc-based-image-resampler
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


/* Command-line main program */
public final class SincImageResample {
	
	/**
	 * The program main entry point.
	 * <p>Usage: <code>java SincImageResample InFile.{png,bmp} OutWidth OutHeight OutFile.{png,bmp} [HorzFilterLen [VertFilterLen]]</code></p>
	 * @param args the command-line arguments
	 */
	public static void main(String[] args) {
		// Print help
		if (args.length < 4 || args.length > 6) {
			System.err.println("Sinc-based image resampler");
			System.err.println("Copyright (c) 2014 Project Nayuki");
			System.err.println("https://www.nayuki.io/");
			System.err.println("");
			System.err.println("Usage: java SincImageResample InFile.{png,bmp} OutWidth OutHeight OutFile.{png,bmp} [HorzFilterLen [VertFilterLen]]");
			System.exit(1);
			return;
		}
		
		// Run main program and catch error messages
		String msg = main1(args);
		if (msg != null) {
			System.err.println(msg);
			System.exit(1);
		}
	}
	
	
	private static String main1(String[] args) {
		// Parse and check numerical arguments
		int outWidth = parsePositiveInt(args[1]);
		int outHeight = parsePositiveInt(args[2]);
		if (outWidth <= 0)
			return "Output width must be a positive integer";
		if (outHeight <= 0)
			return "Output height must be a positive integer";
		
		double horzFilterLen = -1;
		double vertFilterLen = -1;
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
		}
		
		// Check file arguments
		File inFile = new File(args[0]);
		File outFile = new File(args[3]);
		if (!inFile.isFile())
			return "Input file does not exist";
		String lowername = outFile.getName().toLowerCase();
		if (!lowername.endsWith(".bmp") && !lowername.endsWith(".png"))
			return "Output file must be BMP or PNG";
		
		// Do the work!
		SincImageResampler rs = new SincImageResampler();
		try {
			rs.inputFile = inFile;
			rs.outputWidth = outWidth;
			rs.outputHeight = outHeight;
			rs.horizontalFilterLength = horzFilterLen;
			rs.verticalFilterLength = vertFilterLen;
			rs.outputFile = outFile;
			rs.run();
		} catch (IOException e) {
			return e.getMessage();
		}
		
		// Print info
		System.err.printf("Input  image dimensions: %d * %d%n", rs.inputWidth, rs.inputHeight);
		System.err.printf("Output image dimensions: %d * %d%n", outWidth, outHeight);
		System.err.printf("Horizontal filter length: %.2f%n", rs.horizontalFilterLength);
		System.err.printf("Vertical   filter length: %.2f%n", rs.verticalFilterLength);
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
	
}



final class SincImageResampler {
	
	/* Convenience methods */
	
	/**
	 * Resamples the specified image file to the specified output dimensions, writing to the specified output file.
	 * @param inFile the input image file (must be in BMP or PNG format)
	 * @param outWidth the output image width (must be positive)
	 * @param outHeight the output image height (must be positive)
	 * @param outFile the output image file
	 * @throws IOException if an I/O exception occurred in reading the input image file or writing the output image file
	 */
	public static void resampleFile(File inFile, int outWidth, int outHeight, File outFile) throws IOException {
		SincImageResampler rs = new SincImageResampler();
		rs.inputFile = inFile;
		rs.outputWidth = outWidth;
		rs.outputHeight = outHeight;
		rs.outputFile = outFile;
		rs.run();
	}
	
	
	/**
	 * Resamples the specified image to the specified output dimensions, returning a new image.
	 * @param image the input image (treated as RGB24)
	 * @param outWidth the output image width (must be positive)
	 * @param outHeight the output image height (must be positive)
	 * @return the output resampled image (RGB24 format)
	 */
	public static BufferedImage resampleImage(BufferedImage image, int outWidth, int outHeight) {
		SincImageResampler rs = new SincImageResampler();
		rs.inputImage = image;
		rs.outputWidth = outWidth;
		rs.outputHeight = outHeight;
		try {
			rs.run();
		} catch (IOException e) {
			throw new AssertionError(e);
		}
		return rs.outputImage;
	}
	
	
	/* Full functionality */
	
	public File inputFile = null;
	public BufferedImage inputImage = null;
	public int inputWidth   = -1;  // run() does not read this, but will overwrite this field
	public int inputHeight  = -1;  // run() does not read this, but will overwrite this field
	public int outputWidth  = -1;  // Must set to a positive number
	public int outputHeight = -1;  // Must set to a positive number
	public double horizontalFilterLength = -1;  // Horizontal filter length (set a positive value, otherwise an automatic default value will be computed)
	public double verticalFilterLength   = -1;  // Vertical   filter length (set a positive value, otherwise an automatic default value will be computed)
	public BufferedImage outputImage = null;  // run() does not read this, but will overwrite this field
	public File outputFile = null;
	public String outputFileType = null;  // Must be "png", "bmp", or null (auto-detection based on outputFile's extension)
	
	
	/**
	 * Constructs a blank resampler object - certain fields must be set before calling {@code run()}.
	 */
	public SincImageResampler() {}
	
	
	/**
	 * Runs the resampler. The data flow operates on a "waterfall" model, reading and writing the fields from top to bottom:
	 * <ol>
	 *   <li>If {@code inputFile} is non-{@code null}, then it is read into {@code inputImage}.</li>
	 *   <li>{@code inputImage} needs to be non-{@code null} now (set explicitly or read from {@code inputFile}).</li>
	 *   <li>{@code inputImage} is read into {@code inputWidth} and {@code inputHeight}.</li>
	 *   <li>{@code outputWidth} and {@code outputHeight} must be positive (set explicitly).</li>
	 *   <li>If a filter length is zero or negative, then a default filter length is computed and set for that axis.</li>
	 *   <li><strong>{@code outputImage} is computed by resampling {@code inputImage}.</strong> (This is the main purpose of the class.)</li>
	 *   <li>If {@code outputFile} is non-{@code null} and {@code outputFileType} is {@code null}: The type is set to {@code "png"} or {@code "bmp"}
	 *       if the output file has that extension (case-insensitive), otherwise it is set to {@code "png"} by default.</li>
	 *   <li>If {@code outputFile} is non-{@code null}, then {@code outputImage} is written to the file.</li>
	 * </ol>
	 * <p>After calling {@code run()}, it is recommend that this object should not be reused for another resampling operation.
	 * This is because various fields probably need to be cleared, such as the filter length and output file type.</p>
	 * @throws IOException if an I/O exception occurred
	 * @throws IllegalStateException if there is no input image or the output dimensions are not set to positive values
	 */
	public void run() throws IOException {
		// Read input file (optional)
		if (inputFile != null) {
			try {
				inputImage = ImageIO.read(inputFile);
			} catch (IOException e) {
				throw new IOException("Error reading input file (" + inputFile + "): " + e.getMessage(), e);
			}
		}
		
		// Get input image dimensions
		if (inputImage == null)
			throw new IllegalStateException("No input image");
		inputWidth = inputImage.getWidth();
		inputHeight = inputImage.getHeight();
		
		// Calculate filter lengths (optional)
		if (outputWidth <= 0 || outputHeight <= 0)
			throw new IllegalStateException("Output dimensions not set");
		if (horizontalFilterLength <= 0)
			horizontalFilterLength = Math.max((double)inputWidth / outputWidth, 1) * 4.0;
		if (verticalFilterLength <= 0)
			verticalFilterLength = Math.max((double)inputHeight / outputHeight, 1) * 4.0;
		
		// Resample the image
		resampleImage();
		
		// Write output file (optional)
		if (outputFile != null) {
			if (outputFileType == null) {  // Auto-detection by file extension
				String lowername = outputFile.getName().toLowerCase();
				if (lowername.endsWith(".bmp"))
					outputFileType = "bmp";
				else
					outputFileType = "png";  // Default
			}
			try {
				ImageIO.write(outputImage, outputFileType, outputFile);
			} catch (IOException e) {
				throw new IOException("Error writing output file (" + outputFile + "): " + e.getMessage(), e);
			}
		}
	}
	
	
	private void resampleImage() {
		int inWidth = inputWidth;
		int inHeight = inputHeight;
		int outWidth = outputWidth;
		int outHeight = outputHeight;
		
		// Resample each channel
		outputImage = new BufferedImage(outWidth, outHeight, BufferedImage.TYPE_INT_RGB);
		for (int i = 0; i < 3; i++) {
			// Convert to float array
			float[][] temp = new float[inHeight][inWidth];
			for (int y = 0; y < inHeight; y++) {
				for (int x = 0; x < inWidth; x++)
					temp[y][x] = (inputImage.getRGB(x, y) >>> (i * 8)) & 0xFF;
			}
			
			temp = transpose(resample(temp, outWidth , horizontalFilterLength));
			temp = transpose(resample(temp, outHeight, verticalFilterLength  ));
			
			// Accumulate to output image
			for (int y = 0; y < outHeight; y++) {
				for (int x = 0; x < outWidth; x++) {
					float val = temp[y][x];
					if (val > 255)
						val = 255;
					else if (val < 0)
						val = 0;
					outputImage.setRGB(x, y, outputImage.getRGB(x, y) | Math.round(val) << (i * 8));
				}
			}
		}
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
		double window = 0 <= y && y <= 1 ? 1 - Math.abs(y - 0.5) * 2 : 0;  // Triangle window
		return sinc * window;
	}
	
}
