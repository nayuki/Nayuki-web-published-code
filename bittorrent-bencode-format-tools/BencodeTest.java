/* 
 * BitTorrent bencode coder test suite (Java)
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

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import java.io.ByteArrayInputStream;
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
		testSerialize("i0e", 0);
		testSerialize("i2e", 2L);
		testSerialize("i-1e", BigInteger.valueOf(-1));
		testSerialize("i3141592e", 3141592);
		testSerialize("i-27182818284e", -27182818284L);
		testSerialize("i1208925819614629174706176e", BigInteger.ONE.shiftLeft(80));
	}
	
	
	@Test public void testSerializeByteString() {
		testSerialize("0:", new byte[]{});
		testSerialize("1:\u0000", new byte[]{0});
		testSerialize("2:\u0004\u0001", "\u0004\u0001");
		testSerialize("3:ben", new byte[]{'b','e','n'});
		testSerialize("10:ABCDE98765", "ABCDE98765");
	}
	
	
	@Test public void testSerializeList() {
		testSerialize("le", Arrays.<Object>asList());
		testSerialize("li4ee", Arrays.<Object>asList(4));
		testSerialize("li7e5:Helloe", Arrays.<Object>asList(7, "Hello"));
		testSerialize("li-88ele1:Xe", Arrays.<Object>asList(-88L, Arrays.<Object>asList(), "X"));
	}
	
	
	@Test public void testSerializeDictionary() {
		testSerialize("de", new TreeMap<String,Object>());
		{
			SortedMap<String,Object> d = new TreeMap<>();
			d.put("", new ArrayList<Object>());
			testSerialize("d0:lee", d);
		}
		{
			SortedMap<String,Object> d = new TreeMap<>();
			d.put("ZZ", 768L);
			d.put("AAA", "-14142");
			testSerialize("d3:AAA6:-141422:ZZi768ee", d);
		}
	}
	
	
	private static void testSerialize(String expected, Object obj) {
		byte[] bytes = Bencode.serialize(obj);
		String actual = Bencode.arrayToByteString(bytes);
		assertEquals(expected, actual);
	}
	
	
	
	/*---- Test the parsing ----*/
	
	@Test public void testParseInteger() {
		testParse(0L, "i0e");
		testParse(11L, "i11e");
		testParse(-749L, "i-749e");
		testParse(9223372036854775807L, "i9223372036854775807e");
		testParse(-9223372036854775808L, "i-9223372036854775808e");
	}
	
	
	@Test public void testParseIntegerEof() throws IOException {
		String[] CASES = {
			"i",
			"i0",
			"i1248",
			"i-",
		};
		for (String cs : CASES) {
			try {
				testParseInvalid(cs);
				Assert.fail();
			} catch (EOFException e) {}  // Pass
		}
	}
	
	
	@Test public void testParseIntegerInvalid() throws IOException {
		String[] CASES = {
			"ie",
			"i00e",
			"i0199e",
			"i-e",
			"i-0e",
			"i-026e",
			"iAe",
			"i01Ce",
			"i+5e",
			"i4.0e",
			"i9E9e",
		};
		for (String cs : CASES) {
			try {
				testParseInvalid(cs);
				Assert.fail();
			} catch (IllegalArgumentException e) {}  // Pass
		}
	}
	
	
	@Test public void testParseByteString() {
		testParse("", "0:");
		testParse("&", "1:&");
		testParse("abcdefghijklm", "13:abcdefghijklm");
	}
	
	
	@Test public void testParseByteStringEof() throws IOException {
		String[] CASES = {
			"0",
			"1",
			"843",
			"1:",
			"2:",
			"2:q",
			"d",
		};
		for (String cs : CASES) {
			try {
				testParseInvalid(cs);
				Assert.fail();
			} catch (EOFException e) {}  // Pass
		}
	}
	
	
	@Test public void testParseByteStringInvalid() throws IOException {
		String[] CASES = {
			"00",
			"01",
			"00:",
			"01:",
			"-",
			"-0",
			"-1:",
		};
		for (String cs : CASES) {
			try {
				testParseInvalid(cs);
				Assert.fail();
			} catch (IllegalArgumentException e) {}  // Pass
		}
	}
	
	
	@Test public void testParseList() {
		testParse(Arrays.<Object>asList(), "le");
		testParse(Arrays.<Object>asList(-6L), "li-6ee");
		testParse(Arrays.<Object>asList("00", 55L), "l2:00i55ee");
		testParse(Arrays.<Object>asList(Arrays.<Object>asList(), Arrays.<Object>asList()), "llelee");
	}
	
	
	@Test(expected=EOFException.class)
	public void testParseListEof0() throws IOException {
		testParseInvalid("l");
	}
	
	@Test(expected=EOFException.class)
	public void testParseListEof1() throws IOException {
		testParseInvalid("li0e");
	}
	
	@Test(expected=EOFException.class)
	public void testParseListEof2() throws IOException {
		testParseInvalid("llleleel");
	}
	
	
	@Test public void testParseDictionary() {
		testParse(new TreeMap<>(), "de");
		{
			SortedMap<String,Object> d = new TreeMap<>();
			d.put("-", 404L);
			testParse(d, "d1:-i404ee");
		}
		{
			SortedMap<String,Object> d = new TreeMap<>();
			d.put("010", "101");
			d.put("yU", new LinkedList<>());
			testParse(d, "d3:0103:1012:yUlee");
		}
	}
	
	
	@Test public void testParseDictionaryEof() throws IOException {
		String[] CASES = {
			"d",
			"d1::",
			"d2:  0:",
			"d0:d",
		};
		for (String cs : CASES) {
			try {
				testParseInvalid(cs);
				Assert.fail();
			} catch (EOFException e) {}  // Pass
		}
	}
	
	
	@Test public void testParseDictionaryInvalid() throws IOException {
		String[] CASES = {
			"d1:A0:1:A1:.",
			"d1:B0:1:A1:.",
			"d1:B0:1:D0:1:C0:",
			"d1:E0:1:F0:1:E0:",
			"d2:gg0:1:g0:",
		};
		for (String cs : CASES) {
			try {
				testParseInvalid(cs);
				Assert.fail();
			} catch (IllegalArgumentException e) {}  // Pass
		}
	}
	
	
	private static void testParse(Object expect, String str) {
		byte[] bytes = Bencode.byteStringToArray(str);
		try (InputStream in = new ByteArrayInputStream(bytes)) {
			Object actual = Bencode.parse(in);
			Assert.assertTrue(deepEquals(expect, actual));
		} catch (IOException e) {
			throw new AssertionError(e);
		}
	}
	
	
	private static void testParseInvalid(String str) throws IOException {
		byte[] bytes = Bencode.byteStringToArray(str);
		try (InputStream in = new ByteArrayInputStream(bytes)) {
			Bencode.parse(in);
		}
	}
	
	
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
