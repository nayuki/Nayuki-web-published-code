/* 
 * Render frame text overlays
 * 
 * Copyright (c) 2020 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/go-train-acceleration-analyzed-by-video
 */

import java.awt.Color;
import java.awt.Font;
import java.awt.FontFormatException;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.concurrent.BrokenBarrierException;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.atomic.AtomicInteger;
import javax.imageio.ImageIO;


public final class RenderFrameTextOverlays {
	
	private static final double FRAME_RATE = 60 / 1.001;
	private static final int UPSCALE = 8;
	private static final float FONT_SIZE = 30.0f * UPSCALE;
	private static final float LINE_HEIGHT = 1.3f * FONT_SIZE;
	private static final double OUTLINE_RADIUS = 2.0 * UPSCALE;
	private static final int TEXT_COLOR = 0xFFFFFF;
	private static final int OUTLINE_COLOR = 0x000000;
	private static final int TRANSPARENT = 0;  // Upper 24 bits must be 0
	private static Font font;
	
	
	public static void main(String[] args) throws IOException, FontFormatException {
		// Handle command line arguments
		if (args.length != 2) {
			System.err.println("Usage: java RenderFrameTextOverlays PostprocessedMotion.tsv TextFramesDir");
			System.exit(1);
			return;
		}
		File textFile = new File(args[0]);
		if (!textFile.isFile())
			throw new IllegalArgumentException("Invalid text file");
		File outDir = new File(args[1]);
		if (!outDir.isDirectory())
			throw new IllegalArgumentException("Invalid output directory");
		font = Font.createFont(Font.TRUETYPE_FONT, new File("swiss-721-bt-normal.ttf"));
		
		// Read each line of the text file
		try (BufferedReader in = new BufferedReader(new InputStreamReader(new FileInputStream(textFile), StandardCharsets.UTF_8))) {
			in.readLine();  // Skip header line
			while (true) {
				String line = in.readLine();
				if (line == null)
					break;
				
				// Parse numbers and render single image frame
				String[] parts = line.split("\t", -1);
				int frameNum = Integer.parseInt(parts[0]);
				render(
					frameNum,
					frameNum / FRAME_RATE,
					Double.parseDouble(parts[1]),
					Double.parseDouble(parts[2]),
					Double.parseDouble(parts[3]),
					new File(outDir, String.format("%04d.png", frameNum)));
			}
		}
	}
	
	
	// Renders an image based on the given numbers and saves it to the given output file.
	private static void render(int frameNum, double time, double displacement, double velocity, double acceleration, File outFile) throws IOException {
		// Create blank image
		int width  = 1280 * UPSCALE;  // Full width
		int height =  180 * UPSCALE;  // Less than full height to save processing time
		BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++)
				image.setRGB(x, y, TRANSPARENT);
		}
		
		// Set graphics style
		Graphics2D g = image.createGraphics();
		g.setFont(font.deriveFont(FONT_SIZE));
		g.setColor(new Color(TEXT_COLOR));
		
		// Draw text strings
		g.drawString(String.format("Frame = %d"   , frameNum             ), LINE_HEIGHT, LINE_HEIGHT * 1.5f);
		g.drawString(String.format("Time = %.3f s", frameNum / FRAME_RATE), LINE_HEIGHT, LINE_HEIGHT * 2.5f);
		g.drawString(String.format("Displacement = %s m"   , formatReal(displacement, 3, false)), LINE_HEIGHT * 15, LINE_HEIGHT * 1.5f);
		g.drawString(String.format("Velocity = %s km/h"    , formatReal(velocity    , 2, false)), LINE_HEIGHT * 15, LINE_HEIGHT * 2.5f);
		g.drawString(String.format("Acceleration = %s m/s²", formatReal(acceleration, 3, true )), LINE_HEIGHT * 15, LINE_HEIGHT * 3.5f);
		
		// Create outlines around text pixels
		int[] pixels = new int[width * height];
		image.getRGB(0, 0, width, height, pixels, 0, width);
		int limit = (int)OUTLINE_RADIUS;
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++) {
				if (pixels[y * width + x] != (0xFF << 24 | TEXT_COLOR))
					continue;
				for (int i = -limit; i <= limit; i++) {
					for (int j = -limit; j <= limit; j++) {
						if (i * i + j * j <= OUTLINE_RADIUS * OUTLINE_RADIUS) {
							int k = y + i;
							int l = x + j;
							int index = k * width + l;
							if (0 <= k && k < height && 0 <= l && l < width && pixels[index] == TRANSPARENT)
								pixels[index] = 0xFF << 24 | OUTLINE_COLOR;
						}
					}
				}
			}
		}
		image.setRGB(0, 0, width, height, pixels, 0, width);
		
		// Downsample image and pad bottom to full height
		image = FastSincImageResampler.resampleImage(image, width / UPSCALE, height / UPSCALE);
		BufferedImage outImg = new BufferedImage(1280, 720, BufferedImage.TYPE_INT_ARGB);
		for (int y = 0; y < outImg.getHeight(); y++) {
			for (int x = 0; x < outImg.getWidth(); x++)
				outImg.setRGB(x, y, TRANSPARENT);
		}
		outImg.getGraphics().drawImage(image, 0, 0, null);
		ImageIO.write(outImg, "png", outFile);
	}
	
	
	// Returns a decimal string representation of the given number with the given parameters. Pure function.
	private static String formatReal(double val, int digits, boolean forcePlus) {
		if (digits < 0)
			throw new IllegalArgumentException();
		String temp = String.format("%." + digits + "f", Math.abs(val));
		if (val < 0)
			temp = "−" + temp;
		else if (forcePlus && val >= 0)
			temp = "+" + temp;
		return temp;
	}
	
	
	
	// Based on https://www.nayuki.io/page/sinc-based-image-resampler
	private static final class FastSincImageResampler {
		
		/* Convenience methods */
		
		/**
		 * Resamples the specified image to the specified output dimensions, returning a new image.
		 * @param image the input image (treated as RGB24)
		 * @param outWidth the output image width (must be positive)
		 * @param outHeight the output image height (must be positive)
		 * @return the output resampled image (RGB24 format)
		 */
		public static BufferedImage resampleImage(BufferedImage image, int outWidth, int outHeight) {
			FastSincImageResampler rs = new FastSincImageResampler();
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
			final float[] inVert = new float[inWidth * inHeight * 4];
			for (int i = 0, j = 0; i < inPixels.length; i++, j += 4) {
				int rgb = inPixels[i];
				inVert[j + 0] = srgbToLinear((rgb >>> 16) & 0xFF);
				inVert[j + 1] = srgbToLinear((rgb >>>  8) & 0xFF);
				inVert[j + 2] = srgbToLinear((rgb >>>  0) & 0xFF);
				inVert[j + 3] = (rgb >>> 24) & 0xFF;
			}
			inPixels = null;
			
			Thread[] thr = new Thread[threads];
			final AtomicInteger sharedY = new AtomicInteger(0);
			final float[] inHorz = new float[inWidth * outHeight * 4];
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
							float[] outVertRow = new float[inWidth * 4];
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
										int j = (clippedInputY * inWidth + x) * 4;
										outVertRow[x * 4 + 0] += inVert[j + 0] * weight;
										outVertRow[x * 4 + 1] += inVert[j + 1] * weight;
										outVertRow[x * 4 + 2] += inVert[j + 2] * weight;
										outVertRow[x * 4 + 3] += inVert[j + 3] * weight;
									}
								}
								for (int x = 0; x < inWidth; x++) {
									int j = (x * outHeight + y) * 4;
									inHorz[j + 0] = outVertRow[x * 4 + 0];
									inHorz[j + 1] = outVertRow[x * 4 + 1];
									inHorz[j + 2] = outVertRow[x * 4 + 2];
									inHorz[j + 3] = outVertRow[x * 4 + 3];
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
							double[] outHorzCol = new double[outHeight * 4];
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
										int j = (clippedInputX * outHeight + y) * 4;
										outHorzCol[y * 4 + 0] += inHorz[j + 0] * weight;
										outHorzCol[y * 4 + 1] += inHorz[j + 1] * weight;
										outHorzCol[y * 4 + 2] += inHorz[j + 2] * weight;
										outHorzCol[y * 4 + 3] += inHorz[j + 3] * weight;
									}
								}
								for (int y = 0; y < outHeight; y++) {
									// Convert to 8 bits per channel and pack integers
									double r = linearToSrgb(outHorzCol[y * 4 + 0]);  if (r < 0) r = 0;  if (r > 255) r = 255;
									double g = linearToSrgb(outHorzCol[y * 4 + 1]);  if (g < 0) g = 0;  if (g > 255) g = 255;
									double b = linearToSrgb(outHorzCol[y * 4 + 2]);  if (b < 0) b = 0;  if (b > 255) b = 255;
									double a = outHorzCol[y * 4 + 3];  if (a < 0) a = 0;  if (a > 255) a = 255;
									outPixels[y * outWidth + x] = (int)(a + 0.5) << 24 | (int)(r + 0.5) << 16 | (int)(g + 0.5) << 8 | (int)(b + 0.5);
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
			
			outputImage = new BufferedImage(outWidth, outHeight, BufferedImage.TYPE_INT_ARGB);
			outputImage.setRGB(0, 0, outWidth, outHeight, outPixels, 0, outWidth);
		}
		
		
		private static float srgbToLinear(int x) {
			double val = x / 255.0;
			if (val <= 0.04045)
				val /= 12.92;
			else
				val = Math.pow((val + 0.055) / 1.055, 2.4);
			return (float)val;
		}
		
		
		private static double linearToSrgb(double val) {
			if (val <= 0.0031308)
				val *= 12.92;
			else
				val = (Math.pow(val, 1 / 2.4) * 1.055 - 0.055);
			return val * 255;
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
