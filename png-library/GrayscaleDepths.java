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

import java.io.File;
import java.io.IOException;
import io.nayuki.png.ImageEncoder;
import io.nayuki.png.PngImage;
import io.nayuki.png.chunk.Ihdr;
import io.nayuki.png.image.GrayImage;


public final class GrayscaleDepths {
	
	public static void main(String[] args) throws IOException {
		doExample(1, 2, 1, 100, "gray-1bpp.png");
		doExample(2, 2, 2, 79, "gray-2bpp.png");
		doExample(4, 8, 2, 32, "gray-4bpp.png");
		doExample(8, 8, 32, 11, "gray-8bpp.png");
		doExample(16, 256, 256, 2, "gray-16bpp.png");
	}
	
	
	private static void doExample(int bits, int width, int height, int scale, String name) throws IOException {
		var img = new GrayImage() {
			public int getWidth() {
				return width * scale;
			}
			
			public int getHeight() {
				return height * scale;
			}
			
			public int[] getBitDepths() {
				return new int[]{bits, 0};
			}
			
			public int getPixel(int x, int y) {
				int w = y / scale * width + x / scale;
				return w << 16;
			}
		};
		
		PngImage png = ImageEncoder.toPng(img, Ihdr.InterlaceMethod.NONE);
		png.write(new File(name));
	}
	
}
