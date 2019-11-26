/* 
 * BitTorrent bencode encoder/decoder (Java)
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

import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;


public final class Bencode {
	
	/*---- Bencode serializer ----*/
	
	public static byte[] serialize(Object obj) {
		try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			serialize(obj, out);
			return out.toByteArray();
		} catch (IOException e) {
			throw new AssertionError(e);
		}
	}
	
	
	public static void serialize(Object obj, OutputStream out) throws IOException {
		if (obj instanceof Integer || obj instanceof Long || obj instanceof BigInteger)
			out.write(("i" + obj.toString() + "e").getBytes(StandardCharsets.UTF_8));
		else if (obj instanceof byte[] || obj instanceof String) {
			byte[] b = obj instanceof byte[] ? (byte[])obj : byteStringToArray((String)obj);
			out.write((b.length + ":").getBytes(StandardCharsets.UTF_8));
			out.write(b);
		} else if (obj instanceof List) {
			out.write('l');
			for (Object o : (List<?>)obj)
				serialize(o, out);
			out.write('e');
		} else if (obj instanceof SortedMap) {
			out.write('d');
			String prevKey = null;
			for (Map.Entry<?,?> entry : ((SortedMap<?,?>)obj).entrySet()) {
				Object keyObj = entry.getKey();
				if (!(keyObj instanceof String))
					throw new IllegalArgumentException("Map/dict key must be a byte string");
				String key = (String)keyObj;
				if (prevKey != null && key.compareTo(prevKey) <= 0)
					throw new IllegalArgumentException("Map/dict keys must be sorted");
				prevKey = key;
				serialize(key, out);
				serialize(entry.getValue(), out);
			}
			out.write('e');
		} else
			throw new IllegalArgumentException("Unsupported value type: " + obj.getClass().getName());
	}
	
	
	
	/*---- Bencode parser ----*/
	
	public static Object parse(InputStream in) throws IOException {
		return new Bencode(in).parseRoot();
	}
	
	
	private InputStream input;
	
	
	private Bencode(InputStream in) {
		this.input = in;
	}
	
	
	public Object parseRoot() throws IOException {
		Object result = parseValue(input.read());
		if (input.read() != -1)
			throw new IllegalArgumentException("Unexpected extra data");
		return result;
	}
	
	
	private Object parseValue(int leadByte) throws IOException {
		if (leadByte == -1)
			throw new EOFException();
		else if (leadByte == 'i')
			return parseInteger();
		else if ('0' <= leadByte && leadByte <= '9')
			return parseByteString(leadByte);
		else if (leadByte == 'l')
			return parseList();
		else if (leadByte == 'd')
			return parseDictionary();
		else
			throw new IllegalArgumentException("Unexpected value type");
	}
	
	
	private Long parseInteger() throws IOException {
		StringBuilder sb = new StringBuilder();
		while (true) {
			int b = input.read();
			if (b == -1)
				throw new EOFException();
			if (b == 'e')
				break;
			
			boolean ok;
			if (sb.length() == 0)
				ok = b == '-' || '0' <= b && b <= '9';
			else if (sb.length() == 1 && sb.charAt(0) == '-')
				ok = '1' <= b && b <= '9';
			else if (sb.length() == 1 && sb.charAt(0) == '0')
				ok = false;
			else  // sb starts with [123456789] or -[123456789]
				ok = '0' <= b && b <= '9';
			
			if (ok)
				sb.append((char)b);
			else
				throw new IllegalArgumentException("Unexpected integer character");
		}
		if (sb.length() == 0 || sb.length() == 1 && sb.charAt(0) == '-')
			throw new IllegalArgumentException("Invalid integer syntax");
		return Long.parseLong(sb.toString());
	}
	
	
	private String parseByteString(int leadByte) throws IOException {
		int length = parseNaturalNumber(leadByte);
		char[] result = new char[length];
		for (int i = 0; i < length; i++) {
			int b = input.read();
			if (b == -1)
				throw new EOFException();
			result[i] = (char)(b & 0xFF);
		}
		return new String(result);
	}
	
	
	private int parseNaturalNumber(int leadByte) throws IOException {
		StringBuilder sb = new StringBuilder();
		int b = leadByte;
		while (b != ':') {
			if (b == -1)
				throw new EOFException();
			else if ((sb.length() != 1 || sb.charAt(0) != '0') && '0' <= b && b <= '9')
				sb.append((char)b);
			else
				throw new IllegalArgumentException("Unexpected integer character");
			b = input.read();
		}
		if (sb.length() == 0)
			throw new IllegalArgumentException("Invalid integer syntax");
		return Integer.parseInt(sb.toString());
	}
	
	
	private Object parseList() throws IOException {
		List<Object> result = new ArrayList<>();
		while (true) {
			int b = input.read();
			if (b == 'e')
				break;
			result.add(parseValue(b));
		}
		return result;
	}
	
	
	private Object parseDictionary() throws IOException, EOFException {
		SortedMap<String,Object> result = new TreeMap<>();
		while (true) {
			int b = input.read();
			if (b == 'e')
				break;
			String key = parseByteString(b);
			if (!result.isEmpty() && key.compareTo(result.lastKey()) <= 0)
				throw new IllegalArgumentException("Misordered dictionary key");
			
			b = input.read();
			if (b == -1)
				throw new EOFException();
			result.put(key, parseValue(b));
		}
		return result;
	}
	
	
	
	/*---- Utility functions ----*/
	
	public static byte[] byteStringToArray(String str) {
		byte[] result = new byte[str.length()];
		for (int i = 0; i < str.length(); i++) {
			char c = str.charAt(i);
			if (c > 0xFF)
				throw new IllegalArgumentException("Character value outside of byte range");
			result[i] = (byte)c;
		}
		return result;
	}
	
	
	public static String arrayToByteString(byte[] arr) {
		char[] result = new char[arr.length];
		for (int i = 0; i < arr.length; i++)
			result[i] = (char)(arr[i] & 0xFF);
		return new String(result);
	}
	
}
