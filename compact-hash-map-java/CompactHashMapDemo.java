/* 
 * Compact hash map demo
 * 
 * This program tests how many (String, Integer) entries can be stored
 * in a map until the JVM runs out of memory and terminates the process.
 * 
 * Usage: java CompactHashMapDemo regular|compact
 * 
 * Copyright (c) 2015 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/compact-hash-map-java
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

import java.io.UnsupportedEncodingException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;


public final class CompactHashMapDemo {
	
	public static void main(String[] args) {
		// Handle arguments
		if (args.length != 1) {
			System.out.println("Usage: java CompactHashMapDemo regular|compact");
			System.exit(1);
		}
		Map<String,Integer> map;
		if (args[0].equals("regular"))
			map = new HashMap<String,Integer>();
		else if (args[0].equals("compact"))
			map = new CompactHashMap<String,Integer>(TRANSLATOR);
		else
			throw new IllegalArgumentException();
		
		// Keep adding entries to map until death by OutOfMemoryError
		Runtime rt = Runtime.getRuntime();
		Random r = new Random();
		long lastPrint = 0;
		while (true) {
			char[] keyChars = new char[10];
			for (int i = 0; i < keyChars.length; i++)
				keyChars[i] = (char)(r.nextInt(94) + 33);  // Printable ASCII
			String key = new String(keyChars);
			Integer value = r.nextInt();
			map.put(key, value);
			if (System.currentTimeMillis() - lastPrint > 100) {
				System.out.printf("\rCount = %d, Memory = %.2f MiB", map.size(), (rt.totalMemory() - rt.freeMemory()) / 1048576.0);
				lastPrint = System.currentTimeMillis();
			}
		}
	}
	
	
	// Serialization format: (String s, int n) -> [s as bytes in UTF-8] + [n as 4 bytes in big endian].
	private static final CompactMapTranslator<String,Integer> TRANSLATOR = new CompactMapTranslator<String,Integer>() {
		
		public boolean isKeyInstance(Object obj) {
			return obj instanceof String;
		}
		
		
		public int getHash(String key) {
			int state = 0;
			for (int i = 0; i < key.length(); i++) {
				state += key.charAt(i);
				for (int j = 0; j < 4; j++) {
					state *= 0x7C824F73;
					state ^= 0x5C12FE83;
					state = Integer.rotateLeft(state, 5);
				}
			}
			return state;
		}
		
		
		public byte[] serialize(String key, Integer value) {
			try {
				byte[] packed = key.getBytes("UTF-8");
				int off = packed.length;
				packed = Arrays.copyOf(packed, off + 4);
				int val = value;
				packed[off + 0] = (byte)(val >>> 24);
				packed[off + 1] = (byte)(val >>> 16);
				packed[off + 2] = (byte)(val >>>  8);
				packed[off + 3] = (byte)(val >>>  0);
				return packed;
			} catch (UnsupportedEncodingException e) {
				throw new AssertionError(e);
			}
		}
		
		
		public String deserializeKey(byte[] packed) {
			try {
				return new String(packed, 0, packed.length - 4, "UTF-8");
			} catch (UnsupportedEncodingException e) {
				throw new AssertionError(e);
			}
		}
		
		
		public Integer deserializeValue(byte[] packed) {
			int n = packed.length;
			return (packed[n - 1] & 0xFF) | (packed[n - 2] & 0xFF) << 8 | (packed[n - 3] & 0xFF) << 16 | packed[n - 4] << 24;
		}
	};
	
}
