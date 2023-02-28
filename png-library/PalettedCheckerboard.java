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
import io.nayuki.png.image.PaletteImage;


public final class PalettedCheckerboard {
	
	public static void main(String[] args) throws IOException {
		var img = new PaletteImage() {
			public int getWidth() {
				return 256;
			}
			
			public int getHeight() {
				return 256;
			}
			
			public int[] getBitDepths() {
				return new int[]{8, 8, 8, 8};
			}
			
			public int getPixel(int x, int y) {
				return x * 16 / getWidth() + (y * 16 / getHeight()) * 16;
			}
			
			public long[] getPalette() {
				var result = new long[256];
				for (int i = 0; i < result.length; i++) {
					long r = (i + i / 16) % 2 == 0 ? 0xF0 : 0x00;
					long g = (i + i / 16) % 2 == 0 ? 0x80 : 0x80;
					long b = (i + i / 16) % 2 == 0 ? 0x00 : 0xFF;
					long a = Math.round(i / 2 / 127.0 * 255);
					result[i] = r << 48 | g << 32 | b << 16 | a << 0;
				}
				return result;
			}
		};
		
		PngImage png = ImageEncoder.toPng(img);
		png.write(new File("paletted-checkerboard.png"));
	}
	
}
