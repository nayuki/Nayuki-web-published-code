/* 
 * Library classes for GIF optimizer (Java)
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gif-optimizer-java
 */

import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;


/* 
 * Converts an input stream that yields bytes into a stream that yields bits.
 * - Bits are packed into bytes in little endian. For example,
 *   the byte 0xC1 represents the sequence of bits [1,0,0,0,0,0,1,1].
 * - When reading the next group of bits as an unsigned integer, the bits are packed in little endian.
 *   For example, reading 5 bits from the bit sequence [1,1,0,0,1,...] yields the number 0b10011 or 19.
 */
final class BitInputStream {
	
	/*---- Fields ----*/
	
	private InputStream input;  // Underlying stream
	private int bitBuffer;      // Only the bottommost bitBufferLen bits are valid
	private int bitBufferLen;   // Always in the range [0,8) when not executing readBits()
	
	
	
	/*---- Constructors ----*/
	
	public BitInputStream(InputStream in) {
		input = Objects.requireNonNull(in);
		bitBuffer = 0;
		bitBufferLen = 0;
	}
	
	
	
	/*---- Methods ----*/
	
	// Consumes 'width' bits from the stream and returns them as an unsigned integer.
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
