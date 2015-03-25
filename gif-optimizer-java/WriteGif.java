/* 
 * GIF writer
 * 
 * 
 * Converts an image to a GIF file and optimizes the LZW compression.
 * 
 * Usage: java WriteGif [Options] Input.bmp/png/gif Output.gif
 * 
 * The main innovation of this program is that the LZW encoding of the pixel
 * data is optimized using dynamic programming, such that the LZW dictionary
 * is cleared at advantageous points in the data stream.
 * 
 * Caveats:
 * - The input image must have 256 or fewer unique colors.
 * - The width and height must be less than 65536.
 * - PNGs with any partially transparent pixels are rejected.
 *   (Only fully opaque or transparent pixels are allowed.)
 * - PNGs where transparent pixels have different base colors will have all
 *   such pixels collapsed to an arbitrary single color.
 * - GIFs are actually fully decoded to RGB24 pixels and encoded from scratch,
 *   so animations, comments, and other fancy features are discarded.
 * 
 * Options:
 *   transparent=RGBHex
 *     For example: transparent=FF00FF (magenta)
 *     If this option is used:
 *       This designates the given color as the transparent color in the output
 *       GIF. If the input is PNG or GIF, the entire image is treated as opaque
 *       before this option is processed. If the given color is not present in
 *       the image, then the entire output image is opaque.
 *     Otherwise if unused:
 *       If the input image is BMP, the output is fully opaque.
 *       If the input is PNG or GIF, the existing transparency (if any) will
 *       be mapped into the output GIF, and the transparent color is arbitrary.
 *   blocksize=int
 *     For example: blocksize=512
 *     If this value is a positive integer, then every multiple of blocksize
 *       pixels (starting from the top left) will be a candidate boundary for
 *       clearing the LZW dictionary. Smaller values yield better optimization,
 *       but take more computation time and memory.
 *     If the value is at least as large as width * height, then the entire
 *       image will necessarily be encoded in one block without clearing the
 *       dictionary.
 *     If the value is 0, then uncompressed LZW encoding is used, which will
 *       produce rather large files.
 * 
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/gif-optimizer-java
 */

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Arrays;
import javax.imageio.ImageIO;


public final class WriteGif {
	
	// Main program wrapper for conveniently handling error messages.
	public static void main(String[] args) throws IOException {
		if (args.length == 0) {
			System.err.println("Usage: java WriteGif [Options] Input.bmp/png/gif Output.gif");
			System.exit(1);
		}
		String errmsg = submain(args);
		if (errmsg != null) {
			System.err.println("Error: " + errmsg);
			System.exit(1);
		}
	}
	
	
	// Runs the main program and returns null if successful or an error message string.
	private static String submain(String[] args) throws IOException {	
		if (args.length < 2)
			return "Not enough arguments";
		
		// Get file paths
		File inFile  = new File(args[args.length - 2]);
		File outFile = new File(args[args.length - 1]);
		if (!inFile.isFile())
			return "Input file does not exist: " + inFile.getPath();
		
		// Parse options
		int transpColor = -1;  // -1 if unspecified, otherwise a number in the range [0x000000, 0xFFFFFF]
		int blockSize = -1;
		for (int i = 0; i < args.length - 2; i++) {
			String opt = args[i];
			if (opt.startsWith("transparent=")) {
				if (transpColor != -1)
					return "Duplicate transparent color option";
				if (!opt.matches("transparent=[0-9a-fA-F]{6}"))
					return "Invalid transparent color option format";
				transpColor = Integer.parseInt(opt.substring(opt.length() - 6), 16);
			} else if (opt.startsWith("blocksize=")) {
				if (blockSize != -1)
					return "Duplicate block size option";
				if (!opt.matches("blocksize=[0-9]+"))
					return "Invalid block size option format";
				blockSize = Integer.parseInt(opt.substring(10));
			} else
				return "Invalid option: " + opt;
		}
		if (blockSize == -1)
			blockSize = 1024;
		
		// Read input image
		BufferedImage inImage = ImageIO.read(inFile);
		int width  = inImage.getWidth();
		int height = inImage.getHeight();
		if (width <= 0 || height <= 0)
			throw new AssertionError();
		if (width > 0xFFFF)
			return "Width=" + width + " exceeds 65535";
		if (height > 0xFFFF)
			return "Height=" + height + " exceeds 65535";
		if ((long)width * height > Integer.MAX_VALUE)
			return "Image dimensions are too large for this program to handle";
		
		// Get RGB32 pixel data
		int[] inPixels = new int[width * height];
		inImage.getRGB(0, 0, width, height, inPixels, 0, width);
		
		// Detect if image contains any transparent pixels
		if (transpColor == -1) {
			for (int i = 0; i < inPixels.length; i++) {
				int alpha = inPixels[i] >>> 24;
				if (alpha == 0) {  // Transparent
					if (transpColor == -1)
						transpColor = inPixels[i] & 0xFFFFFF;  // Preliminary candidate
				} else if (alpha < 0xFF)
					return "Image contains semi-transparent pixels";
			}
			
			if (transpColor != -1) {  // Transparent pixels found
				// Find an unused color to use as new transparent color
				boolean[] opaqueUsed = new boolean[256];
				for (int i = 0; i < inPixels.length; i++) {
					int pix = inPixels[i];
					if (pix >>> 24 == 0xFF) {  // Opaque
						int j = (inPixels[i] - transpColor) & 0xFFFFFF;
						if (j < opaqueUsed.length)
							opaqueUsed[j] = true;
					}
				}
				for (int i = 0; ; i++) {
					if (i == opaqueUsed.length)
						throw new IllegalArgumentException("Number of unique colors in image exceeds 256");
					else if (!opaqueUsed[i]) {
						transpColor = (transpColor + i) & 0xFFFFFF;
						break;
					}
				}
				
				// Remap transparent pixels to new color
				for (int i = 0; i < inPixels.length; i++) {
					if (inPixels[i] >>> 24 == 0)
						inPixels[i] = transpColor;
				}
			}
		}
		
		// Remove alpha channel to obtain RGB24
		for (int i = 0; i < inPixels.length; i++)
			inPixels[i] &= 0xFFFFFF;
		
		// Gather palette and losslessly quantize the image down to 8 bits per pixel
		int[] palette;
		try {
			palette = listUniqueColors(inPixels, 256);
		} catch (IllegalArgumentException e) {
			return e.getMessage();
		}
		int transpIndex = Math.max(Arrays.binarySearch(palette, transpColor), -1);  // Clamp the value to -1 if not found
		byte[] palettedImage = convertToPaletted(inPixels, palette);
		
		// Encode and write output GIF file
		writeGif(palettedImage, width, height, palette, transpIndex, blockSize, outFile);
		return null;
	}
	
	
	// Returns a sorted list of unique colors in the image, of length [0, maxColors].
	// Throws an exception if there are more than maxColors.
	private static int[] listUniqueColors(int[] pixels, int maxColors) {
		int[] palette = new int[maxColors];  // The active part from [0, numColors) is always sorted ascending
		int numColors = 0;
		for (int i = 0; i < pixels.length; i++) {
			int index = Arrays.binarySearch(palette, 0, numColors, pixels[i]);
			if (index < 0) {  // Current pixel color not in palette
				if (numColors >= maxColors)
					throw new IllegalArgumentException("Number of unique colors in image exceeds " + maxColors);
				index = ~index;  // See binarySearch() API
				
				// Insert in sorted order
				System.arraycopy(palette, index, palette, index + 1, numColors - index);
				palette[index] = pixels[i];
				numColors++;
			}
		}
		return Arrays.copyOf(palette, numColors);  // Trim unused space
	}
	
	
	// Converts an RGB24 image to RGB8 paletted.
	private static byte[] convertToPaletted(int[] image, int[] palette) {
		if (palette.length > 256)
			throw new IllegalArgumentException("Palette size exceeds 8 bits");
		byte[] result = new byte[image.length];
		for (int i = 0; i < image.length; i++) {
			int index = Arrays.binarySearch(palette, image[i]);
			if (index < 0)
				throw new IllegalArgumentException(String.format("Color not in palette: %06X", image[i]));
			result[i] = (byte)index;
		}
		return result;
	}
	
	
	// Writes the given 8-bit paletted image to the given path as a GIF file.
	// transparentIndex must be -1 if disabled or an index in [0, palette.length).
	// blockSize must be a positive integer to specify optimizing LZW compression
	// or 0 to specify uncompressed LZW encoding. 
	private static void writeGif(byte[] pixels, int width, int height, int[] palette, int transparentIndex, int blockSize, File file) throws IOException {
		// Check arguments
		if (width  <= 0 || width  > 65535)
			throw new IllegalArgumentException("Width out of range");
		if (height <= 0 || height > 65535)
			throw new IllegalArgumentException("Height out of range");
		if (pixels.length != width * height)
			throw new IllegalArgumentException("Invalid pixel array length");
		if (palette.length == 0 || palette.length > 256)
			throw new IllegalArgumentException("Invalid palette");
		if (transparentIndex < -1 || transparentIndex >= palette.length)
			throw new IllegalArgumentException("Invalid transparent color index");
		if (blockSize < 0)
			throw new IllegalArgumentException("Invalid block size");
		
		// paletteBits = ceil(log2(palette.length))
		int paletteBits = 1;
		while ((1 << paletteBits) < palette.length)
			paletteBits++;
		assert 1 <= paletteBits && paletteBits <= 8;
		
		// Start writing GIF file
		OutputStream out = new FileOutputStream(file);
		try {
			// Header
			out.write((transparentIndex == -1 ? "GIF87a" : "GIF89a").getBytes("US-ASCII"));
			
			// Logical screen descriptor
			out.write(width  >>> 0);
			out.write(width  >>> 8);
			out.write(height >>> 0);
			out.write(height >>> 8);
			out.write(0x80 | 0x70 | (paletteBits - 1));
			out.write(0);
			out.write(0);
			
			// Global color table
			for (int i = 0; i < (1 << paletteBits); i++) {
				int color = i < palette.length ? palette[i] : 0;  // Padding
				out.write(color >>> 16);
				out.write(color >>>  8);
				out.write(color >>>  0);
			}
			
			// Graphic control extension (if transparent color is used)
			if (transparentIndex != -1) {
				out.write(0x21);
				out.write(0xF9);
				out.write(4);
				out.write(0x05);
				out.write(0);
				out.write(0);
				out.write(transparentIndex);
				out.write(0);
			}
			
			// Image descriptor
			out.write(0x2C);
			out.write(0);
			out.write(0);
			out.write(0);
			out.write(0);
			out.write(width  >>> 0);
			out.write(width  >>> 8);
			out.write(height >>> 0);
			out.write(height >>> 8);
			out.write(0);
			
			// Image data
			int codeBits = Math.max(paletteBits, 2);
			out.write(codeBits);
			SubblockOutputStream blockOut = new SubblockOutputStream(out);
			ByteBitOutputStream bitOut = new ByteBitOutputStream(blockOut);
			if (blockSize > 0)
				GifLzwCompressor.encodeOptimized(pixels, 0, pixels.length, codeBits, blockSize, bitOut, true);
			else if (blockSize == 0)
				GifLzwCompressor.encodeUncompressed(pixels, 0, pixels.length, codeBits, bitOut);
			else
				throw new AssertionError();
			bitOut.detach();
			blockOut.detach();
			
			// Trailer
			out.write(0x3B);
		} catch (IOException e) {
			e.printStackTrace();
			out.close();
			file.delete();
		} finally {
			out.close();
		}
	}
	
}
