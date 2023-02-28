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

public final class RainbowRing {
	
	public static void main(String[] args) throws IOException {
		var img = new RgbaImage() {
			public int getWidth() {
				return 400;
			}
			
			public int getHeight() {
				return 400;
			}
			
			public int[] getBitDepths() {
				return new int[]{8, 8, 8, 8};
			}
			
			public long getPixel(int x, int y) {
				double radius = Math.hypot(x + 0.5 - getWidth() / 2.0, y + 0.5 - getHeight() / 2.0);
				double angle = Math.atan2(y + 0.5 - getHeight() / 2.0, x + 0.5 - getWidth() / 2.0);
				long rgb = hsvToRgb(angle / (Math.PI * 2), 1, 1);
				long a = Math.round(1 / (1 + Math.exp((Math.abs(radius - getWidth() * 0.4) - 20) * 2)) * 255);
				return rgb | a << 0;
			}
		};
		
		PngImage png = ImageEncoder.toPng(img);
		png.write(new File("rainbow-ring.png"));
	}
	
	
	private static long hsvToRgb(double hue, double saturation, double value) {
		hue = ((hue % 1) + 1) % 1;
		long result = 0;
		for (int i = 0; i < 3; i++) {
			double temp = (hue * 6 + 7 - i * 2) % 6;
			double x;
			if (temp < 2)
				x = 1;
			else if (temp < 3)
				x = 3 - temp;
			else if (temp < 5)
				x = 0;
			else
				x = temp - 5;
			long y = Math.round((1 - saturation + x * saturation) * value * 255);
			result |= y << ((3 - i) * 16);
		}
		return result;
	}
	
}
