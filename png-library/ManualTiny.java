/* 
 * Demo for PNG library (Java)
 * 
 * Copyright (c) 2023 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/png-library
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.util.Optional;
import java.util.zip.DeflaterOutputStream;
import io.nayuki.png.PngImage;
import io.nayuki.png.chunk.Idat;
import io.nayuki.png.chunk.Ihdr;


public final class ManualTiny {
	
	public static void main(String[] args) throws IOException {
		var png = new PngImage();
		png.ihdr = Optional.of(new Ihdr(3, 1, 8, Ihdr.ColorType.TRUE_COLOR,
			Ihdr.CompressionMethod.ZLIB_DEFLATE, Ihdr.FilterMethod.ADAPTIVE, Ihdr.InterlaceMethod.NONE));
		
		var bout = new ByteArrayOutputStream();
		try (var dout = new DeflaterOutputStream(bout)) {
			byte[] data = {
				0,  // Row filter
				-1, 0, 0,  // Red
				0, -1, 0,  // Green
				0, 0, -1,  // Blue
			};
			dout.write(data);
		}
		png.idats.add(new Idat(bout.toByteArray()));
		
		png.write(new File("manual-tiny.png"));
	}
	
}
