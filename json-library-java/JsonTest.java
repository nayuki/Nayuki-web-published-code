/* 
 * JSON library test
 * 
 * Copyright (c) 2015 Project Nayuki
 * http://www.nayuki.io/page/json-library-java
 * 
 * (MIT License)
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

package io.nayuki.json;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.junit.Test;


/**
 * A JUnit test suite for the {@link Json} class.
 */
public final class JsonTest {
	
	@Test public void testRoundTrip() {
		Object[] cases = {
			// Constants
			null,
			true,
			false,
			// Numbers
			0,
			1,
			-1,
			Long.MIN_VALUE,
			Long.MAX_VALUE,
			0.2,
			Math.PI,
			-7.8,
			0.0f,
			1e30f,
			BigInteger.ONE.shiftLeft(256),
			new BigDecimal("1.234567891011121314151617181920"),
			// Strings
			"",
			"a",
			"Hello world!",
			"\"",
			"\\",
			"\\\"",
			"a \b c d / \n\r\t \f \u007F",
		};
		for (Object cs : cases)
			testRoundTrip(cs);
		
		// Arrays
		List<Object> lst = new ArrayList<Object>();
		testRoundTrip(lst);
		lst.add(false);
		testRoundTrip(lst);
		lst.add(true);
		testRoundTrip(lst);
		lst.add(null);
		lst.add(5);
		lst.add(true);
		lst.add("xyz");
		testRoundTrip(lst);
		lst.add(0, new ArrayList<Object>());
		testRoundTrip(lst);
		
		// Objects
		Map<String,Object> map = new HashMap<String,Object>();
		testRoundTrip(map);
		map.put("a", -52);
		testRoundTrip(map);
		map.put("\b", lst);
		testRoundTrip(map);
		map.put(" ", new TreeMap<String,Object>());
		testRoundTrip(map);
	}
	
	
	@Test public void testWhitespaceEquivalence() {
		String[][] cases = {
			{"-0", " -0"},
			{"-1", "-1\t"},
			{"2", "2\n"},
			{"3", "\t 3\r\r"},
			{"4.555", "  4.555 "},
			{"6.7e-76", "\n6.7e-76\t"},
			{"null", "  null \n"},
			{"false", "false  "},
			{"true", "  true"},
			{"6.7e-76", "\n6.7e-76\t"},
			{"[]", "[  ]"},
			{"[null]", "[  null ] "},
			{"[8,9]", "[  8,  9 ]"},
			{"{}", "\t{\n\r}\t\t"},
			{"[{}]", " [  {  }] "},
			{"[[[]],[],[],{}]", "[[[  ]],  []  ,[],{} ]"},
			{"{\"a\":{}}", "{  \"a\" : {}}"},
			{"{\"bb\":[],\"c\":0}", "{  \"bb\" : [ ] , \"c\"  :0 }"},
			{"{\"d\":false,\"\\b\":[true]}", "  {\"d\"  :false ,\"\\b\": [ true]  } "},
		};
		for (String[] cs : cases)
			assertJsonEquals(Json.parse(cs[0]), Json.parse(cs[1]));
	}
	
	
	@Test public void testInvalid() {
		String[] cases = {
			"",
			"  ",
			"a",
			"false\"",
			"trues",
			"null1",
			"*",
			"00",
			"01",
			"08",
			"+0",
			"+2",
			"+2.3",
			"2.3.4",
			"2e2e2",
			"2e++0",
			"2e+-0",
			"2e--0",
			"2f",
			"0x10",
			"0 0",
			"0,0",
			"0 //",
			"\"",
			"\"\\",
			"\"\\\"",
			"\"\"\"",
			"\"\\a\"",
			"\"\\x00\"",
			"\"\\u+000\"",
			"\"\\u-000\"",
			"\"\u0000\"",
			"\"\n\"",
			"\"a\tb\"",
			"\"ab\rcd\"",
			"[",
			"]",
			"{",
			"}",
			"[}",
			"[,]",
			"[0,]",
			"[5 4]",
			"[5, 4,]",
			"[\"a\" \"b\"]",
			"[\"cc\" 3]",
			"[[]",
			"][",
			"[\"]",
			"{abc:0}",
			"{null:true}",
			"{\"a\":1,}",
			"{\"a\":1 \"b\":2}",
			"{}{}",
			"{{}}",
		};
		for (String cs : cases) {
			try {
				Json.parse(cs);
				fail();
			} catch (IllegalArgumentException e) {}  // Pass
		}
	}
	
	
	@SuppressWarnings("rawtypes")
	private static void assertJsonEquals(Object expect, Object actual) {
		if (expect == null || actual == null) {
			assertTrue(expect == null && actual == null);
			
		} else if (expect instanceof CharSequence || expect instanceof Boolean) {
			assertEquals(expect, actual);
			
		} else if (expect instanceof Number) {
			Number exp = (Number)expect;
			Number act = (Number)actual;
			if      (exp instanceof Byte   ) assertEquals(exp.byteValue  (), act.byteValue  ());
			else if (exp instanceof Short  ) assertEquals(exp.shortValue (), act.shortValue ());
			else if (exp instanceof Integer) assertEquals(exp.intValue   (), act.intValue   ());
			else if (exp instanceof Long   ) assertEquals(exp.longValue  (), act.longValue  ());
			else if (exp instanceof Float  ) assertEquals(exp.floatValue (), act.floatValue (), 0);
			else if (exp instanceof Double ) assertEquals(exp.doubleValue(), act.doubleValue(), 0);
			else if (exp instanceof BigInteger) assertEquals(exp, ((JsonNumber)act).bigIntegerValue());
			else if (exp instanceof BigDecimal) assertEquals(exp, ((JsonNumber)act).bigDecimalValue());
			else if (exp instanceof JsonNumber) assertEquals(exp, act);
			else throw new AssertionError("Not implemented");
			
		} else if (expect instanceof List) {
			List exp = (List)expect;
			List act = (List)actual;
			assertEquals(exp.size(), act.size());
			for (int i = 0; i < exp.size(); i++)
				assertJsonEquals(exp.get(i), act.get(i));
			
		} else if (expect instanceof Map) {
			Map exp = (Map)expect;
			Map act = (Map)actual;
			assertEquals(exp.size(), act.size());
			for (Object key : exp.keySet()) {
				assertTrue(key instanceof CharSequence);
				assertTrue(act.containsKey(key));
				assertJsonEquals(exp.get(key), act.get(key));
			}
			
		} else {
			fail("Unrecognized type");
		}
	}
	
	
	private static void testRoundTrip(Object root) {
		String enc = Json.serialize(root);
		Object dec = Json.parse(enc);
		assertJsonEquals(root, dec);
	}
	
}
