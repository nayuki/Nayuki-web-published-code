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
 * Input stream parser for GIF's subblock format. This continues to return data
 * until a 0-length subblock is encountered; afterwards it returns -1 to signify EOF.
 */
final class SubblockInputStream extends InputStream {
	
	private InputStream input;  // Underlying stream
	private byte[] buffer;  // Only the range [0, bufferLen) is valid data
	private int bufferLen;
	private int bufferIndex;
	private int eofState;  // 0 = active, 1 = normal termination, 2 = unexpected termination
	
	
	
	public SubblockInputStream(InputStream in) {
		Objects.requireNonNull(in);
		input = in;
		buffer = new byte[255];
		bufferLen = 0;
		bufferIndex = 0;
		eofState = 0;
	}
	
	
	
	// Returns the next unsigned byte value in the stream, or -1 if the sequence of subblocks has ended.
	public int read() throws IOException {
		// Handle exceptional states first
		if (eofState == 0 && bufferIndex >= bufferLen) {
			bufferLen = input.read();
			if (bufferLen > 0) {  // Normal data subblock
				readFully(input, buffer, bufferLen);
				bufferIndex = 0;
			} else if (bufferLen == 0)  // Zero-length subblock
				eofState = 1;
			else if (bufferLen == -1)  // EOF encountered in underlying stream
				eofState = 2;
			else
				throw new AssertionError();
		}
		if (eofState == 1)
			return -1;
		if (eofState == 2)
			throw new EOFException();
		
		// Return next byte normally
		int result = buffer[bufferIndex] & 0xFF;
		bufferIndex++;
		return result;
	}
	
	
	// Reads buf range [0, len) fully or throws EOFException.
	private static void readFully(InputStream in, byte[] buf, int len) throws IOException {
		for (int off = 0; off < len; ) {
			int n = in.read(buf, off, len - off);
			if (n == -1)
				throw new EOFException();
			off += n;
		}
	}
	
}
