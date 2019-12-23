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


/**
 * Converts between bencode data structures and byte sequences.
 * <p>Bencode supports four types of values:</p>
 * <ul>
 *   <li>Integer, which is mapped to Java {@link Integer} or {@link Long} or {@link BigInteger}.</li>
 *   <li>Byte string, which is mapped to Java {@code byte[]} or {@link String}
 *     (where every character is in the range [U+00, U+FF] to represent a byte).</li>
 *   <li>List, which is mapped to Java {@link List} (e.g. {@link ArrayList}),
 *     such that every element is a bencode value.</li>
 *   <li>Dictionary, which is mapped to Java {@link SortedMap} (e.g. {@link TreeMap}), such that every key is a
 *     {@link String} containing character values in the range [U+00, U+FF] and every value is a bencode value.</li>
 * </ul>
 * <p>Note that {@link String} objects are often used to represent byte sequences because
 * strings can be hashed and compared easily, whereas {@code byte[]} objects cannot.</p>
 */
public final class Bencode {
	
	/*---- Bencode serializer ----*/
	
	/**
	 * Serializes the specified bencode value into bytes and writes them to the specified output stream.
	 * The allowed types of the value and its children are described in this class's overview comment.
	 * @param obj the bencode value to serialize
	 * @param out the output stream to write to
	 * @throws IllegalArgumentException if the value or any child or any dictionary key has
	 * an unsupported type, or any dictionary presents its keys in non-ascending order
	 * @throws IOException if an I/O exception occurred
	 */
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
	
	/**
	 * Parses bytes from the specified input stream and returns the bencode value represented by the bytes.
	 * The input data must have exactly one root object and then the stream must immediately end.
	 * <p>Note that the returned value maps bencode integer to Java {@link Long}, and maps
	 * bencode byte string to Java {@link String} (where every character is in the range [U+00, U+FF]).
	 * Also note that even though bencode supports arbitrarily large integer values, this library
	 * doesn't parse them into Java {@link BigInteger} objects because they are rarely needed.</p>
	 * @param in the input stream to read from
	 * @return one bencode value, which may contain children
	 * @throws IllegalArgumentException if the input data does not conform to bencode's serialization syntax rules
	 * @throws EOFException if more data was expected but the input stream ended
	 * @throws IOException if an I/O exception occurred
	 */
	public static Object parse(InputStream in) throws IOException {
		return new Bencode(in).parseRoot();
	}
	
	
	private InputStream input;
	
	
	private Bencode(InputStream in) {
		this.input = in;
	}
	
	
	private Object parseRoot() throws IOException {
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
	
	/**
	 * Returns a new byte array where each element is the numeric value of the corresponding character
	 * in the specified string. The string must have all characters in the range [U+00, U+FF].
	 * This uses the verbatim encoding, and is not a proper Unicode conversion!
	 * @param str the string to convert, where all characters must be in the range [U+00, U+FF]
	 * @return a new byte array representing the converted string
	 * @throws IllegalArgumentException if any character in the string exceeds U+FF
	 */
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
	
	
	/**
	 * Returns a string where each character is numerically equal
	 * to the corresponding element in the specified byte array.
	 * This uses the verbatim encoding, and is not a proper Unicode conversion!
	 * @param arr the byte array to convert
	 * @return a string representing the converted byte array
	 */
	public static String arrayToByteString(byte[] arr) {
		char[] result = new char[arr.length];
		for (int i = 0; i < arr.length; i++)
			result[i] = (char)(arr[i] & 0xFF);
		return new String(result);
	}
	
}
