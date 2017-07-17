/* 
 * Compact hash set demo
 * 
 * This program tests how many short strings can be stored in a set
 * until the JVM runs out of memory and terminates the process.
 * 
 * Usage: java CompactHashSetDemo regular|compact
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
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
import java.util.HashSet;
import java.util.Set;


public final class CompactHashSetDemo {
	
	public static void main(String[] args) {
		// Handle arguments
		if (args.length != 1) {
			System.out.println("Usage: java CompactHashSetDemo regular|compact");
			System.exit(1);
		}
		Set<String> set;
		if (args[0].equals("regular"))
			set = new HashSet<String>();
		else if (args[0].equals("compact"))
			set = new CompactHashSet<String>(TRANSLATOR);
		else
			throw new IllegalArgumentException();
		
		// Keep adding entries to the set until death by OutOfMemoryError
		Runtime rt = Runtime.getRuntime();
		long lastPrint = 0;
		while (true) {
			String val = Integer.toString(set.size(), 36);
			set.add(val);
			if (System.currentTimeMillis() - lastPrint > 100) {
				System.out.printf("\rCount = %d, Memory = %.2f MB", set.size(), (rt.totalMemory() - rt.freeMemory()) / 1.0e6);
				lastPrint = System.currentTimeMillis();
			}
		}
	}
	
	
	// Serialization format: String s -> [s as bytes in UTF-8].
	private static final CompactSetTranslator<String> TRANSLATOR = new CompactSetTranslator<String>() {
		
		public byte[] serialize(String s) {
			try {
				return s.getBytes("UTF-8");
			} catch (UnsupportedEncodingException e) {
				throw new AssertionError(e);
			}
		}
		
		
		public boolean isInstance(Object obj) {
			return obj instanceof String;
		}
		
		
		public int getHash(String s) {
			int state = 0;
			for (int i = 0; i < s.length(); i++) {
				state += s.charAt(i);
				for (int j = 0; j < 4; j++) {
					state *= 0x7C824F73;
					state ^= 0x5C12FE83;
					state = Integer.rotateLeft(state, 5);
				}
			}
			return state;
		}
		
		
		public String deserialize(byte[] packed) {
			try {
				return new String(packed, "UTF-8");
			} catch (UnsupportedEncodingException e) {
				throw new AssertionError(e);
			}
		}
		
	};
	
}
