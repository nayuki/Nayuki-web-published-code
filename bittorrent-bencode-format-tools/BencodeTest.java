/* 
 * BitTorrent bencode coder test suite (Java)
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
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

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;
import org.junit.Assert;
import org.junit.Test;


public final class BencodeTest {
	
	/*---- Test the serialization ----*/
	
	@Test public void testSerializeInteger() {
		checkSerialize("i0e", 0);
		checkSerialize("i2e", 2L);
		checkSerialize("i-1e", BigInteger.valueOf(-1));
		checkSerialize("i3141592e", 3141592);
		checkSerialize("i-27182818284e", -27182818284L);
		checkSerialize("i1208925819614629174706176e", BigInteger.ONE.shiftLeft(80));
	}
	
	
	@Test public void testSerializeByteString() {
		checkSerialize("0:", new byte[]{});
		checkSerialize("1:\u0000", new byte[]{0});
		checkSerialize("2:\u0004\u0001", "\u0004\u0001");
		checkSerialize("3:ben", new byte[]{'b','e','n'});
		checkSerialize("10:ABCDE98765", "ABCDE98765");
	}
	
	
	@Test public void testSerializeList() {
		checkSerialize("le", Arrays.<Object>asList());
		checkSerialize("li4ee", Arrays.<Object>asList(4));
		checkSerialize("li7e5:Helloe", Arrays.<Object>asList(7, "Hello"));
		checkSerialize("li-88ele1:Xe", Arrays.<Object>asList(-88L, Arrays.<Object>asList(), "X"));
	}
	
	
	@Test public void testSerializeDictionary() {
		checkSerialize("de", new TreeMap<String,Object>());
		{
			SortedMap<String,Object> d = new TreeMap<>();
			d.put("", new ArrayList<Object>());
			checkSerialize("d0:lee", d);
		}
		{
			SortedMap<String,Object> d = new TreeMap<>();
			d.put("ZZ", 768L);
			d.put("AAA", "-14142");
			checkSerialize("d3:AAA6:-141422:ZZi768ee", d);
		}
		{
			SortedMap<String,Object> d = new TreeMap<>();
			d.put("\u0003", Arrays.<Object>asList());
			d.put("\u0008", new TreeMap<String,Object>());
			checkSerialize("d1:\u0003le1:\u0008dee", d);
		}
	}
	
	
	// Asserts that serializing the given bencode value equals the given byte string.
	private static void checkSerialize(String expected, Object obj) {
		byte[] bytes;
		try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Bencode.serialize(obj, out);
			bytes = out.toByteArray();
		} catch (IOException e) {
			throw new AssertionError(e);
		}
		String actual = Bencode.arrayToByteString(bytes);
		assertEquals(expected, actual);
	}
	
	
	
	/*---- Test the parsing ----*/
	
	@Test(expected=EOFException.class)
	public void testParseEmpty() throws IOException {
		tryParse("");
	}
	
	
	@Test public void testParseInvalid() {
		String[] CASES = {
			"i0ei1e",
			"1:a2:bc3:def",
			"le0:de",
		};
		parseExpectingException(CASES, IllegalArgumentException.class);
	}
	
	
	@Test public void testParseInteger() {
		checkParse(0L, "i0e");
		checkParse(11L, "i11e");
		checkParse(-749L, "i-749e");
		checkParse(9223372036854775807L, "i9223372036854775807e");
		checkParse(-9223372036854775808L, "i-9223372036854775808e");
	}
	
	
	@Test public void testParseIntegerEof() {
		String[] CASES = {
			"i",
			"i0",
			"i1248",
			"i-",
		};
		parseExpectingException(CASES, EOFException.class);
	}
	
	
	@Test public void testParseIntegerInvalid() {
		String[] CASES = {
			"ie",
			"i00",
			"i00e",
			"i019",
			"i0199e",
			"i-e",
			"i-0",
			"i-0e",
			"i-026e",
			"i-B",
			"iA",
			"iAe",
			"i01Ce",
			"i+5e",
			"i4.0e",
			"i9E9e",
		};
		parseExpectingException(CASES, IllegalArgumentException.class);
	}
	
	
	@Test public void testParseByteString() {
		checkParse("", "0:");
		checkParse("&", "1:&");
		checkParse("abcdefghijklm", "13:abcdefghijklm");
	}
	
	
	@Test public void testParseByteStringEof() {
		String[] CASES = {
			"0",
			"1",
			"843",
			"1:",
			"2:",
			"2:q",
			"d",
			"d3:$",
		};
		parseExpectingException(CASES, EOFException.class);
	}
	
	
	@Test public void testParseByteStringInvalid() {
		String[] CASES = {
			"00",
			"01",
			"00:",
			"01:",
			"-",
			"-0",
			"-1:",
		};
		parseExpectingException(CASES, IllegalArgumentException.class);
	}
	
	
	@Test public void testParseList() {
		checkParse(Arrays.<Object>asList(), "le");
		checkParse(Arrays.<Object>asList(-6L), "li-6ee");
		checkParse(Arrays.<Object>asList("00", 55L), "l2:00i55ee");
		checkParse(Arrays.<Object>asList(Arrays.<Object>asList(), Arrays.<Object>asList()), "llelee");
	}
	
	
	@Test public void testParseListEof() {
		String[] CASES = {
			"l",
			"li0e",
			"llleleel",
		};
		parseExpectingException(CASES, EOFException.class);
	}
	
	
	@Test public void testParseDictionary() {
		checkParse(new TreeMap<>(), "de");
		{
			SortedMap<String,Object> d = new TreeMap<>();
			d.put("-", 404L);
			checkParse(d, "d1:-i404ee");
		}
		{
			SortedMap<String,Object> d = new TreeMap<>();
			d.put("010", "101");
			d.put("yU", new LinkedList<>());
			checkParse(d, "d3:0103:1012:yUlee");
		}
	}
	
	
	@Test public void testParseDictionaryEof() {
		String[] CASES = {
			"d",
			"d1::",
			"d2:  0:",
			"d0:d",
		};
		parseExpectingException(CASES, EOFException.class);
	}
	
	
	@Test public void testParseDictionaryInvalid() {
		String[] CASES = {
			"d:",
			"d-",
			"d1:A0:1:A1:.",
			"d1:B0:1:A1:.",
			"d1:B0:1:D0:1:C0:",
			"d1:E0:1:F0:1:E0:",
			"d2:gg0:1:g0:",
		};
		parseExpectingException(CASES, IllegalArgumentException.class);
	}
	
	
	// Asserts that parsing each given test case will throw the given exception.
	private static void parseExpectingException(String[] testCases, Class<? extends Throwable> expect) {
		for (String cs : testCases) {
			try {
				tryParse(cs);
			} catch (Throwable e) {
				if (expect.isInstance(e))
					continue;  // Pass
			}
			Assert.fail();
		}
	}
	
	
	// Asserts that parsing the given byte string equals the given bencode value.
	private static void checkParse(Object expect, String str) {
		try {
			Object actual = tryParse(str);
			Assert.assertTrue(deepEquals(expect, actual));
		} catch (IOException e) {
			throw new AssertionError(e);
		}
	}
	
	
	// Parses the given byte string into a bencode value.
	private static Object tryParse(String str) throws IOException {
		byte[] bytes = Bencode.byteStringToArray(str);
		try (InputStream in = new ByteArrayInputStream(bytes)) {
			return Bencode.parse(in);
		}
	}
	
	
	// Tests whether the two given bencode values/structures are equal. This implementation is specialized
	// for this test suite and does not cover all possible Java types that could represent bencode values.
	private static boolean deepEquals(Object x, Object y) {
		if (x instanceof Long && y instanceof Long)
			return x.equals(y);
		
		else if (x instanceof String && y instanceof String)
			return x.equals(y);
		
		else if (x instanceof List && y instanceof List) {
			Iterator<?> xi = ((List<?>)x).iterator();
			Iterator<?> yi = ((List<?>)y).iterator();
			while (true) {
				if (xi.hasNext() != yi.hasNext())
					return false;
				if (!xi.hasNext())
					break;
				if (!deepEquals(xi.next(), yi.next()))
					return false;
			}
			return true;
			
		} else if (x instanceof SortedMap && y instanceof SortedMap) {
			Iterator<? extends Map.Entry<?,?>> xi = ((SortedMap<?,?>)x).entrySet().iterator();
			Iterator<? extends Map.Entry<?,?>> yi = ((SortedMap<?,?>)y).entrySet().iterator();
			while (true) {
				if (xi.hasNext() != yi.hasNext())
					return false;
				if (!xi.hasNext())
					break;
				Map.Entry<?,?> xe = xi.next();
				Map.Entry<?,?> ye = yi.next();
				Object xk = xe.getKey();
				Object yk = ye.getKey();
				if (!(xk instanceof String) || !(yk instanceof String))
					throw new IllegalArgumentException("Invalid type");
				if (!xk.equals(yk))
					return false;
				if (!deepEquals(xe.getValue(), ye.getValue()))
					return false;
			}
			return true;
			
		} else
			throw new IllegalArgumentException("Invalid type");
	}
	
	
	
	/*---- Test the utilities ----*/
	
	@Test public void testArrayToByteString() {
		assertEquals("", Bencode.arrayToByteString(new byte[]{}));
		assertEquals("\n", Bencode.arrayToByteString(new byte[]{10}));
		assertEquals("CoDe", Bencode.arrayToByteString(new byte[]{'C','o','D','e'}));
		assertEquals("\u00FF\u0080\u007F", Bencode.arrayToByteString(new byte[]{-1,-128,127}));
	}
	
	
	@Test public void testByteStringToArray() {
		assertArrayEquals(new byte[]{}, Bencode.byteStringToArray(""));
		assertArrayEquals(new byte[]{10}, Bencode.byteStringToArray("\n"));
		assertArrayEquals(new byte[]{'C','o','D','e'}, Bencode.byteStringToArray("CoDe"));
		assertArrayEquals(new byte[]{-1,-128,127}, Bencode.byteStringToArray("\u00FF\u0080\u007F"));
	}
	
	
	@Test public void testByteStringToArrayInvalid() {
		String[] CASES = {
			"\u0100",
			"\uFFFF",
			"\uD800\uDC00",
			"abc\u0123def",
		};
		for (String cs : CASES) {
			try {
				Bencode.byteStringToArray(cs);
				Assert.fail();
			} catch (IllegalArgumentException e) {}  // Pass
		}
	}
	
}
