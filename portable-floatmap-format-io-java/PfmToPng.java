/* 
 * Portable FloatMap to PNG
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/portable-floatmap-format-io-java
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

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import javax.imageio.ImageIO;


/* 
 * Converts a Portable FloatMap (PFM) image file to a PNG file.
 * Applies a tone curve and sRGB gamma correction. (Can be customized by editing the code.)
 */
public final class PfmToPng {
	
	public static void main(String[] args) throws IOException {
		// Handle arguments
		if (args.length != 2) {
			System.err.println("Usage: java PfmToPng Input.pfm Output.png");
			System.exit(1);
			return;
		}
		File inFile = new File(args[0]);
		File outFile = new File(args[1]);
		if (!inFile.isFile()) {
			System.err.println("Error: Input file does not exist");
			System.exit(1);
			return;
		}
		
		// Read input image file
		PortableFloatMap pfm = new PortableFloatMap(inFile);
		int width = pfm.width;
		int height = pfm.height;
		float[] inpix = pfm.pixels;
		
		// Convert pixels from float32 to uint8 and do packing
		int[] outpix = new int[width * height];
		if (pfm.mode == PortableFloatMap.Mode.COLOR) {
			for (int y = height - 1, i = 0; y >= 0; y--) {
				for (int x = 0; x < width; x++, i += 3) {
					outpix[y * width + x] =
						floatToByte(inpix[i + 0]) << 16 |
						floatToByte(inpix[i + 1]) <<  8 |
						floatToByte(inpix[i + 2]) <<  0;
				}
			}
		} else if (pfm.mode == PortableFloatMap.Mode.GRAYSCALE) {
			for (int y = height - 1, i = 0; y >= 0; y--) {
				for (int x = 0; x < width; x++, i++)
					outpix[y * width + x] = floatToByte(inpix[i]) * 0x010101;
			}
		} else
			throw new AssertionError();
		
		// Write output image file
		BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
		img.setRGB(0, 0, width, height, outpix, 0, width);
		ImageIO.write(img, "png", outFile);
	}
	
	
	@SuppressWarnings("unused")  // To persuade Eclipse to show fewer squiggly underlines for sketchy coding practices
	private static int floatToByte(float x) {
		final int MODE = 3;  // Try changing me!
		
		if (MODE == 0)  // Simple mapping of [0.0, 1.0] to [0, 255]
			return to8Bit(x);
		
		else if (MODE == 1)  // Mapping [0.0, 1.0] to [0, 255] with standard gamma correction of 2.2
			return to8Bit(linearToGamma(x, 2.2));
		
		else if (MODE == 2)  // Mapping [0.0, 1.0] to [0, 255] with sRGB gamma correction
			return to8Bit(linearToSrgb(x));
		
		else if (MODE == 3) {  // Film-like exposure curve output as sRGB
			final double GAIN = Math.log(2);  // By default, GAIN=log(2) maps 0 to 0, 1 to 1/2, 2 to 3/4, 3 to 7/8, etc.
			return to8Bit(linearToSrgb(1 - Math.exp(-x * GAIN)));
			
		} else
			throw new AssertionError();
	}
	
	
	
	/*---- Utility functions ----*/
	
	// Returns a value in the range [0, 255].
	private static int to8Bit(double val) {
		if (val > 1)
			val = 1;
		else if (val < 0)
			val = 0;
		return (int)(val * 255 + 0.5);
	}
	
	
	private static double linearToGamma(double val, double gamma) {
		return Math.pow(val, 1 / gamma);
	}
	
	
	private static double linearToSrgb(double val) {
		if (val <= 0.0031308)
			return val * 12.92;
		else
			return Math.pow(val, 1 / 2.4) * 1.055 - 0.055;
	}
	
}
