/* 
 * Library classes for GIF optimizer (Java)
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/gif-optimizer-java
 */

import java.io.IOException;
import java.io.OutputStream;


// A sink for accepting a sequence of variable numbers of bits.
abstract class BitOutputStream {
	
	public abstract void writeBits(int value, int width) throws IOException;
	
}



/* 
 * An adapter for writing a sequence of variable numbers of bits to an
 * underlying byte-based output stream. Bits are packed in little endian,
 * and multi-bit integers are serialized in little endian. Must call
 * detach() when done writing, otherwise the data is not properly terminated.
 * 
 * For example, the sequence [symbol(value=1 width=1), symbol(value=48 width=6), symbol(value=304 width=9)]
 * is serialized as the bytes [0x61, 0x98].
 */
final class ByteBitOutputStream extends BitOutputStream {
	
	private OutputStream output;  // Underlying stream
	private int bitBuffer;
	private int bitBufferLen;  // Always in the range [0,8) after each write operation
	
	
	
	public ByteBitOutputStream(OutputStream out) {
		if (out == null)
			throw new NullPointerException();
		output = out;
		bitBuffer = 0;
		bitBufferLen = 0;
	}
	
	
	
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



// A sink for counting the number of bits written, but discarding the data bits.
final class CountingBitOutputStream extends BitOutputStream {
	
	public long length;  // Total number of bits written
	
	
	
	public CountingBitOutputStream() {
		length = 0;
	}
	
	
	
	public void writeBits(int value, int width) {
		length += width;
	}
	
}
