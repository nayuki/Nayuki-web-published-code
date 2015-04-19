/* 
 * Fast DEFLATE implementation
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/simple-deflate-implementation
 */

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;


public final class MarkableFileInputStream extends InputStream {
	
	private final RandomAccessFile raf;
	private long markPosition;
	
	
	
	public MarkableFileInputStream(String path) throws FileNotFoundException {
		this(new File(path));
	}
	
	
	public MarkableFileInputStream(File file) throws FileNotFoundException {
		raf = new RandomAccessFile(file, "r");
		markPosition = -1;
	}
	
	
	
	public int read() throws IOException {
		return raf.read();
	}
	
	
	public int read(byte[] b, int off, int len) throws IOException {
		return raf.read(b, off, len);
	}
	
	
	public boolean markSupported() {
		return true;
	}
	
	
	public void mark(int readLimit) {
		try {
			markPosition = raf.getFilePointer();
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}
	
	
	// Normally after a reset(), rereading the same file section will yield the same bytes.
	// But this is not always true - e.g. due to concurrent writing. Thus this class does not
	// provide a hard guarantee for the mark()/reset() behavior like BufferedInputStream does.
	public void reset() {
		try {
			raf.seek(markPosition);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}
	
}
