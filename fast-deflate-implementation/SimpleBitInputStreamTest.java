/* 
 * Fast DEFLATE implementation
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/simple-deflate-implementation
 */

import java.io.InputStream;


public class SimpleBitInputStreamTest extends BitInputStreamTest {
	
	protected BitInputStream newInstance(InputStream in) {
		return new SimpleBitInputStream(in);
	}
	
}
