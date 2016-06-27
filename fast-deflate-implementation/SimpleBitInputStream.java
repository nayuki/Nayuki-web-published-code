/* 
 * Fast DEFLATE implementation
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/fast-deflate-implementation
 */

import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;


public final class SimpleBitInputStream implements BitInputStream {
	
	private InputStream input;   // Underlying I/O stream
	private int nextBits;        // Unused high-order bits must be zero
	private int nextBitsLength;  // Always in the range [0, 8) before and after each read call
	
	
	
	public SimpleBitInputStream(InputStream in) {
		this.input = in;
		nextBits = 0;
		nextBitsLength = 0;
	}
	
	
	
	public int readBits(int n) throws IOException {
		if (n < 0 || n > 32)
			throw new IllegalArgumentException();
		
		int result = 0;
		for (int i = 0; i < n; i++)
			result |= readBit() << i;
		return result;
	}
	
	
	private int readBit() throws IOException {
		assert 0 <= nextBitsLength && nextBitsLength < 8;
		assert nextBits >>> nextBitsLength == 0;
		
		if (nextBitsLength == 0) {
			nextBits = input.read();
			if (nextBits == -1)
				throw new EOFException();
			nextBitsLength = 8;
		}
		
		int result = nextBits & 1;
		nextBits >>>= 1;
		nextBitsLength--;
		return result;
	}
	
	
	public void readBytes(byte[] b, int off, int len) throws IOException {
		nextBits = 0;
		nextBitsLength = 0;  // Discard partial byte, if any
		
		int end = off + len;
		while (off < end) {
			int n = input.read(b, off, end - off);
			if (n == -1)
				throw new EOFException();
			off += n;
		}
	}
	
	
	public InputStream detach() {
		if (input == null)
			throw new IllegalStateException();
		nextBits = 0;
		nextBitsLength = -1;
		InputStream result = input;
		input = null;
		return result;
	}
	
	
	public void close() throws IOException {
		input.close();
		input = null;
		nextBits = 0;
		nextBitsLength = -1;
	}
	
}
