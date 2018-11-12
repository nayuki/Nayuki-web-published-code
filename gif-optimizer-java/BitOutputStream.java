/* 
 * Library classes for GIF optimizer (Java)
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gif-optimizer-java
 */

import java.io.IOException;
import java.io.OutputStream;
import java.util.Objects;


/* 
 * A sink that accepts a stream of groups of bits.
 */
interface BitOutputStream {
	
	public void writeBits(int value, int width) throws IOException;
	
}



/* 
 * Converts an output stream that accepts bytes into a stream that accept bits.
 * - Bits are packed into bytes in little endian. For example,
 *   the byte 0x5F represents the sequence of bits [1,1,1,1,1,0,1,0].
 * - When writing the next unsigned integer as a group of bits, the bits are packed in little endian.
 *   For example, writing the 3-bit unsigned integer 0b001 produces the bit sequence [1,0,0].
 * - Must call detach() when done writing, otherwise the data is not properly terminated.
 */
final class ByteBitOutputStream implements BitOutputStream {
	
	/*-- Fields --*/
	
	private OutputStream output;  // Underlying stream
	private int bitBuffer;        // Only the bottommost bitBufferLen bits are valid
	private int bitBufferLen;     // Always in the range [0,8) when not executing writeBits()
	
	
	/*-- Constructors --*/
	
	public ByteBitOutputStream(OutputStream out) {
		output = Objects.requireNonNull(out);
		bitBuffer = 0;
		bitBufferLen = 0;
	}
	
	
	/*-- Methods --*/
	
	// Writes the given unsigned integer of the given bit width to this stream.
	public void writeBits(int value, int width) throws IOException {
		if (width < 0 || width > 24 || value >>> width != 0)
			throw new IllegalArgumentException();
		bitBuffer |= value << bitBufferLen;
		bitBufferLen += width;
		while (bitBufferLen >= 8) {
			output.write(bitBuffer);
			bitBuffer >>>= 8;
			bitBufferLen -= 8;
		}
	}
	
	
	// Writes the currently accumulated bits, if any (the last byte may be partial).
	public void detach() throws IOException {
		if (output == null)
			throw new IllegalStateException();
		if (bitBufferLen > 0)
			output.write(bitBuffer);
		output = null;
	}
	
}



/* 
 * Counts the number of bits written, but discards the actual data.
 */
final class CountingBitOutputStream implements BitOutputStream {
	
	public long length = 0;  // Total number of bits written
	
	
	public void writeBits(int value, int width) {
		length += width;
	}
	
}
