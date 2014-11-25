/* 
 * Fast DEFLATE implementation
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/simple-deflate-implementation
 */

import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;


public final class BufferedBitInputStream implements BitInputStream {
	
	/* Fields */
	
	private InputStream input;   // Underlying I/O stream
	private byte[] buffer;       // Can have any positive length
	private int bufferFilled;    // 0 <= inputBufferFilled <= inputBuffer.length, or -1 to indicate end of stream
	private int bufferIndex;     // 0 <= inputBufferIndex <= max(inputBufferFilled, 0)
	private long nextBits;       // Unused high-order bits must be zero. Must only contain data from the current input buffer (i.e. not past buffers) so that the bits after the end of the DEFLATE stream can be unread
	private int nextBitsLength;  // Always in the range [0, 63] before and after every call to readBits()
	
	
	
	/* Constructors */
	
	public BufferedBitInputStream(InputStream in) {
		this(in, 1024);
	}
	
	
	public BufferedBitInputStream(InputStream in, int bufLen) {
		if (in == null)
			throw new NullPointerException();
		if (bufLen <= 0)
			throw new IllegalArgumentException("Buffer length must be positive");
		if (!in.markSupported())
			throw new IllegalArgumentException("Input stream needs to be markable");
		
		input = in;
		buffer = new byte[bufLen];
		bufferFilled = 0;
		bufferIndex = 0;
		nextBits = 0;
		nextBitsLength = 0;
	}
	
	
	
	/* I/O methods */
	
	// Reads the given number of bits from the input stream, return a non-negative integer in bit little endian
	public int readBits(int n) throws IOException {
		if (n < 0 || n > 32)
			throw new IllegalArgumentException();
		
		assert 0 <= nextBitsLength && nextBitsLength <= 63;
		assert nextBits >>> nextBitsLength == 0;  // Ensure high-order bits are clean
		
		// Ensure there is enough data in the bit buffer
		while (nextBitsLength < n) {
			int i = bufferIndex;
			byte[] buf = buffer;
			
			// Fill bit buffer with as many bytes as possible
			int bytes = Math.min((64 - nextBitsLength) >>> 3, bufferFilled - i);
			long temp;
			if (bytes == 8)
				temp = (((buf[i]&0xFF) | (buf[i+1]&0xFF)<<8 | (buf[i+2]&0xFF)<<16 | buf[i+3]<<24) & 0xFFFFFFFFL) | (long)((buf[i+4]&0xFF) | (buf[i+5]&0xFF)<<8 | (buf[i+6]&0xFF)<<16 | buf[i+7]<<24) << 32;
			else if (bytes == 7)
				temp = (((buf[i]&0xFF) | (buf[i+1]&0xFF)<<8 | (buf[i+2]&0xFF)<<16 | buf[i+3]<<24) & 0xFFFFFFFFL) | (long)((buf[i+4]&0xFF) | (buf[i+5]&0xFF)<<8 | (buf[i+6]&0xFF)<<16) << 32;
			else if (bytes == 6)
				temp = (((buf[i]&0xFF) | (buf[i+1]&0xFF)<<8 | (buf[i+2]&0xFF)<<16 | buf[i+3]<<24) & 0xFFFFFFFFL) | (long)((buf[i+4]&0xFF) | (buf[i+5]&0xFF)<<8) << 32;
			else if (bytes == 5)
				temp = (((buf[i]&0xFF) | (buf[i+1]&0xFF)<<8 | (buf[i+2]&0xFF)<<16 | buf[i+3]<<24) & 0xFFFFFFFFL) | (long)(buf[i+4]&0xFF) << 32;
			else if (bytes == 4)
				temp = (((buf[i]&0xFF) | (buf[i+1]&0xFF)<<8 | (buf[i+2]&0xFF)<<16 | buf[i+3]<<24) & 0xFFFFFFFFL);
			else if (bytes > 0) {
				// This slower general logic is valid for 1 <= bytes <= 8
				temp = 0;
				for (int j = 0; j < bytes; i++, j++)
					temp |= (buf[i] & 0xFFL) << (j << 3);
			} else if (bytes == 0) {
				// Fill and retry
				fillInputBuffer();
				continue;
			} else if (bytes == -1 && bufferFilled == -1)  // Note: fillInputBuffer() sets inputBufferIndex to 0
				throw new EOFException();  // Previous buffer fill hit the end of stream
			else
				throw new AssertionError();  // Impossible state
			
			nextBits |= temp << nextBitsLength;
			nextBitsLength += bytes << 3;
			bufferIndex += bytes;
		}
		
		// Extract bits to return
		int result;
		if (n < 32)
			result = (int)nextBits & ((1 << n) - 1);  // This is valid for 0 <= n <= 31
		else
			result = (int)nextBits;
		nextBits >>>= n;
		nextBitsLength -= n;
		assert 0 <= nextBitsLength && nextBitsLength <= 63;  // Recheck invariants
		assert nextBits >>> nextBitsLength == 0;
		return result;
	}
	
	
	public void readBytes(byte[] b, int off, int len) throws IOException {
		if (b.length - off < len)
			throw new IllegalArgumentException();
		assert 0 <= nextBitsLength && nextBitsLength <= 63;
		assert nextBits >>> nextBitsLength == 0;
		
		// Discard remaining partial bits
		int n = nextBitsLength & 7;
		nextBits >>>= n;
		nextBitsLength -= n;
		assert nextBitsLength % 8 == 0;
		
		// Unpack saved bits first
		int end = off + len;
		for (; nextBitsLength >= 8 && off < end; off++) {
			b[off] = (byte)nextBits;
			nextBits >>>= 8;
			nextBitsLength -= 8;
		}
		
		// Read/copy from buffer
		assert 0 <= bufferIndex && bufferIndex <= Math.max(bufferFilled, 0);
		while (off < end) {
			if (bufferIndex >= bufferFilled)
				fillInputBuffer();
			if (bufferFilled == -1)
				throw new EOFException();
			
			n = Math.min(end - off, bufferFilled - bufferIndex);
			System.arraycopy(buffer, bufferIndex, b, off, n);
			bufferIndex += n;
			off += n;
		}
	}
	
	
	/* Other public methods */
	
	// Returns the state without changing it. Result is in bit little endian.
	public long getRawNextBits() {
		return nextBits;
	}
	
	
	public int getNextBitsLength() {
		assert 0 <= nextBitsLength && nextBitsLength <= 63;
		return nextBitsLength;
	}
	
	
	public InputStream detach() throws IOException {
		if (input == null)
			throw new IllegalStateException();
		
		input.reset();
		skipFully(input, bufferIndex - nextBitsLength / 8);  // Note: Fractional bits are considered to be consumed
		
		buffer = null;
		bufferFilled = -1;
		bufferIndex = -1;
		nextBits = 0;
		nextBitsLength = -1;
		
		InputStream result = input;
		input = null;
		return result;
	}
	
	
	public void close() throws IOException {
		if (input == null)
			throw new IllegalStateException();
		
		input.close();
		input = null;
		buffer = null;
		bufferFilled = -1;
		bufferIndex = -1;
		nextBits = 0;
		nextBitsLength = -1;
	}
	
	
	/* Private helper methods */
	
	private void fillInputBuffer() throws IOException {
		if (bufferFilled == -1)  // Previous fill already hit EOF
			throw new EOFException();
		if (bufferIndex < bufferFilled)
			throw new AssertionError("Input buffer not fully consumed yet");
		
		input.mark(buffer.length);  // Acknowledge all previously read bytes
		bufferFilled = input.read(buffer);
		bufferIndex = 0;
	}
	
	
	private static void skipFully(InputStream in, int len) throws IOException {
		while (len > 0) {
			long n = in.skip(len);
			if (n <= 0)
				throw new EOFException();
			len -= n;
		}
	}
	
}
