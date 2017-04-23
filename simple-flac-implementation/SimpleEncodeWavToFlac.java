/* 
 * Simple FLAC encoder (Java)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/simple-flac-implementation
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

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.zip.DataFormatException;


public final class SimpleEncodeWavToFlac {
	
	public static void main(String[] args) throws IOException, DataFormatException {
		if (args.length != 2) {
			System.err.println("Usage: java SimpleEncodeWavToFlac InFile.wav OutFile.flac");
			System.exit(1);
			return;
		}
		try (InputStream in = new BufferedInputStream(new FileInputStream(args[0]))) {
			try (BitOutputStream out = new BitOutputStream(new BufferedOutputStream(new FileOutputStream(args[1])))) {
				encodeFile(in, out);
			}
		}
	}
	
	
	public static void encodeFile(InputStream in, BitOutputStream out) throws IOException, DataFormatException {
		// Read and parse WAV file headers
		if (!readString(in, 4).equals("RIFF"))
			throw new DataFormatException("Invalid RIFF file header");
		readLittleInt(in, 4);
		if (!readString(in, 4).equals("WAVE"))
			throw new DataFormatException("Invalid WAV file header");
		
		if (!readString(in, 4).equals("fmt "))
			throw new DataFormatException("Unrecognized WAV file chunk");
		if (readLittleInt(in, 4) != 16)
			throw new DataFormatException("Unsupported WAV file type");
		if (readLittleInt(in, 2) != 0x0001)
			throw new DataFormatException("Unsupported WAV file codec");
		int numChannels = readLittleInt(in, 2);
		if (numChannels < 0 || numChannels > 8)
			throw new RuntimeException("Too many (or few) audio channels");
		int sampleRate = readLittleInt(in, 4);
		if (sampleRate <= 0 || sampleRate >= (1 << 20))
			throw new RuntimeException("Sample rate too large or invalid");
		readLittleInt(in, 4);
		readLittleInt(in, 2);
		int sampleDepth = readLittleInt(in, 2);
		if (sampleDepth == 0 || sampleDepth > 32 || sampleDepth % 8 != 0)
			throw new RuntimeException("Unsupported sample depth");
		
		if (!readString(in, 4).equals("data"))
			throw new DataFormatException("Unrecognized WAV file chunk");
		int sampleDataLen = readLittleInt(in, 4);
		if (sampleDataLen <= 0 || sampleDataLen % (numChannels * (sampleDepth / 8)) != 0)
			throw new DataFormatException("Invalid length of audio sample data");
		
		// Start writing FLAC file header and stream info metadata block
		out.writeInt(32, 0x664C6143);
		out.writeInt(1, 1);
		out.writeInt(7, 0);
		out.writeInt(24, 34);
		out.writeInt(16, BLOCK_SIZE - 1);
		out.writeInt(16, BLOCK_SIZE - 1);
		out.writeInt(24, 0);
		out.writeInt(24, 0);
		out.writeInt(20, sampleRate);
		out.writeInt(3, numChannels - 1);
		out.writeInt(5, sampleDepth - 1);
		int numSamples = sampleDataLen / (numChannels * (sampleDepth / 8));
		out.writeInt(18, numSamples >>> 18);
		out.writeInt(18, numSamples >>>  0);
		for (int i = 0; i < 16; i++)
			out.writeInt(8, 0);
		
		// Read raw samples and encode FLAC audio frames
		for (int i = 0; numSamples > 0; i++) {
			int blockSize = Math.min(numSamples, BLOCK_SIZE);
			encodeFrame(in, i, numChannels, sampleDepth, sampleRate, blockSize, out);
			numSamples -= blockSize;
		}
	}
	
	
	private static final int BLOCK_SIZE = 4096;
	
	
	private static String readString(InputStream in, int len) throws IOException {
		byte[] temp = new byte[len];
		for (int i = 0; i < temp.length; i++) {
			int b = in.read();
			if (b == -1)
				throw new EOFException();
			temp[i] = (byte)b;
		}
		return new String(temp, StandardCharsets.UTF_8);
	}
	
	
	private static int readLittleInt(InputStream in, int n) throws IOException {
		int result = 0;
		for (int i = 0; i < n; i++) {
			int b = in.read();
			if (b == -1)
				throw new EOFException();
			result |= b << (i * 8);
		}
		return result;
	}
	
	
	private static void encodeFrame(InputStream in, int frameIndex, int numChannels, int sampleDepth, int sampleRate, int blockSize, BitOutputStream out) throws IOException {
		int[][] samples = new int[numChannels][blockSize];
		int bytesPerSample = sampleDepth / 8;
		for (int i = 0; i < blockSize; i++) {
			for (int ch = 0; ch < numChannels; ch++) {
				int val = 0;
				for (int j = 0; j < bytesPerSample; j++) {
					int b = in.read();
					if (b == -1)
						throw new EOFException();
					val |= b << (j * 8);
				}
				if (sampleDepth == 8)
					samples[ch][i] = val - 128;
				else
					samples[ch][i] = (val << (32 - sampleDepth)) >> (32 - sampleDepth);
			}
		}
		
		out.resetCrcs();
		out.writeInt(14, 0x3FFE);
		out.writeInt(1, 0);
		out.writeInt(1, 0);
		out.writeInt(4, 7);
		out.writeInt(4, sampleRate % 10 == 0 ? 14 : 13);
		out.writeInt(4, numChannels - 1);
		switch (sampleDepth) {
			case  8:  out.writeInt(3, 1);  break;
			case 16:  out.writeInt(3, 4);  break;
			case 24:  out.writeInt(3, 6);  break;
			case 32:  out.writeInt(3, 0);  break;
			default:  throw new IllegalArgumentException();
		}
		out.writeInt(1, 0);
		out.writeInt(8, 0xFC | (frameIndex >>> 30));
		for (int i = 24; i >= 0; i -= 6)
			out.writeInt(8, 0x80 | ((frameIndex >>> i) & 0x3F));
		out.writeInt(16, blockSize - 1);
		out.writeInt(16, sampleRate / (sampleRate % 10 == 0 ? 10 : 1));
		out.writeInt(8, out.crc8);
		
		for (int[] chanSamples : samples)
			encodeSubframe(chanSamples, sampleDepth, out);
		out.alignToByte();
		out.writeInt(16, out.crc16);
	}
	
	
	private static void encodeSubframe(int[] samples, int sampleDepth, BitOutputStream out) throws IOException {
		out.writeInt(1, 0);
		out.writeInt(6, 1);  // Verbatim coding
		out.writeInt(1, 0);
		for (int x : samples)
			out.writeInt(sampleDepth, x);
	}
	
}



final class BitOutputStream implements AutoCloseable {
	
	private OutputStream out;
	private long bitBuffer;
	private int bitBufferLen;
	public int crc8;
	public int crc16;
	
	
	public BitOutputStream(OutputStream out) {
		this.out = out;
		bitBuffer = 0;
		bitBufferLen = 0;
		resetCrcs();
	}
	
	
	public void resetCrcs() {
		crc8 = 0;
		crc16 = 0;
	}
	
	
	public void alignToByte() throws IOException {
		writeInt((64 - bitBufferLen) % 8, 0);
	}
	
	
	public void writeInt(int n, int val) throws IOException {
		bitBuffer = (bitBuffer << n) | (val & ((1L << n) - 1));
		bitBufferLen += n;
		while (bitBufferLen >= 8) {
			bitBufferLen -= 8;
			int b = (int)(bitBuffer >>> bitBufferLen) & 0xFF;
			out.write(b);
			crc8 ^= b;
			crc16 ^= b << 8;
			for (int i = 0; i < 8; i++) {
				crc8 = (crc8 << 1) ^ ((crc8 >>> 7) * 0x107);
				crc16 = (crc16 << 1) ^ ((crc16 >>> 15) * 0x18005);
			}
		}
	}
	
	
	public void close() throws IOException {
		out.close();
	}
	
}
