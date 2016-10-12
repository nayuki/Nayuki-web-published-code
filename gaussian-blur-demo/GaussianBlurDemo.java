/* 
 * Gaussian blur demo (Java)
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gaussian-blur-demo
 */

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import javax.imageio.ImageIO;


public final class GaussianBlurDemo {
	
	public static void main(String[] args) throws IOException {
		// Handle command line arguments
		if (args.length != 3) {
			System.err.println("java GaussianBlurDemo InputImg.png/bmp Radius OutputImg.png");
			System.exit(1);
			return;
		}
		File inFile = new File(args[0]);
		double radius = Double.parseDouble(args[1]);
		if (radius < 0)
			throw new IllegalArgumentException("Radius must be non-negative");
		File outFile = new File(args[2]);
		
		// Read input image
		BufferedImage image = ImageIO.read(inFile);
		int width = image.getWidth();
		int height = image.getHeight();
		int numPixels = width * height;
		
		// Convert to planar float
		double[][] pixels = new double[4][numPixels];
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++) {
				int rgb = image.getRGB(x, y);
				for (int ch = 0; ch < 3; ch++) {
					int val = (rgb >>> ((2 - ch) * 8)) & 0xFF;
					pixels[ch][y * width + x] = Math.pow(val / 255.0, 2.2);
				}
				pixels[3][y * width + x] = 1;
			}
		}
		
		// Do the Gaussian blur image operation
		gaussianBlur(pixels, width, height, radius);
		
		// Convert to packed int
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++) {
				double weight = pixels[3][y * width + x];
				int rgb = 0xFF;
				for (int ch = 0; ch < 3; ch++) {
					int val = (int)Math.round(Math.pow(pixels[ch][y * width + x] / weight, 1 / 2.2) * 255);
					if (val < 0)
						val = 0;
					else if (val > 255)
						val = 255;
					rgb = rgb << 8 | val;
				}
				image.setRGB(x, y, rgb);
			}
		}
		ImageIO.write(image, "png", outFile);
	}
	
	
	
	private static void gaussianBlur(double[][] pixels, int width, int height, double radius) {
		// Handle the radius
		if (radius < 0)
			throw new IllegalArgumentException();
		else if (radius == 0)
			radius = 1e-10;
		double scaler = -1 / (radius * radius * 2);
		
		// Make row kernel
		int length = 1;
		while (length < width * 3 - 2)
			length *= 2;
		double[] kernel = new double[length];
		for (int i = -(width - 1); i < width; i++)
			kernel[(i + length) % length] = Math.exp(scaler * i * i);
		FftConvolver conv = new FftConvolver(kernel);
		
		// Do row convolutions
		double[] lineReal = new double[length];
		double[] lineImag = new double[length];
		for (int ch = 0; ch < pixels.length; ch++) {
			for (int y = 0; y < height; y++) {
				for (int x = 0; x < width; x++)
					lineReal[x] = pixels[ch][y * width + x];
				Arrays.fill(lineReal, width, lineReal.length, 0);
				Arrays.fill(lineImag, 0);
				conv.convolve(lineReal, lineImag);
				for (int x = 0; x < width; x++)
					pixels[ch][y * width + x] = lineReal[x];
			}
		}
		
		// Make column kernel
		length = 1;
		while (length < height * 3 - 2)
			length *= 2;
		kernel = new double[length];
		for (int i = -(height - 1); i < height; i++)
			kernel[(i + length) % length] = Math.exp(scaler * i * i);
		conv = new FftConvolver(kernel);
		
		// Do column convolutions
		lineReal = new double[length];
		lineImag = new double[length];
		for (int ch = 0; ch < pixels.length; ch++) {
			for (int x = 0; x < width; x++) {
				for (int y = 0; y < height; y++)
					lineReal[y] = pixels[ch][y * width + x];
				Arrays.fill(lineReal, height, lineReal.length, 0);
				Arrays.fill(lineImag, 0);
				conv.convolve(lineReal, lineImag);
				for (int y = 0; y < height; y++)
					pixels[ch][y * width + x] = lineReal[y];
			}
		}
	}
	
	
	
	// A heavily modified version of https://www.nayuki.io/page/free-small-fft-in-multiple-languages .
	private static final class FftConvolver {
		
		private final int length;
		private double[] kernelReal;
		private double[] kernelImag;
		
		private double[] cosTable;
		private double[] sinTable;
		private int[] bitRevTable;
		
		
		public FftConvolver(double[] krnReal) {
			length = krnReal.length;
			int levels = 31 - Integer.numberOfLeadingZeros(length);
			if (1 << levels != length)
				throw new IllegalArgumentException("Length is not a power of 2");
			
			cosTable = new double[length / 2];
			sinTable = new double[length / 2];
			for (int i = 0; i < cosTable.length; i++) {
				cosTable[i] = Math.cos(2 * Math.PI * i / length);
				sinTable[i] = Math.sin(2 * Math.PI * i / length);
			}
			
			bitRevTable = new int[length];
			for (int i = 0; i < length; i++)
				bitRevTable[i] = Integer.reverse(i) >>> (32 - levels);
			
			kernelReal = krnReal.clone();
			kernelImag = new double[length];
			transform(kernelReal, kernelImag);
		}
		
		
		public void convolve(double[] real, double[] imag) {
			if (real.length != length || imag.length != length)
				throw new IllegalArgumentException();
			transform(real, imag);
			for (int i = 0; i < length; i++) {
				double temp = real[i] * kernelReal[i] - imag[i] * kernelImag[i];
				imag[i]     = imag[i] * kernelReal[i] + real[i] * kernelImag[i];
				real[i]     = temp;
			}
			transform(imag, real);
		}
		
		
		private void transform(double[] real, double[] imag) {
			for (int i = 0; i < real.length; i++) {
				int j = bitRevTable[i];
				if (j > i) {
					double tpre = real[i];
					double tpim = imag[i];
					real[i] = real[j];
					imag[i] = imag[j];
					real[j] = tpre;
					imag[j] = tpim;
				}
			}
			
			for (int size = 2; size <= length; size *= 2) {
				int halfsize = size / 2;
				int tablestep = length / size;
				for (int i = 0; i < length; i += size) {
					for (int j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
						double tpre =  real[j+halfsize] * cosTable[k] + imag[j+halfsize] * sinTable[k];
						double tpim = -real[j+halfsize] * sinTable[k] + imag[j+halfsize] * cosTable[k];
						real[j + halfsize] = real[j] - tpre;
						imag[j + halfsize] = imag[j] - tpim;
						real[j] += tpre;
						imag[j] += tpim;
					}
				}
				if (size == length)
					break;
			}
		}
		
	}
	
}
