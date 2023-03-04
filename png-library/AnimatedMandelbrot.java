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
import io.nayuki.png.chunk.Actl;
import io.nayuki.png.chunk.Fctl;
import io.nayuki.png.chunk.Fdat;
import io.nayuki.png.chunk.Idat;
import io.nayuki.png.chunk.Ihdr;
import io.nayuki.png.image.RgbaImage;


public final class AnimatedMandelbrot {
	
	private static final int WIDTH = 256;
	private static final int HEIGHT = 256;
	
	private static final int NUM_FRAMES = 150;
	private static final int ITERATIONS = 1000;
	private static final double CENTER_REAL = -0.543985256;
	private static final double CENTER_IMAG = 0.654667608;
	private static final double INITIAL_RANGE = 4.0e0;
	private static final double FINAL_RANGE = 2.0e-3;
	
	
	public static void main(String[] args) throws IOException {
		PngImage png = null;
		int sequence = 0;
		for (int i = 0; i < NUM_FRAMES; i++) {
			System.err.print("\r" + i);
			
			double range = INITIAL_RANGE * Math.pow(FINAL_RANGE / INITIAL_RANGE, i / (NUM_FRAMES - 1.0));
			double crMin = CENTER_REAL - range / 2;
			double crMax = CENTER_REAL + range / 2;
			double ciMin = CENTER_IMAG - range / 2;
			double ciMax = CENTER_IMAG + range / 2;
			var img = new RgbaImage() {
				public int getWidth() {
					return WIDTH;
				}
				
				public int getHeight() {
					return HEIGHT;
				}
				
				public int[] getBitDepths() {
					return new int[]{8, 8, 8, 0};
				}
				
				public long getPixel(int x, int y) {
					double cr = crMin + (x + 0.5) / WIDTH * (crMax - crMin);
					double ci = ciMax + (y + 0.5) / HEIGHT * (ciMin - ciMax);
					double zr = 0, zi = 0;
					for (int i = 0; i < ITERATIONS; i++) {
						if (zr * zr + zi * zi > 4) {
							long temp = Math.round(Math.log(i) % 1 * 0xFF);
							return temp * 0x0001_0001_0001_0000L;
						}
						double newZr = zr * zr - zi * zi + cr;
						double newZi = 2 * zr * zi + ci;
						zr = newZr;
						zi = newZi;
					}
					return 0x0000_0000_0000_0000L;
				}
			};
			
			PngImage temp = ImageEncoder.toPng(img, Ihdr.InterlaceMethod.NONE);
			if (png == null) {
				png = temp;
				png.afterIhdr.add(new Actl(NUM_FRAMES, 3));
				png.afterIhdr.add(new Fctl(sequence, WIDTH, HEIGHT, 0, 0, 1, 1, Fctl.DisposeOperation.NONE, Fctl.BlendOperation.SOURCE));
				sequence++;
			} else {
				png.afterIdats.add(new Fctl(sequence, WIDTH, HEIGHT, 0, 0, 1, (i + 1 == NUM_FRAMES ? 1 : 30), Fctl.DisposeOperation.NONE, Fctl.BlendOperation.SOURCE));
				sequence++;
				for (Idat idat : temp.idats) {
					png.afterIdats.add(new Fdat(sequence, idat.data()));
					sequence++;
				}
			}
		}
		
		png.write(new File("animated-mandelbrot.png"));
	}
	
}
