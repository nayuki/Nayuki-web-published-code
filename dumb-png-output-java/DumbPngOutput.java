/* 
 * Dumb PNG Output
 * Copyright (c) 2012 Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dumb-png-output-java
 */

import java.io.*;
import java.util.zip.*;


public final class DumbPngOutput {
	
	/**
	 * Demo program, which creates the image DumbPngOutDemo.png in the current directory.
	 * The image is 3 x 2 pixels and looks like this:
	 * [ Red  , Green, Blue  ]
	 * [ Black, Gray , White ]
	 */
	public static void main(String[] args) throws IOException {
		OutputStream out = new FileOutputStream("DumbPngOutDemo.png");
		int[][] image = {
			{0xFF0000, 0x00FF00, 0x0000FF},
			{0x000000, 0x808080, 0xFFFFFF},
		};
		write(image, out);
		out.close();
	}
	
	
	/**
	 * Writes the specified RGB24 image to the specified output stream as a PNG file.
	 * <p>The array has this format: {@code image[y][x] = 0xRRGGBB} (where each color channel uses 8 bits). The array must be rectangular and each dimension must be at least 1.</p>
	 * <p>This implementation runs out of memory if the number of pixels in the image exceeds about 700 million (but this is not a PNG limitation).</p>
	 * @param image the image, represented as an array of rows of pixel values
	 * @param out the output stream to write the PNG file to
	 * @throws IOException if an I/O exception occurred
	 */
	public static void write(int[][] image, OutputStream out) throws IOException {
		// PNG header (a pretty clever magic string)
		out.write(new byte[]{(byte)0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'});
		
		// IHDR chunk (image dimensions, color depth, compression method, etc.)
		int width = image[0].length;
		int height = image.length;
		byte[] ihdr = new byte[13];
		ihdr[ 0] = (byte)(width >>> 24);  // Big-endian
		ihdr[ 1] = (byte)(width >>> 16);
		ihdr[ 2] = (byte)(width >>>  8);
		ihdr[ 3] = (byte)(width >>>  0);
		ihdr[ 4] = (byte)(height >>> 24);  // Big-endian
		ihdr[ 5] = (byte)(height >>> 16);
		ihdr[ 6] = (byte)(height >>>  8);
		ihdr[ 7] = (byte)(height >>>  0);
		ihdr[ 8] = 8;  // Bit depth: 8 bits per sample
		ihdr[ 9] = 2;  // Color type: True color RGB
		ihdr[10] = 0;  // Compression method: DEFLATE
		ihdr[11] = 0;  // Filter method: Adaptive
		ihdr[12] = 0;  // Interlace method: None
		writeChunk("IHDR", ihdr, out);
		
		// IDAT chunk (pixel values and row filters)
		// Note: One additional byte at the beginning of each row specifies the filtering method
		long temp = ((long)width * 3 + 1) * height;
		if (temp > Integer.MAX_VALUE)
			throw new ArithmeticException("Overflow");
		byte[] idat = new byte[(int)temp];
		int rowSize = width * 3 + 1;
		for (int y = 0; y < height; y++) {
			idat[y * rowSize + 0] = 0;  // Filter type: None
			for (int x = 0; x < width; x++) {
				int color = image[y][x];
				int index = y * rowSize + 1 + x * 3;
				idat[index + 0] = (byte)(color >>> 16);  // Red
				idat[index + 1] = (byte)(color >>>  8);  // Green
				idat[index + 2] = (byte)(color >>>  0);  // Blue
			}
		}
		idat = deflate(idat);
		writeChunk("IDAT", idat, out);
		
		// IEND chunk (no payload)
		writeChunk("IEND", new byte[0], out);
	}
	
	
	// Returns the result of compressing the given byte string using DEFLATE and wrapping it in a zlib container. 
	// In this implementation, no compression is performed; only DEFLATE verbatim blocks are used.
	private static byte[] deflate(byte[] data) throws IOException {
		ByteArrayOutputStream b = new ByteArrayOutputStream();
		
		// zlib header
		b.write(0x08);  // Compression method: DEFLATE; window size: 256 bytes
		b.write(0x1D);  // Flag checksum, no preset dictionary, fastest compression level
		
		// DEFLATE data
		int offset = 0;
		do {
			int curBlockSize = Math.min(data.length - offset, 0xFFFF);
			int blockType = 0;  // BTYPE: No compression (verbatim)
			if (offset + curBlockSize == data.length)
				blockType |= 1;  // BFINAL
			b.write(blockType);
			b.write(curBlockSize >>> 0);  // Little-endian
			b.write(curBlockSize >>> 8);
			b.write((~curBlockSize) >>> 0);  // One's complement, little-endian
			b.write((~curBlockSize) >>> 8);
			b.write(data, offset, curBlockSize);
			offset += curBlockSize;
		} while (offset < data.length);
		
		// Final Adler-32 checksum
		Adler32 c = new Adler32();
		c.update(data);
		writeInt32((int)c.getValue(), b);
		
		return b.toByteArray();
	}
	
	
	// Writes the given chunk (with type name and payload data) to the given output stream.
	// This takes care of also writing the length and CRC.
	private static void writeChunk(String type, byte[] data, OutputStream out) throws IOException {
		CRC32 c = new CRC32();
		c.update(type.getBytes("US-ASCII"));
		c.update(data);
		
		writeInt32(data.length, out);          // Length
		out.write(type.getBytes("US-ASCII"));  // Type
		out.write(data);                       // Data
		writeInt32((int)c.getValue(), out);    // CRC-32
	}
	
	
	// Writes the given 32-bit integer to the given output stream as bytes in big-endian.
	private static void writeInt32(int x, OutputStream out) throws IOException {
		out.write(x >>> 24);
		out.write(x >>> 16);
		out.write(x >>>  8);
		out.write(x >>>  0);
	}
	
}
