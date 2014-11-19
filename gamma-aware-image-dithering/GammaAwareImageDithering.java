/* 
 * Gamma-aware image dithering
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/gamma-aware-image-dithering
 */

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import javax.imageio.ImageIO;


public class GammaAwareImageDithering {
	
	public static void main(String[] args) throws IOException {
		if (args.length != 3 || !(args[1].equals("naive") || args[1].equals("srgb"))) {
			System.err.println("Usage: java GammaAwareImageDithering Input.png/bmp srgb/naive Output.png");
			System.exit(1);
		}
		
		BufferedImage input = ImageIO.read(new File(args[0]));
		BufferedImage output;
		if (args[1].equals("naive"))
			output = naiveDither(input);
		else if (args[1].equals("srgb"))
			output = srgbDither(input);
		else
			throw new AssertionError();
		ImageIO.write(output, "png", new File(args[2]));
	}
	
	
	private static BufferedImage naiveDither(BufferedImage image) {
		BufferedImage result = newBlackImage(image.getWidth(), image.getHeight());
		for (int ch = 0; ch < 3; ch++) {  // For each RGB channel
			int error = 0;
			for (int y = 0; y < image.getHeight(); y++) {
				for (int x = 0; x < image.getWidth(); x++) {
					int inPixel = (image.getRGB(x, y) >>> (ch * 8)) & 0xFF;
					int outPixel = quantize(inPixel - error);
					result.setRGB(x, y, result.getRGB(x, y) | (outPixel << (ch * 8)));
					error += outPixel - inPixel;
				}
			}
		}
		return result;
	}
	
	
	private static BufferedImage srgbDither(BufferedImage image) {
		BufferedImage result = newBlackImage(image.getWidth(), image.getHeight());
		for (int ch = 0; ch < 3; ch++) {  // For each RGB channel
			double error = 0;
			for (int y = 0; y < image.getHeight(); y++) {
				for (int x = 0; x < image.getWidth(); x++) {
					double inPixel = srgb8BitToLinear[(image.getRGB(x, y) >>> (ch * 8)) & 0xFF];
					int outPixel = quantizeLinearToSrgb(inPixel - error);
					result.setRGB(x, y, result.getRGB(x, y) | (outPixel << (ch * 8)));
					error += srgb8BitToLinear[outPixel] - inPixel;
				}
			}
		}
		return result;
	}
	
	
	// Takes an 8-bit value in the nominal range [0,255], rounds it to a 2-bit value, and expands the result back to 8 bits (resulting in {0,85,170,255})
	private static int quantize(int val) {
		if (val <= 0)
			return 0;
		else if (val >= 255)
			return 255;
		else
			return (val + 42) / 85 * 85;
	}
	
	
	// Takes a linear value in the nominal range [0.0,1.0], rounds it to a 2-bit value, and expands the result back to 8 bits (resulting in {0,85,170,255})
	private static int quantizeLinearToSrgb(double val) {
		if (val <= 0.0)
			return 0;
		else if (val >= 1.0)
			return 255;
		else {
			// Generate candidates by rounding down and up
			double srgb = linearToSrgb(val) * 3;
			int low = (int)Math.floor(srgb) * 85;
			int high = (int)Math.ceil(srgb) * 85;
			
			// Choose the quantized candidate that differs less from the input value
			if (val - srgb8BitToLinear[low] <= srgb8BitToLinear[high] - val)
				return low;
			else
				return high;
		}
	}
	
	
	// Input and output must be in the range [0.0, 1.0]
	private static double srgbToLinear(double val) {
		if (val <= 0.04045)
			return val / 12.92;
		else
			return Math.pow((val + 0.055) / 1.055, 2.4);
	}
	
	
	// Fast look-up table for 8-bit values
	private static double[] srgb8BitToLinear = new double[256];
	static {
		for (int i = 0; i < 256; i++)
			srgb8BitToLinear[i] = srgbToLinear(i / 255.0);
	}
	
	
	// Input and output must be in the range [0.0, 1.0]
	private static double linearToSrgb(double val) {
		if (val <= 0.0031308)
			return val * 12.92;
		else
			return Math.pow(val, 1 / 2.4) * 1.055 - 0.055;
	}
	
	
	private static BufferedImage newBlackImage(int width, int height) {
		BufferedImage result = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++)
				result.setRGB(x, y, 0);
		}
		return result;
	}
	
}
