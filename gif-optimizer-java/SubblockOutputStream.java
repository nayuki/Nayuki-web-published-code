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
 * An output stream that converts a plain byte stream to GIF's subblock format.
 * Must call detach() when finished writing to properly terminate the data.
 */
final class SubblockOutputStream extends OutputStream {
	
	/*---- Fields ----*/
	
	private OutputStream output;  // Underlying stream
	private byte[] buffer;        // Only the prefix [0 : bufferFilled] contains valid data
	private int bufferFilled;     // Always in the range [0, buffer.length)
	
	
	
	/*---- Constructors ----*/
	
	public SubblockOutputStream(OutputStream out) {
		output = Objects.requireNonNull(out);
		buffer = new byte[255];  // Can be any length from 1 to 255, but larger is more efficient
		bufferFilled = 0;
	}
	
	
	
	/*---- Methods ----*/
	
	// Writes the given byte to the logical stream, automatically creating subblocks if necessary.
	public void write(int b) throws IOException {
		buffer[bufferFilled] = (byte)b;
		bufferFilled++;
		if (bufferFilled == buffer.length)
			flush();
	}
	
	
	// Flushes the currently accumulated subblock, if any.
	public void flush() throws IOException {
		if (bufferFilled > 0) {
			output.write(bufferFilled);
			output.write(buffer, 0, bufferFilled);
			output.flush();
			bufferFilled = 0;
		}
	}
	
	
	// Terminates the sequence of subblocks. Does not close the underlying stream.
	public void detach() throws IOException {
		if (output == null)
			throw new IllegalStateException();
		flush();
		output.write(0);  // Terminator (zero-length subblock)
		buffer = null;
		bufferFilled = -1;
		output = null;
	}
	
}
