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
import java.util.Random;
import io.nayuki.png.ImageEncoder;
import io.nayuki.png.PngImage;
import io.nayuki.png.image.BufferedPaletteImage;


public final class PalettedRectangles {
	
	public static void main(String[] args) throws IOException {
		var rand = new Random();
		
		int[] bitDepths = {8, 8, 8, 8};
		var palette = new long[1 + 10];
		palette[0] = 0x0000_0000_0000_0000;
		for (int i = 1; i < palette.length; i++) {
			long r = rand.nextInt(1 << bitDepths[0]);
			long g = rand.nextInt(1 << bitDepths[0]);
			long b = rand.nextInt(1 << bitDepths[0]);
			long a = 0xFF;
			palette[i] = r << 48 | g << 32 | b << 16 | a << 0;
		}
		
		var img = new BufferedPaletteImage(1280, 960, bitDepths, palette);
		for (int i = 0; i < 30; i++) {
			int left = rand.nextInt(img.getWidth());
			int top = rand.nextInt(img.getHeight());
			int width = rand.nextInt(img.getWidth() - left) + 1;
			int height = rand.nextInt(img.getHeight() - top) + 1;
			int color = rand.nextInt(palette.length - 1) + 1;
			for (int y = 0; y < height; y++) {
				for (int x = 0; x < width; x++) {
					img.setPixel(left + x, top + y, color);
				}
			}
		}
		
		PngImage png = ImageEncoder.toPng(img);
		png.write(new File("paletted-rectangles.png"));
	}
	
}
