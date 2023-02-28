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
import java.util.ArrayList;
import java.util.List;
import io.nayuki.png.Chunk;
import io.nayuki.png.PngImage;
import io.nayuki.png.chunk.Iend;


public final class ReadPrintChunks {
	
	public static void main(String[] args) throws IOException {
		PngImage png = PngImage.read(new File(args[0]));
		List<Chunk> chunks = new ArrayList<>();
		chunks.add(png.ihdr.get());
		chunks.addAll(png.afterIhdr);
		chunks.addAll(png.idats);
		chunks.addAll(png.afterIdats);
		chunks.add(Iend.SINGLETON);
		
		for (Chunk chk : chunks) {
			if (getAllInterfaces(chk).stream().anyMatch(intf -> intf.getName().equals("io.nayuki.png.chunk.BytesDataChunk")))
				System.out.printf("%s[data = %d bytes]%n", chk.getType(), chk.getData().length);
			else if (chk instanceof Record) {
				String s = chk.toString();
				System.out.printf("%s%s%n", chk.getType(), s.substring(s.indexOf("[")));
			} else
				System.out.printf("%s[%s]%n", chk.getType(), chk.toString());
		}
	}
	
	
	private static Set<Class<?>> getAllInterfaces(Object obj) {
		// Traverse chain of superclasses
		Set<Class<?>> result = new HashSet<>();
		for (Class<?> cls = obj.getClass(); cls != null; cls = cls.getSuperclass())
			Collections.addAll(result, cls.getInterfaces());
		
		// Traverse directed acyclic graph of superinterfaces
		while (true) {
			Set<Class<?>> more = new HashSet<>();
			for (Class<?> intf : result)
				Collections.addAll(more, intf.getInterfaces());
			boolean added = false;
			for (Class<?> intf : more)
				added |= result.add(intf);
			if (!added)
				break;
		}
		return result;
	}
	
}
