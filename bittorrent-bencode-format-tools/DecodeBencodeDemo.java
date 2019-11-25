/* 
 * BitTorrent bencode decoder demo (Java)
 * 
 * Copyright (c) 2019 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/bittorrent-bencode-format-tools
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

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;
import java.util.List;
import java.util.Map;
import java.util.SortedMap;


public final class DecodeBencodeDemo {
	
	public static void main(String[] args) throws IOException {
		if (!submain(args)) {
			System.err.println("java DecodeBencodeDemo Input.torrent");
			System.exit(1);
		}
	}
	
	
	private static boolean submain(String[] args) throws IOException {
		if (args.length != 1)
			return false;
		File file = new File(args[0]);
		if (!file.isFile())
			return false;
		
		Object obj;
		try (InputStream in = new BufferedInputStream(new FileInputStream(file))) {
			obj = Bencode.parse(in);
		}
		printBencodeItem(obj, 0);
		return true;
	}
	
	
	private static void printBencodeItem(Object obj, int depth) {
		if (obj instanceof Integer || obj instanceof Long || obj instanceof BigInteger) {
			System.out.println("Integer: " + obj);
		}
		else if (obj instanceof byte[] || obj instanceof String) {
			byte[] b = obj instanceof byte[] ? (byte[])obj : Bencode.byteStringToArray((String)obj);
			System.out.printf("Byte string (%d) ", b.length);
			try {
				System.out.println("(text): " + decodeUtf8(b));
			} catch (IllegalArgumentException e) {
				System.out.print("(binary): ");
				for (int i = 0; ; i++) {
					System.out.printf("%02X", b[i]);
					if (i == b.length - 1)
						break;
					System.out.print(" ");
					if (i == 30) {
						System.out.print("...");
						break;
					}
				}
				System.out.println();
			}
		}
		else if (obj instanceof List) {
			System.out.println("List:");
			List<?> list = (List<?>)obj;
			for (int i = 0; i < list.size(); i++) {
				printIndent(depth + 1);
				System.out.print(i + " = ");
				printBencodeItem(list.get(i), depth + 1);
			}
		}
		else if (obj instanceof SortedMap) {
			System.out.println("Dictionary:");
			SortedMap<?,?> map = (SortedMap<?,?>)obj;
			for (Map.Entry<?,?> entry : map.entrySet()) {
				printIndent(depth + 1);
				System.out.print(entry.getKey() + " = ");
				printBencodeItem(entry.getValue(), depth + 1);
			}
		}
		else
			throw new IllegalArgumentException("Unsupported item type: " + obj.getClass().getName());
	}
	
	
	private static String decodeUtf8(byte[] bytes) {
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < bytes.length; i++) {
			int lead = bytes[i] & 0xFF;
			if (lead < 0b1000_0000) {  // Single byte ASCII (0xxxxxxx)
				sb.append((char)lead);
				continue;
			}
			
			// Otherwise lead = 1xxxxxxx
			int ones = Integer.numberOfLeadingZeros(lead ^ 0xFF) - 24;
			if (ones < 2 || ones > 4)
				throw new IllegalArgumentException("Invalid leading byte");
			
			int c = lead & (0b0111_1111 >>> ones);
			for (int j = 1; j < ones; j++, i++) {
				if (i + 1 >= bytes.length)
					throw new IllegalArgumentException("Missing continuation bytes");
				int b = bytes[i + 1] & 0xFF;
				if ((b & 0b1100_0000) != 0b1000_0000)
					throw new IllegalArgumentException("Invalid continuation byte value");
				c = (c << 6) | (b & 0b0011_1111);
			}
			
			if (c >>> Math.max(ones * 5 - 4, 7) == 0)
				throw new IllegalArgumentException("Over-long UTF-8 sequence");
			else if (0xD800 <= c && c < 0xE000)
				throw new IllegalArgumentException("Invalid UTF-8 containing UTF-16 surrogate");
			else if (c < 0x10000)
				sb.append((char)c);
			else if (c < 0x110000) {
				sb.append((char)(0xD7C0 + (c >>> 10)));
				sb.append((char)(0xDC00 | (c & 0x3FF)));
			} else
				throw new IllegalArgumentException("UTF-8 code point out of range");
		}
		return sb.toString();
	}
	
	
	private static void printIndent(int depth) {
		for (int i = 0; i < depth; i++)
			System.out.print("    ");
	}
	
}
