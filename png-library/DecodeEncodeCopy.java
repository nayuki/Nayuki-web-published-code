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
import java.util.Optional;
import io.nayuki.png.ImageDecoder;
import io.nayuki.png.ImageEncoder;
import io.nayuki.png.PngImage;
import io.nayuki.png.chunk.Chunk;
import io.nayuki.png.chunk.Ihdr;
import io.nayuki.png.chunk.Sbit;
import io.nayuki.png.image.GrayImage;
import io.nayuki.png.image.PaletteImage;
import io.nayuki.png.image.RgbaImage;


public final class DecodeEncodeCopy {
	
	public static void main(String[] args) throws IOException {
		var inFile = new File(args[0]);
		var outFile = new File(args[1]);
		
		PngImage inPng = PngImage.read(inFile);
		Object image = ImageDecoder.toImage(inPng);
		
		PngImage outPng;
		if (image instanceof RgbaImage img)
			outPng = ImageEncoder.toPng(img, Ihdr.InterlaceMethod.NONE);
		else if (image instanceof GrayImage img)
			outPng = ImageEncoder.toPng(img, Ihdr.InterlaceMethod.NONE);
		else if (image instanceof PaletteImage img)
			outPng = ImageEncoder.toPng(img, Ihdr.InterlaceMethod.NONE);
		else
			throw new AssertionError("Unreachable type");
		
		Optional<Sbit> sbit;
		if (outPng.afterIhdr.isEmpty())
			sbit = Optional.empty();
		else if (outPng.afterIhdr.size() == 1 && outPng.afterIhdr.get(0) instanceof Sbit)
			sbit = Optional.of((Sbit)outPng.afterIhdr.remove(0));
		else
			throw new AssertionError("Unreachable state");
		for (Chunk chk : inPng.afterIhdr) {
			if (chk instanceof Sbit)
				sbit.ifPresent(sb -> outPng.afterIhdr.add(sb));
			else
				outPng.afterIhdr.add(chk);
		}
		sbit.ifPresent(sb -> outPng.afterIhdr.add(sb));
		
		if (!outPng.afterIdats.isEmpty())
			throw new AssertionError("Unreachable state");
		outPng.afterIdats.addAll(inPng.afterIdats);
		
		outPng.write(outFile);
	}
	
}
