/* 
 * Portable FloatMap reader/writer
 * 
 * Copyright (c) 2014 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/portable-floatmap-format-io-java
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

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInput;
import java.io.DataInputStream;
import java.io.DataOutput;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;


/**
 * Represents a {@code float}-based RGB/grayscale raster image, and provides methods for reading/writing Portable FloatMap (PFM) files.
 * <p>Based on the file format specification at: http://www.pauldebevec.com/Research/HDR/PFM/</p>
 */
public final class PortableFloatMap {
	
	/** The width of the image. Must be positive. */
	public int width;
	
	/** The height of the image. Must be positive. */
	public int height;
	
	/** The mode of the image, color/grayscale. Must not be {@code null}. */
	public Mode mode;
	
	/**
	 * The pixels in the image, in row-major order from bottom to top. Must not be {@code null}. Grayscale images use 1 number per pixel.
	 * Color images use 3 numbers per pixel, in RGB order. (These details correspond with the low-level file format.)
	 * <p>For grayscale, the array length must equal (<var>width</var> &times; <var>height</var>);
	 * for color it must equal (<var>width</var> &times; <var>height</var> &times; 3).
	 * The width, height, and mode must not make the pixel array length exceed {@code Integer.MAX_VALUE}.</p>
	 */
	public float[] pixels;
	
	/** Indicates whether the image read was in big endian, or indicates whether to write the image in big endian. Big endian is preferred for Java, while little endian is preferred for C/C++. */
	public boolean bigEndian;
	
	
	
	/**
	 * Constructs a blank Portable FloatMap image.
	 */
	public PortableFloatMap() {
		bigEndian = true;  // Arbitrary default
	}
	
	
	/**
	 * Constructs a PFM image by reading from the specified file. All 5 fields are set to values from the file.
	 * @param file the file to read from
	 * @throws NullPointerException if the file is {@code null}
	 * @throws IllegalArgumentException if the file data does not represent a valid PFM file
	 * @throws IOException if an I/O exception occurred
	 */
	public PortableFloatMap(File file) throws IOException {
		if (file == null)
			throw new NullPointerException();
		InputStream in = new BufferedInputStream(new FileInputStream(file));
		try {
			read(in);
		} finally {
			in.close();
		}
	}
	
	
	/**
	 * Constructs a PFM image by reading from the specified input stream. All 5 fields are set to values from the stream.
	 * <p>The stream is not closed by this method. If successful, only the exact number of bytes for the image are read -
	 * no extra bytes are read past the end of the image, so it is possible to continue reading from the stream for other purposes.
	 * Otherwise if the file format is detected to be invalid or an I/O exception occurs, then an undetermined number of bytes will have been read.</p>
	 * @param in the input stream to read from
	 * @throws NullPointerException if the stream is {@code null}
	 * @throws IllegalArgumentException if the stream data does not represent a valid PFM file
	 * @throws IOException if an I/O exception occurred
	 */
	public PortableFloatMap(InputStream in) throws IOException {
		if (in == null)
			throw new NullPointerException();
		read(in);
	}
	
	
	
	private void read(InputStream in) throws IOException {
		// Parse file magic header line
		String format = readLine(in);
		if (format.equals("PF"))
			mode = Mode.COLOR;
		else if (format.equals("Pf"))
			mode = Mode.GRAYSCALE;
		else
			throw new IllegalArgumentException("Unrecognized format: " + format);
		
		// Parse width and height line
		String[] tokens = readLine(in).split(" ", 2);
		width = Integer.parseInt(tokens[0]);
		if (width <= 0)
			throw new IllegalArgumentException("Width must be positive");
		height = Integer.parseInt(tokens[1]);
		if (height <= 0)
			throw new IllegalArgumentException("Height must be positive");
		
		// Parse endianness line
		double temp = Double.parseDouble(readLine(in));
		if (temp == 1.0)
			bigEndian = true;
		else if (temp == -1)
			bigEndian = false;
		else
			throw new IllegalArgumentException("Unrecognized format: " + format);
		
		// Read float32 image pixel data
		DataInput din = new DataInputStream(in);
		pixels = new float[calcPixelArrayLength()];
		if (bigEndian) {
			for (int i = 0; i < pixels.length; i++)
				pixels[i] = din.readFloat();
		} else {
			for (int i = 0; i < pixels.length; i++)
				pixels[i] = Float.intBitsToFloat(Integer.reverseBytes(din.readInt()));
		}
	}
	
	
	/**
	 * Writes this PFM image to the specified file.
	 * @param file the file to write to
	 * @throws NullPointerException if the file or mode or pixel array is {@code null}
	 * @throws IllegalStateException if the width or height is zero/negative, or the pixel array is not exactly the expected length
	 * @throws IllegalArgumentException if the width, height, and mode imply a pixel array length that exceeds {@code Integer.MAX_VALUE}
	 * @throws IOException if an I/O exception occurred
	 */
	public void write(File file) throws IOException {
		if (file == null)
			throw new NullPointerException();
		checkData();  // Check before opening file
		
		OutputStream out = new BufferedOutputStream(new FileOutputStream(file));
		try {
			write(out);
		} finally {
			out.close();
		}
	}
	
	
	/**
	 * Writes this PFM image to the specified output stream.
	 * @param out the output stream to write to
	 * @throws NullPointerException if the stream or mode or pixel array is {@code null}
	 * @throws IllegalStateException if the width or height is zero/negative, or the pixel array is not exactly the expected length
	 * @throws IllegalArgumentException if the width, height, and mode imply a pixel array length that exceeds {@code Integer.MAX_VALUE}
	 * @throws IOException if an I/O exception occurred
	 */
	public void write(OutputStream out) throws IOException {
		if (out == null)
			throw new NullPointerException();
		checkData();
		
		// Write header text data. Must use Unix newlines, not universal style
		PrintWriter pout = new PrintWriter(new OutputStreamWriter(out, "US-ASCII"));
		switch (mode) {
			case COLOR:
				pout.print("PF\n");
				break;
			case GRAYSCALE:
				pout.print("Pf\n");
				break;
			default:
				throw new AssertionError();
		}
		pout.print(width + " " + height + "\n");
		pout.print((bigEndian ? "1.0" : "-1.0") + "\n");
		pout.flush();
		
		// Write float32 image pixel data
		DataOutput dout = new DataOutputStream(out);
		if (bigEndian) {
			for (float x : pixels)
				dout.writeFloat(x);
		} else {
			for (float x : pixels)
				dout.writeInt(Integer.reverseBytes(Float.floatToIntBits(x)));
		}
	}
	
	
	private void checkData() {
		if (width <= 0)
			throw new IllegalStateException("Width must be positive");
		if (height <= 0)
			throw new IllegalStateException("Height must be positive");
		if (mode == null)
			throw new NullPointerException("Mode not set");
		if (pixels == null)
			throw new NullPointerException("Pixel array not set");
		if (pixels.length != calcPixelArrayLength())
			throw new IllegalStateException("Pixel array length does not match width and height");
	}
	
	
	private int calcPixelArrayLength() {
		int channels;
		switch (mode) {
			case COLOR:
				channels = 3;
				break;
			case GRAYSCALE:
				channels = 1;
				break;
			default:
				throw new AssertionError();
		}
		
		int result = width * height * channels;
		if (result / width / height / channels != 1)  // Check arithmetic overflow
			throw new IllegalArgumentException("Dimensions are too large to make a pixel array");  // Due to Java's maximum array length of Integer.MAX_VALUE
		return result;
	}
	
	
	private static String readLine(InputStream in) throws IOException {
		ByteArrayOutputStream bout = new ByteArrayOutputStream();
		for (int i = 0; ; i++) {
			int b = in.read();
			if (b == '\n' || b == -1)
				break;
			else if (i == 100)
				throw new IllegalArgumentException("Line too long");
			else
				bout.write(b);
		}
		return new String(bout.toByteArray(), "US-ASCII");
	}
	
	
	
	public enum Mode {
		
		COLOR, GRAYSCALE
		
	}
	
}
