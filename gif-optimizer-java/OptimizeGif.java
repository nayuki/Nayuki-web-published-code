/* 
 * GIF image file optimizer
 * 
 * 
 * Reads an input GIF file, optimizes the LZW compression of
 * every block of pixel data, and writes a new output file.
 * 
 * Usage: java OptimizeGif [Options] Input.gif Output.gif
 * 
 * Options:
 *   blocksize=int
 *     For example: blocksize=512
 *     If this value is a positive integer, then every multiple of blocksize
 *       pixels (starting from the top left) will be a candidate boundary for
 *       clearing the LZW dictionary. Smaller values yield better optimization,
 *       but take more computation time and memory.
 *     If the value is at least as large as width * height, then the entire
 *       image will necessarily be encoded in one block without clearing the
 *       dictionary (unless dictclear is specified).
 *     If the value is 0, then uncompressed LZW encoding is used, which will
 *       produce rather large files.
 *   dictclear=int or "dcc"
 *     For example: dictclear=4096
 *     Valid range: [7, 4096]. Default is "dcc".
 *     If this value is "dcc", then deferred clear codes are used - in other
 *       words the dictionary will never be cleared because of reaching a certain
 *       size; it will only be cleared for optimizing the LZW compression; this
 *       allows the dictionary size to saturate at size 4096 for as long as needed.
 *       This is the preferred mode when the output GIF is displayed on modern,
 *       non-broken GIF decoders that support the deferred clear code behavior properly.
 *     Otherwise if the value is n, then a clear code is sent every time the dictionary
 *       size reaches n or greater. Setting this value hurts compression efficiency.
 *       The value 4096 should be sufficient to work around decoder bugs; otherwise
 *       try 4095 or 4094. There is no need to use lower values (which hurts
 *       compression further), but this encoder easily supports all possible values.
 * 
 * Notes:
 * - All GIF files are supported, including animated ones, ones
 *   with multiple data blocks, ones with over 256 colors, etc.
 * - This program only optimizes the LZW encoding. This does not
 *   change the block headers, palettes, or raw pixel data.
 *   Furthermore, no blocks are rearranged.
 * - Any data following the trailer is discarded.
 *   (Compliant GIF decoders will ignore this data anyway).
 * - The output file path must be different from the input file
 *   because the data is copied in a streaming manner.
 * - If an I/O exception or data format exception occurs during
 *   optimization, then the partial output file will be deleted.
 * 
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gif-optimizer-java
 */

import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.zip.DataFormatException;


public final class OptimizeGif {
	
	// Main program wrapper for conveniently handling error messages.
	public static void main(String[] args) throws IOException, DataFormatException {
		if (args.length == 0) {
			System.err.println("Usage: java OptimizeGif Input.gif Output.gif");
			System.exit(1);
		}
		String errmsg = submain(args);
		if (errmsg != null) {
			System.err.println("Error: " + errmsg);
			System.exit(1);
		}
	}
	
	
	// Runs the main program and returns null if successful or an error message string.
	private static String submain(String[] args) throws IOException, DataFormatException {
		if (args.length < 2)
			return "Not enough arguments";
		
		// Get file paths
		File inFile  = new File(args[args.length - 2]);
		File outFile = new File(args[args.length - 1]);
		if (!inFile.isFile())
			return "Input file does not exist: " + inFile.getPath();
		if (outFile.getCanonicalFile().equals(inFile.getCanonicalFile()))
			return "Output file is the same as input file";
		
		// Parse options
		int blockSize = -1;
		int dictClear = -2;
		for (int i = 0; i < args.length - 2; i++) {
			String opt = args[i];
			String[] parts = opt.split("=", 2);
			if (parts.length != 2)
				return "Invalid option: " + opt;
			String key = parts[0];
			String value = parts[1];
			
			switch (key) {
				case "blocksize":
					if (blockSize != -1)
						return "Duplicate block size option";
					blockSize = Integer.parseInt(value);
					if (blockSize < 0)
						return "Invalid block size value";
					break;
				case "dictclear":
					if (dictClear != -2)
						return "Duplicate dictionary clear option";
					if (value.equals("dcc"))
						dictClear = -1;
					else {
						dictClear = Integer.parseInt(opt.substring(10));
						if (dictClear < 0)
							return "Invalid dictionary clear value";
					}
					break;
				default:
					return "Invalid option: " + opt;
			}
		}
		
		// Set defaults
		if (blockSize == -1)
			blockSize = 1024;
		if (dictClear == -2)
			dictClear = -1;
		
		// Run optimizer
		optimizeGif(inFile, blockSize, dictClear, outFile);
		return null;
	}
	
	
	// Reads the given input file, optimizes just the LZW blocks according to the block size, and writes to the given output file.
	// The output file path *must* point to a different file than the input file, otherwise the data will be corrupted.
	private static void optimizeGif(File inFile, int blockSize, int dictClear, File outFile) throws IOException, DataFormatException {
		try (MemoizingInputStream in = new MemoizingInputStream(new FileInputStream(inFile))) {
			Throwable error = null;
			try (OutputStream out = new FileOutputStream(outFile)) {
				optimizeGif(in, blockSize, dictClear, out);
			} catch (DataFormatException|IOException e) {
				error = e;
			}
			if (error != null) {
				error.printStackTrace();
				outFile.delete();
			}
		}
	}
	
	
	private static void optimizeGif(MemoizingInputStream in, int blockSize, int dictClear, OutputStream out) throws IOException, DataFormatException {
		// Header
		int version;
		{
			char[] headCh = new char[6];
			for (int i = 0; i < headCh.length; i++)
				headCh[i] = (char)in.read();
			String headStr = new String(headCh);
			if (!headStr.startsWith("GIF"))
				throw new DataFormatException("Invalid GIF header");
			switch (headStr) {
				case "GIF87a":  version = 87;  break;
				case "GIF89a":  version = 89;  break;
				default:  throw new DataFormatException("Unrecognized GIF version");
			}
		}
		
		// Logical screen descriptor
		{
			byte[] screenDesc = new byte[7];
			in.readFully(screenDesc);
			if ((screenDesc[4] & 0x80) != 0) {
				int gctSize = (screenDesc[4] & 0x7) + 1;
				in.readFully(new byte[(1 << gctSize) * 3]);  // Skip global color table
			}
		}
		
		// Process top-level blocks
		while (true) {
			int b = in.read();
			if (b == -1)
				throw new EOFException();
			else if (b == 0x3B)  // Trailer
				break;
			else if (b == 0x21) {  // Extension introducer
				if (version == 87)
					throw new DataFormatException("Extension block not supported in GIF87a");
				b = in.read();  // Block label
				if (b == -1)
					throw new EOFException();
				try (SubblockInputStream bin = new SubblockInputStream(in)) {
					while (bin.read() != -1);  // Skip all data
					in = (MemoizingInputStream)bin.detach();
				}
				
			} else if (b == 0x2C) {
				// Image descriptor
				byte[] imageDesc = new byte[9];
				in.readFully(imageDesc);
				if ((imageDesc[8] & 0x80) != 0) {
					int lctSize = (imageDesc[8] & 0x7) + 1;
					in.readFully(new byte[(1 << lctSize) * 3]);  // Skip local color table
				}
				int codeSize = in.read();
				if (codeSize == -1)
					throw new EOFException();
				if (codeSize < 2 || codeSize > 8)
					throw new DataFormatException("Invalid number of code bits");
				out.write(in.getBuffer());
				in.clearBuffer();
				recompressData(in, blockSize, dictClear, codeSize, out);
				
			} else
				throw new DataFormatException("Unrecognized data block");
		}
		
		// Copy remainder of data that was read
		out.write(in.getBuffer());
	}
	
	
	// Read and decompress the LZW data fully, perform optimization and compression, and write out the new version.
	private static void recompressData(MemoizingInputStream in, int blockSize, int dictClear, int codeSize, OutputStream out) throws IOException {
		// Read and decompress
		byte[] pixels;
		try (SubblockInputStream blockIn = new SubblockInputStream(in)) {
			pixels = GifLzwDecompressor.decode(new BitInputStream(blockIn), codeSize);
			while (blockIn.read() != -1);  // Discard rest of subblock data after the LZW Stop code
			in = (MemoizingInputStream)blockIn.detach();
		}
		
		// Compress and hold
		ByteArrayOutputStream bufOut = new ByteArrayOutputStream();
		SubblockOutputStream blockOut = new SubblockOutputStream(bufOut);
		ByteBitOutputStream bitOut = new ByteBitOutputStream(blockOut);
		if (blockSize > 0)
			GifLzwCompressor.encodeOptimized(pixels, codeSize, blockSize, dictClear, bitOut, true);
		else if (blockSize == 0)
			GifLzwCompressor.encodeUncompressed(pixels, codeSize, bitOut);
		else
			throw new AssertionError();
		blockOut = (SubblockOutputStream)bitOut.detach();
		blockOut.detach();
		
		// Choose which version to write
		byte[] oldComp = in.getBuffer();
		byte[] newComp = bufOut.toByteArray();
		if (newComp.length < oldComp.length)
			out.write(newComp);
		else
			out.write(oldComp);
		in.clearBuffer();
	}
	
}
