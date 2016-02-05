/* 
 * Library classes for GIF optimizer (Java)
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gif-optimizer-java
 */

import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;


/* 
 * An adapter for reading a sequence of variable numbers of bits from an
 * underlying byte-based input stream. Bits are packed in little endian,
 * and multi-bit integers are serialized in little endian.
 * 
 * For example, the sequence [symbol(value=1 width=1), symbol(value=48 width=6), symbol(value=304 width=9)]
 * is serialized as the bytes [0x61, 0x98].
 */
final class BitInputStream {
	
	private InputStream input;  // Underlying stream
	private int bitBuffer;
	private int bitBufferLen;  // Always in the range [0,8) after each read operation
	
	
	
	public BitInputStream(InputStream in) {
		if (in == null)
			throw new NullPointerException();
		input = in;
		bitBuffer = 0;
		bitBufferLen = 0;
	}
	
	
	
	// Returns the next value, which is in the range [0, 2^width).
	public int readBits(int width) throws IOException {
		if (width > 24)
			throw new IllegalArgumentException();
		
		// Fill buffer with just enough bytes
		while (bitBufferLen < width) {
			int b = input.read();
			if (b == -1)
				throw new EOFException();
			bitBuffer |= b << bitBufferLen;
			bitBufferLen += 8;
		}
		
		// Extract bits
		int result = bitBuffer & ((1 << width) - 1);
		bitBuffer >>>= width;
		bitBufferLen -= width;
		return result;
	}
	
}
