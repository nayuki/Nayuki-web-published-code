/* 
 * Library classes for GIF optimizer (Java)
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gif-optimizer-java
 */

import java.io.IOException;
import java.io.OutputStream;


/* 
 * Output stream wrapper for GIF's subblock format. Must call detach()
 * when done writing, otherwise the data is not properly terminated.
 */
final class SubblockOutputStream extends OutputStream {
	
	private OutputStream output;  // Underlying stream
	private byte[] buffer;
	private int bufferLen;
	
	
	
	public SubblockOutputStream(OutputStream out) {
		if (out == null)
			throw new NullPointerException();
		output = out;
		buffer = new byte[255];  // Can be any length from 1 to 255, but larger is more efficient
		bufferLen = 0;
	}
	
	
	
	// Writes the given byte to the logical stream, automatically creating subblocks if necessary.
	public void write(int b) throws IOException {
		if (bufferLen == buffer.length)
			flush();
		buffer[bufferLen] = (byte)b;
		bufferLen++;
	}
	
	
	// Flushes the currently accumulated subblock, if any.
	public void flush() throws IOException {
		if (bufferLen > 0) {
			output.write(bufferLen);
			output.write(buffer, 0, bufferLen);
			output.flush();
			bufferLen = 0;
		}
	}
	
	
	// Finishes the operation of this subblock output stream. Does not close the underlying stream.
	public void detach() throws IOException {
		flush();
		output.write(0);  // Terminator (zero-length subblock)
		output = null;
	}
	
}
