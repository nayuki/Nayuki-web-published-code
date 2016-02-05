/* 
 * Fast DEFLATE implementation
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/simple-deflate-implementation
 */

import java.io.InputStream;


public class BufferedBitInputStreamTest extends BitInputStreamTest {
	
	protected BitInputStream newInstance(InputStream in) {
		return new BufferedBitInputStream(in, rand.nextInt(64) + 1);
	}
	
}
