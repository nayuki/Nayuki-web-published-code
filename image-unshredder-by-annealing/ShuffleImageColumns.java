/* 
 * Image columns shuffler (Java)
 * 
 * Usage: java ShuffleImageColumns InFile.{png,bmp} OutFile.png
 * This program randomly permutes the columns of the input image to generate an output image.
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/image-unshredder-by-annealing
 */

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.Random;
import javax.imageio.ImageIO;


public class ShuffleImageColumns {
	
	public static void main(String[] args) throws IOException {
		// Handle arguments
		if (args.length != 2) {
			System.err.println("Usage: java ShuffleImageColumns InFile.{png,bmp} OutFile.png");
			return;
		}
		File inFile = new File(args[0]);
		File outFile = new File(args[1]);
		if (!inFile.isFile()) {
			System.err.println("Error: Input file does not exist");
			return;
		}
		if (outFile.isFile())
			System.err.println("Warning: Overwriting an existing output file");
		
		// Process the image
		BufferedImage image = ImageIO.read(inFile);
		Random rand = new Random();
		for (int x = 0; x < image.getWidth(); x++) {
			// Fisher-Yates shuffle 
			int xx = x + rand.nextInt(image.getWidth() - x);
			for (int y = 0; y < image.getHeight(); y++) {
				int temp = image.getRGB(x, y);
				image.setRGB(x, y, image.getRGB(xx, y));
				image.setRGB(xx, y, temp);
			}
		}
		ImageIO.write(image, "png", outFile);
	}
	
}
