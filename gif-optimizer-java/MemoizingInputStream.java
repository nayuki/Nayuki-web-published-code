/* 
 * Library classes for GIF optimizer (Java)
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gif-optimizer-java
 */

import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;


/* 
 * Remembers and allows retrieval of all the bytes read so far.
 * This makes it easy to copy data verbatim to an output stream.
 */
final class MemoizingInputStream extends InputStream {
	
	/*---- Fields ----*/
	
	private InputStream input;  // Underlying stream
	private ByteArrayOutputStream buffer;  // All bytes read since the last clearing
	
	
	
	/*---- Constructors ----*/
	
	public MemoizingInputStream(InputStream in) {
		input = Objects.requireNonNull(in);
		clearBuffer();
	}
	
	
	
	/*---- Methods ----*/
	
	public int read() throws IOException {
		int result = input.read();
		if (result != -1)
			buffer.write(result);
		return result;
	}
	
	
	public int read(byte[] b, int off, int len) throws IOException {
		int n = input.read(b, off, len);
		if (n >= 0)
			buffer.write(b, off, n);
		return n;
	}
	
	
	public void readFully(byte[] buf) throws IOException {
		for (int off = 0; off < buf.length; ) {
			int n = read(buf, off, buf.length - off);
			if (n == -1)
				throw new EOFException();
			off += n;
		}
	}
	
	
	public byte[] getBuffer() {
		return buffer.toByteArray();
	}
	
	
	public void clearBuffer() {
		buffer = new ByteArrayOutputStream();
	}
	
}
