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
import io.nayuki.png.image.RgbaImage;


public final class RedGreenGradient {
	
	public static void main(String[] args) throws IOException {
		var img = new RgbaImage() {
			public int getWidth() {
				return 256;
			}
			
			public int getHeight() {
				return 256;
			}
			
			public int[] getBitDepths() {
				return new int[]{8, 8, 8, 0};
			}
			
			public long getPixel(int x, int y) {
				long r = x;
				long g = y;
				long b = 0;
				return r << 48 | g << 32 | b << 16;
			}
		};
		
		PngImage png = ImageEncoder.toPng(img);
		png.write(new File("red-green-gradient.png"));
	}
	
}
