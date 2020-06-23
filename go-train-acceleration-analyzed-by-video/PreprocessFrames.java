/* 
 * Preprocess frames
 * 
 * Copyright (c) 2020 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/go-train-acceleration-analyzed-by-video
 */

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.concurrent.BrokenBarrierException;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.atomic.AtomicInteger;
import javax.imageio.ImageIO;


public final class PreprocessFrames {
	
	// Configuration
	private static final int INPUT_FRAME_START =  990;
	private static final int INPUT_FRAME_END   = 3900;
	private static final int INPUT_FRAME_DECIMATE = 3;
	private static final int IMAGE_WIDTH  = 1280;
	private static final int IMAGE_HEIGHT =  192;
	private static final int IMAGE_UPSCALE = 4;
	
	
	public static void main(String[] args) throws IOException {
		// Get and check arguments
		if (args.length != 2) {
			System.err.println("Usage: java PreprocessFrames InDir OutDir");
			System.exit(1);
			return;
		}
		File inDir  = new File(args[0]);
		File outDir = new File(args[1]);
		if (!inDir.isDirectory())
			throw new RuntimeException("Invalid input directory");
		if (!outDir.isDirectory())
			throw new RuntimeException("Invalid output directory");
		
		// Process image frames
		for (int inFrame = INPUT_FRAME_START, outFrame = 0; inFrame < INPUT_FRAME_END; inFrame += INPUT_FRAME_DECIMATE, outFrame++) {
			File inFile  = new File(inDir , String.format("%04d.bmp", inFrame ));
			File outFile = new File(outDir, String.format("%04d.bmp", outFrame));
			FastSincImageResampler.resampleFile(inFile, IMAGE_WIDTH * IMAGE_UPSCALE, IMAGE_HEIGHT * IMAGE_UPSCALE, outFile);
			System.out.printf("%s --> %s%n", inFile.getName(), outFile.getName());
		}
	}
	
	
	
	// Based on https://www.nayuki.io/page/sinc-based-image-resampler
	private static final class FastSincImageResampler {
		
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
			FastSincImageResampler rs = new FastSincImageResampler();
			rs.inputFile = inFile;
			rs.outputWidth = outWidth;
			rs.outputHeight = outHeight;
			rs.outputFile = outFile;
			rs.run();
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
		public int threads = -1;  // Number of threads to use (set a positive value, otherwise an automatic default value will be computed)
		public BufferedImage outputImage = null;  // run() does not read this, but will overwrite this field
		public File outputFile = null;
		public String outputFileType = null;  // Must be "png", "bmp", or null (auto-detection based on outputFile's extension)
		
		
		/**
		 * Constructs a blank resampler object - certain fields must be set before calling {@code run()}.
		 */
		public FastSincImageResampler() {}
		
		
		/**
		 * Runs the resampler. The data flow operates on a "waterfall" model, reading and writing the fields from top to bottom:
		 * <ol>
		 *   <li>If {@code inputFile} is non-{@code null}, then it is read into {@code inputImage}.</li>
		 *   <li>{@code inputImage} needs to be non-{@code null} now (set explicitly or read from {@code inputFile}).</li>
		 *   <li>{@code inputImage} is read into {@code inputWidth} and {@code inputHeight}.</li>
		 *   <li>{@code outputWidth} and {@code outputHeight} must be positive (set explicitly).</li>
		 *   <li>If a filter length is zero or negative, then a default filter length is computed and set for that axis.</li>
		 *   <li>If {@code threads} is zero or negative, then a default number of threads is computed and set.</li>
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
			if (threads <= 0)
				threads = Runtime.getRuntime().availableProcessors();
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
			final int inWidth = inputWidth;
			final int inHeight = inputHeight;
			final int outWidth = outputWidth;
			final int outHeight = outputHeight;
			
			// Get packed int pixels
			int[] inPixels = new int[inWidth * inHeight];
			inputImage.getRGB(0, 0, inWidth, inHeight, inPixels, 0, inWidth);
			
			// Convert to float
			final float[] inVert = new float[inWidth * inHeight * 3];
			for (int i = 0, j = 0; i < inPixels.length; i++, j += 3) {
				int rgb = inPixels[i];
				inVert[j + 0] = (float)Math.pow(((rgb >>> 16) & 0xFF) / 255.0, 2.2);
				inVert[j + 1] = (float)Math.pow(((rgb >>>  8) & 0xFF) / 255.0, 2.2);
				inVert[j + 2] = (float)Math.pow(((rgb >>>  0) & 0xFF) / 255.0, 2.2);
			}
			inPixels = null;
			
			Thread[] thr = new Thread[threads];
			final AtomicInteger sharedY = new AtomicInteger(0);
			final float[] inHorz = new float[inWidth * outHeight * 3];
			final CyclicBarrier barrier = new CyclicBarrier(threads);
			final AtomicInteger sharedX = new AtomicInteger(0);
			final int[] outPixels = new int[outWidth * outHeight];
			for (int i = 0; i < thr.length; i++) {
				thr[i] = new Thread() {
					public void run() {
						// Resample vertically and transpose
						{
							double sincScale = Math.min((double)outHeight / inHeight, 1);
							double[] weights = new double[(int)verticalFilterLength + 1];
							float[] outVertRow = new float[inWidth * 3];
							while (true) {  // For each output row
								int y = sharedY.getAndIncrement();
								if (y >= outHeight)
									break;
								
								double weightSum = 0;
								double centerY = (y + 0.5) / outHeight * inHeight;  // In input image coordinates
								double filterStartY = centerY - verticalFilterLength / 2;
								int startIndex = (int)Math.ceil(filterStartY - 0.5);
								for (int i = 0; i < weights.length; i++) {
									int inputY = startIndex + i;
									double weight = windowedSinc((inputY + 0.5 - centerY) * sincScale, (inputY + 0.5 - filterStartY) / verticalFilterLength);
									weights[i] = weight;
									weightSum += weight;
								}
								
								Arrays.fill(outVertRow, 0);
								for (int i = 0; i < weights.length; i++) {
									double weight = weights[i] / weightSum;
									int clippedInputY = Math.min(Math.max(startIndex + i, 0), inHeight - 1);
									for (int x = 0; x < inWidth; x++) {  // For each pixel in the row
										int j = (clippedInputY * inWidth + x) * 3;
										outVertRow[x * 3 + 0] += inVert[j + 0] * weight;
										outVertRow[x * 3 + 1] += inVert[j + 1] * weight;
										outVertRow[x * 3 + 2] += inVert[j + 2] * weight;
									}
								}
								for (int x = 0; x < inWidth; x++) {
									int j = (x * outHeight + y) * 3;
									inHorz[j + 0] = outVertRow[x * 3 + 0];
									inHorz[j + 1] = outVertRow[x * 3 + 1];
									inHorz[j + 2] = outVertRow[x * 3 + 2];
								}
							}
						}
						
						// Wait for all threads to finish the phase
						try {
							barrier.await();
						} catch (InterruptedException e) {
							throw new RuntimeException(e);
						} catch (BrokenBarrierException e) {
							throw new RuntimeException(e);
						}
						
						// Resample horizontally and transpose
						{
							double sincScale = Math.min((double)outWidth / inWidth, 1);
							double[] weights = new double[(int)horizontalFilterLength + 1];
							double[] outHorzCol = new double[outHeight * 3];
							while (true) {  // For each output column
								int x = sharedX.getAndIncrement();
								if (x >= outWidth)
									break;
								
								double weightSum = 0;
								double centerX = (x + 0.5) / outWidth * inWidth;  // In input image coordinates
								double filterStartX = centerX - horizontalFilterLength / 2;
								int startIndex = (int)Math.ceil(filterStartX - 0.5);
								for (int i = 0; i < weights.length; i++) {
									int inputX = startIndex + i;
									double weight = windowedSinc((inputX + 0.5 - centerX) * sincScale, (inputX + 0.5 - filterStartX) / horizontalFilterLength);
									weights[i] = weight;
									weightSum += weight;
								}
								
								Arrays.fill(outHorzCol, 0);
								for (int i = 0; i < weights.length; i++) {
									double weight = weights[i] / weightSum;
									int clippedInputX = Math.min(Math.max(startIndex + i, 0), inWidth - 1);
									for (int y = 0; y < outHeight; y++) {  // For each pixel in the column
										int j = (clippedInputX * outHeight + y) * 3;
										outHorzCol[y * 3 + 0] += inHorz[j + 0] * weight;
										outHorzCol[y * 3 + 1] += inHorz[j + 1] * weight;
										outHorzCol[y * 3 + 2] += inHorz[j + 2] * weight;
									}
								}
								for (int y = 0; y < outHeight; y++) {
									// Convert to 8 bits per channel and pack integers
									double r = outHorzCol[y * 3 + 0] * 255;  if (r < 0) r = 0;  if (r > 255) r = 255;
									double g = outHorzCol[y * 3 + 1] * 255;  if (g < 0) g = 0;  if (g > 255) g = 255;
									double b = outHorzCol[y * 3 + 2] * 255;  if (b < 0) b = 0;  if (b > 255) b = 255;
									outPixels[y * outWidth + x] = (int)(r + 0.5) << 16 | (int)(g + 0.5) << 8 | (int)(b + 0.5);
								}
							}
						}
					}
				};
				thr[i].start();
			}
			try {
				for (Thread th : thr)
					th.join();
			} catch (InterruptedException e) {
				throw new RuntimeException(e);
			}
			
			outputImage = new BufferedImage(outWidth, outHeight, BufferedImage.TYPE_INT_RGB);
			outputImage.setRGB(0, 0, outWidth, outHeight, outPixels, 0, outWidth);
		}
		
		
		// x is measured in half-cycles; y is for the window which has the domain [0, 1]
		private static double windowedSinc(double x, double y) {
			x *= Math.PI;
			double sinc = x != 0 ? Math.sin(x) / x : 1;
			double window = y >= 0 && y <= 1 ? 1 - Math.abs(y - 0.5) * 2 : 0;  // Triangle window
			return sinc * window;
		}
		
	}
	
}
