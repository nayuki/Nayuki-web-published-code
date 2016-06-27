/* 
 * Fast DEFLATE implementation
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/fast-deflate-implementation
 */

import java.io.InputStream;


final class StringInputStream extends InputStream {
	
	private final String data;
	private int index;
	private int mark;
	
	
	
	public StringInputStream(String str) {
		if (!str.matches("[01]*"))
			throw new IllegalArgumentException("String must consist of only 0s and 1s");
		if (str.length() % 8 != 0)
			throw new IllegalArgumentException("String length must be a multiple of 8");
		
		data = str;
		index = 0;
		mark = -1;
	}
	
	
	
	public int read() {
		if (index >= data.length())
			return -1;
		else {
			int result = Integer.parseInt(data.substring(index, index + 8), 2);
			result = Integer.reverse(result) >>> 24;
			index += 8;
			return result;
		}
	}
	
	
	public boolean markSupported() {
		return true;
	}
	
	
	public void mark(int limit) {
		mark = index;
	}
	
	
	public void reset() {
		index = mark;
	}
	
}
