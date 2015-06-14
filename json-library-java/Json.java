/* 
 * JSON library
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;


/**
 * Provides static methods to convert between Java objects and JSON text,
 * and also to query JSON data structures.
 * <p>The types/values correspond as follows:</p>
 * <table>
 * <thead><tr><th>JSON</th><th>Java</th></tr></thead>
 * <tbody>
 * <tr><td>{@code null}</td><td>{@code null}</td></tr>
 * <tr><td>{@code false}</td><td>{@code java.lang.Boolean.FALSE}</td></tr>
 * <tr><td>{@code true}</td><td>{@code java.lang.Boolean.TRUE}</td></tr>
 * <tr><td>{@code 1.23}</td><td>{@code java.lang.Number} / {@code io.nayuki.json.JsonNumber}</td></tr>
 * <tr><td>{@code "abc"}</td><td>{@code java.lang.String} / {@code java.lang.CharSequence}</td></tr>
 * <tr><td>{@code [...]}</td><td>{@code java.util.List<Object>}</td></tr>
 * <tr><td><code>{...}</code></td><td>{@code java.util.Map<String,Object>}</td></tr>
 * </tbody>
 * </table>
 * <p>See caveats in {@link #serialize serialize()} and {@link #parse parse()}.</p>
 */
public final class Json {
	
	/*---- Serializer from Java objects to JSON ----*/
	
	/**
	 * Serializes the specified Java object / tree of objects into a JSON text string.
	 * <p>There are a number of restrictions on the input object/tree:</p>
	 * <ul>
	 *   <li>Every object in the tree must be either {@code null}, {@code Boolean}, {@code Number},
	 *   {@code String}/{@code CharSequence}, {@code List}, or {@code Map}. All other types are illegal.</li>
	 *   <li>Double/Float values must be finite, not infinity or NaN.</li>
	 *   <li>User-defined Number objects must produce strings that satisfy the JSON number syntax
	 *   (e.g. a fraction string like 1/2 is disallowed).</li>
	 *   <li>No object can implement more than one of these interfaces:
	 *   {@code CharSequence}, {@code List}, {@code Map}.</li>
	 * </ul>
	 * <p>Note that all Unicode strings can be encoded to JSON. This includes things like embedded nulls (U+0000),
	 * as well as characters outside the Basic Multilingual Plane (over U+FFFF).</p>
	 * <p>The returned string is pure ASCII with no control characters, i.e. all characters
	 * are in the range [0x20, 0x7E]. This means that all ASCII control characters and
	 * above-ASCII Unicode characters are escaped, and there are no tabs or line breaks
	 * in the output string.</p>
	 * @param obj the object/tree to serialize to JSON (can be {@code null})
	 * @return a JSON text string (not {@code null})
	 * @throws IllegalArgumentException if any of the restrictions are violated
	 */
	public static String serialize(Object obj) {
		StringBuilder sb = new StringBuilder();
		toJson(obj, sb);
		return sb.toString();
	}
	
	
	// Serializes the given object/tree as JSON to the given string buffer.
	@SuppressWarnings("rawtypes")
	private static void toJson(Object obj, StringBuilder sb) {
		// Recursive depth-first traversal
		if (obj == null || obj instanceof Boolean) {
			sb.append(String.valueOf(obj));
			
		} else if (obj instanceof Number) {
			if (obj instanceof Float || obj instanceof Double) {
				double x = ((Number)obj).doubleValue();
				if (Double.isInfinite(x) || Double.isNaN(x))
					throw new IllegalArgumentException("Cannot serialize infinite/NaN floating-point value");
			}
			String temp = obj.toString();
			if (!JsonNumber.SYNTAX.matcher(temp).matches())
				throw new IllegalArgumentException("Invalid string serialization of number: " + temp);
			sb.append(obj.toString());
			
		} else if (obj instanceof CharSequence) {
			if (obj instanceof List || obj instanceof Map)
				throw new IllegalArgumentException("Ambiguous object is both charseq and list/map");
			CharSequence str = (CharSequence)obj;
			sb.append('"');
			for (int i = 0; i < str.length(); i++) {
				char c = str.charAt(i);
				switch (c) {
					case '\b':  sb.append("\\b" );  break;
					case '\f':  sb.append("\\f" );  break;
					case '\n':  sb.append("\\n" );  break;
					case '\r':  sb.append("\\r" );  break;
					case '\t':  sb.append("\\t" );  break;
					case '"' :  sb.append("\\\"");  break;
					case '\\':  sb.append("\\\\");  break;
					default:
						if (c >= 0x20 && c < 0x7F)
							sb.append(c);
						else
							sb.append("\\u").append(String.format("%04X", (int)c));
						break;
				}
			}
			sb.append('"');
			
		} else if (obj instanceof List) {
			if (obj instanceof Map)
				throw new IllegalArgumentException("Ambiguous object is both list and map");
			sb.append('[');
			boolean head = true;
			for (Object sub : (List)obj) {
				if (head) head = false;
				else sb.append(", ");
				toJson(sub, sb);
			}
			sb.append(']');
			
		} else if (obj instanceof Map) {
			sb.append('{');
			boolean head = true;
			Map map = (Map)obj;
			for (Object key : map.keySet()) {
				if (!(key instanceof CharSequence))
					throw new IllegalArgumentException("Map key must be a String/CharSequence object");
				if (head) head = false;
				else sb.append(", ");
				toJson(key, sb);
				sb.append(": ");
				toJson(map.get(key), sb);
			}
			sb.append('}');
			
		} else {
			throw new IllegalArgumentException("Unrecognized value: " + obj.getClass() + " " + obj.toString());
		}
	}
	
	
	
	/*---- Parser from JSON to Java objects ----*/
	
	/**
	 * Parses the specified JSON text into a Java object / tree of objects. Notes:
	 * <ul>
	 *   <li>The user is responsible for performing {@code instanceof} tests and
	 *   class casting, because most methods return a generic {@code Object}.</li>
	 *   <li>All numbers are parsed into {@code JsonNumber} objects. The user needs
	 *   to call {@code intValue()}, {@code doubleValue()}, etc. as appropriate.</li>
	 *   <li>All JSON objects (<code>{...}</code>) are parsed into {@code SortedMap<String,Object>} objects.
	 *   This allows the user to iterate over keys in sorted order. Furthermore, the map's {@code get()}
	 *   method is customized so that if a given key is not found, it will throw an {@code IllegalArgumentException}
	 *   - this differs from how standard Java map implementations return {@code null} in this situation.
	 *   This safety feature prevents the user from confusing a non-existent key from a key that is truly
	 *   mapped to a {@code null} value, both of which are expressible distinctly in JSON.</li>
	 *   <li>The JSON text must have exactly one root object, nothing afterward (except whitespace).
	 *   For example, these JSON strings are considered invalid: "[0,0] []", "1 2 3".</li>
	 * </ul>
	 * @param str the JSON text string (not {@code null})
	 * @return the object/tree (can be {@code null}) corresponding to the JSON data
	 * @throws IllegalArgumentException if the JSON text fails to conform to
	 * the standard syntax in any way or an object has a duplicate key
	 */
	public static Object parse(String str) {
		StringStream ss = new StringStream(str);
		Object result = parseGeneral(ss);
		if (result instanceof SpecialToken)
			throw new IllegalArgumentException("Malformed JSON");
		if (parseGeneral(ss) != SpecialToken.EOF)
			throw new IllegalArgumentException("Malformed JSON");
		return result;
	}
	
	
	// Parses the next token or object starting at the current string position.
	private static Object parseGeneral(StringStream ss) {
		ss.skipWhitespace();
		ss.mark();
		int c = ss.nextChar();
		if (c == -1)
			return SpecialToken.EOF;
		
		switch (c) {
			case '{':
				return parseObject(ss);
			case '[':
				return parseArray(ss);
			case '"':
				return parseString(ss);
			case 'f':
			case 'n':
			case 't':
				return parseConstant(ss);
			case ',':
				return SpecialToken.COMMA;
			case ']':
				return SpecialToken.RIGHT_BRACKET;
			case '}':
				return SpecialToken.RIGHT_BRACE;
			default:
				if (c >= '0' && c <= '9' || c == '-')
					return parseNumber(ss);
				else
					throw new IllegalArgumentException("Malformed JSON");
		}
	}
	
	
	// Method call starts immediately after '{' and ends immediately after '}'. Mark unnecessary. Result is not null.
	private static SortedMap<String,Object> parseObject(StringStream ss) {
		SortedMap<String,Object> result = new SafeTreeMap<String,Object>();
		boolean head = true;
		while (true) {
			Object key = parseGeneral(ss);
			if (key == SpecialToken.RIGHT_BRACE)
				break;
			if (head)
				head = false;
			else {
				if (key != SpecialToken.COMMA)
					throw new IllegalArgumentException("Malformed JSON");
				key = parseGeneral(ss);
			}
			if (!(key instanceof String))
				throw new IllegalArgumentException("Malformed JSON");
			ss.skipWhitespace();
			if (ss.nextChar() != ':')
				throw new IllegalArgumentException("Malformed JSON");
			Object value = parseGeneral(ss);
			if (value instanceof SpecialToken)
				throw new IllegalArgumentException("Malformed JSON");
			if (result.containsKey(key))
				throw new IllegalArgumentException("JSON object contains duplicate key");
			result.put((String)key, value);
		}
		return result;
	}
	
	
	// Method call starts immediately after '[' and ends immediately after ']'. Mark unnecessary. Result is not null.
	private static List<Object> parseArray(StringStream ss) {
		List<Object> result = new ArrayList<Object>();
		boolean head = true;
		while (true) {
			Object obj = parseGeneral(ss);
			if (obj == SpecialToken.RIGHT_BRACKET)
				break;
			if (head)
				head = false;
			else {
				if (obj != SpecialToken.COMMA)
					throw new IllegalArgumentException("Malformed JSON");
				obj = parseGeneral(ss);
			}
			if (obj instanceof SpecialToken)
				throw new IllegalArgumentException("Malformed JSON");
			result.add(obj);
		}
		return result;
	}
	
	
	// The method call starts immediately after '"' and ends immediately after the matching '"'. Mark unnecessary. Result is not null.
	private static String parseString(StringStream ss) {
		StringBuilder sb = new StringBuilder();
		outer:
		while (true) {
			int c = ss.nextChar();
			switch (c) {
				case -1:
					throw new IllegalArgumentException("Malformed JSON");
				case '"':
					break outer;
				case '\\':
					c = ss.nextChar();
					switch (c) {
						case -1:
							throw new IllegalArgumentException("Malformed JSON");
						case '\\':
						case '/':
						case '"':
							sb.append((char)c);
							break;
						case 'b':  sb.append('\b');  break;
						case 'f':  sb.append('\f');  break;
						case 'n':  sb.append('\n');  break;
						case 'r':  sb.append('\r');  break;
						case 't':  sb.append('\t');  break;
						case 'u':
							int w = ss.nextChar();
							int x = ss.nextChar();
							int y = ss.nextChar();
							int z = ss.nextChar();
							if (z == -1 || w == '+' || w == '-')
								throw new IllegalArgumentException("Malformed JSON");
							String hex = "" + (char)w + (char)x + (char)y + (char)z;
							sb.append((char)Integer.parseInt(hex, 16));
							break;
						default:
							throw new IllegalArgumentException("Malformed JSON");
					}
					break;
				default:
					if (c < 0x20)  // Control character
						throw new IllegalArgumentException("Malformed JSON");
					else
						sb.append((char)c);
					break;
			}
		}
		return sb.toString();
	}
	
	
	// The method call starts immediately after leading character and ends immediately after trailing character. Mark must be at leading character. Result may be null.
	private static Boolean parseConstant(StringStream ss) {
		while (true) {
			int c = ss.nextChar();
			if (c == -1)
				break;
			else if (c < 'a' || c > 'z') {
				ss.previous();
				break;
			}
		}
		String val = ss.substring();
		if      (val.equals("null" )) return null;
		else if (val.equals("false")) return Boolean.FALSE;
		else if (val.equals("true" )) return Boolean.TRUE;
		else throw new IllegalArgumentException("Malformed JSON");
	}
	
	
	// The method call starts immediately after leading character and ends immediately after trailing character. Mark must be at leading character. Result is not null.
	private static JsonNumber parseNumber(StringStream ss) {
		while (true) {
			int c = ss.nextChar();
			if (c == -1)
				break;
			else if (!(c >= '0' && c <= '9' || c == '+' || c == '-' || c == '.' || c == 'e' || c == 'E')) {
				ss.previous();
				break;
			}
		}
		return new JsonNumber(ss.substring());
	}
	
	
	
	// A stateful character iterator that also supports dumping a substring.
	private static final class StringStream {
		
		private String string;
		private int index;
		private int start;
		
		
		public StringStream(String s) {
			if (s == null)
				throw new NullPointerException();
			string = s;
			index = 0;
			start = -1;
		}
		
		
		public int nextChar() {
			if (index >= string.length())
				return -1;
			else {
				char result = string.charAt(index);
				index++;
				return result;
			}
		}
		
		
		public void previous() {
			if (index >= 1)
				index--;
		}
		
		
		public void skipWhitespace() {
			while (index < string.length()) {
				char c = string.charAt(index);
				if (c != ' ' && c != '\n' && c != '\r' && c != '\t')
					break;
				index++;
			}
		}
		
		
		public void mark() {
			start = index;
		}
		
		
		public String substring() {
			if (start == -1)
				throw new IllegalStateException("Not marked");
			return string.substring(start, index);
		}
		
	}
	
	
	
	// Special non-data values that parseGeneral() can return.
	private enum SpecialToken {
		EOF, COMMA, RIGHT_BRACKET, RIGHT_BRACE
	}
	
	
	
	/*---- Convenience accessors for maps and lists ----*/
	
	/**
	 * Traverses the specified JSON object along the specified path through
	 * maps and lists, and returns the object at that location. The path is
	 * a (possibly empty) sequence of strings or integers.
	 * <p>For example, in this data structure:</p>
	 * <pre>data = {
	 *  "alpha": null,
	 *  "beta": [9, 88, 777],
	 *  "gamma": ["x", 3.21,
	 *    {
	 *      "y": 5,
	 *      "z": 6
	 *    }]
	 * }</pre>
	 * <p>The following queries produce these results:</p>
	 * <p>{@code getObject(data): Map[alpha=null, beta=List[9, 88, 777], gamma=List["x", 3.21, Map[y=5, z=6]]]}<br>
	 * {@code getObject(data, "alpha"): null}<br>
	 * {@code getObject(data, "beta"): List[9, 88, 777]}<br>
	 * {@code getObject(data, "beta", 0): 9}<br>
	 * {@code getObject(data, "beta", 1): 88}<br>
	 * {@code getObject(data, "beta", 2): 777}<br>
	 * {@code getObject(data, "beta", 3): IndexOutOfBoundsException}<br>
	 * {@code getObject(data, "charlie"): IllegalArgumentException (no such key)}<br>
	 * {@code getObject(data, "gamma"): List["x", 3.21, Map[y=5, z=6]]}<br>
	 * {@code getObject(data, "gamma", 0): "x"}<br>
	 * {@code getObject(data, "gamma", 1): 3.21}<br>
	 * {@code getObject(data, "gamma", 2): Map[y=5, z=6]}<br>
	 * {@code getObject(data, "gamma", 2, "y"): 5}<br>
	 * {@code getObject(data, "gamma", 2, "z"): 6}<br>
	 * {@code getObject(data, "gamma", "2"): IllegalArgumentException (map expected)}<br>
	 * {@code getObject(data, 0): IllegalArgumentException (list expected)}</p>
	 * @param root the JSON object to query
	 * @param path the sequence of strings and integers that expresses the query
	 * @return the object at the location (can be {@code null})
	 * @throws IllegalArgumentException if a map/list was expected but not found,
	 * or a map key was not found, or a path component is not a string/integer
	 * @throws IndexOutOfBoundsException if a list index is
	 * negative or greater/equal to the list length
	 * @throws NullPointerException if any argument or path component is {@code null}
	 * (except if the root is {@code null} and the path is zero-length)
	 */
	@SuppressWarnings("unchecked")
	public static Object getObject(Object root, Object... path) {
		Object node = root;
		for (Object key : path) {
			if (key instanceof String) {
				if (!(node instanceof Map))
					throw new IllegalArgumentException("Expected a map");
				Map<String,Object> map = (Map<String,Object>)node;
				if (!map.containsKey(key))
					throw new IllegalArgumentException("Map key not found: " + key);
				node = map.get(key);
			} else if (key instanceof Integer) {
				if (!(node instanceof List))
					throw new IllegalArgumentException("Expected a list");
				List<Object> list = (List<Object>)node;
				int index = (Integer)key;
				if (index < 0 || index >= list.size())
					throw new IndexOutOfBoundsException(key.toString());
				node = list.get(index);
			} else if (key == null) {
				throw new NullPointerException();
			} else {
				throw new IllegalArgumentException("Invalid path component: " + key);
			}
		}
		return node;
	}
	
	
	/**
	 * Traverses the specified JSON object along the specified path, and
	 * converts the located object to an {@code int} value to be returned.
	 * See the documentation of {@link #getObject getObject()} for detailed examples.
	 * @param root the JSON object to query
	 * @param path the sequence of strings and integers that expresses the query
	 * @return the {@code int} value at the location
	 * @throws IllegalArgumentException if a map/list was expected but not found,
	 * or a map key was not found, or a path component is not a string/integer
	 * @throws IndexOutOfBoundsException if a list index is
	 * negative or greater/equal to the list length
	 * @throws ClassCastException if the located object is not a {@code Number}
	 * @throws NullPointerException if any argument or path component
	 * or the located object is {@code null}
	 */
	public static int getInt(Object root, Object... path) {
		return ((Number)getObject(root, path)).intValue();
	}
	
	
	/**
	 * Traverses the specified JSON object along the specified path, and
	 * converts the located object to a {@code long} value to be returned.
	 * See the documentation of {@link #getObject getObject()} for detailed examples.
	 * @param root the JSON object to query
	 * @param path the sequence of strings and integers that expresses the query
	 * @return the {@code long} value at the location
	 * @throws IllegalArgumentException if a map/list was expected but not found,
	 * or a map key was not found, or a path component is not a string/integer
	 * @throws IndexOutOfBoundsException if a list index is
	 * negative or greater/equal to the list length
	 * @throws ClassCastException if the located object is not a {@code Number}
	 * @throws NullPointerException if any argument or path component
	 * or the located object is {@code null}
	 */
	public static long getLong(Object root, Object... path) {
		return ((Number)getObject(root, path)).longValue();
	}
	
	
	/**
	 * Traverses the specified JSON object along the specified path, and
	 * converts the located object to a {@code float} value to be returned.
	 * See the documentation of {@link #getObject getObject()} for detailed examples.
	 * @param root the JSON object to query
	 * @param path the sequence of strings and integers that expresses the query
	 * @return the {@code float} value at the location
	 * @throws IllegalArgumentException if a map/list was expected but not found,
	 * or a map key was not found, or a path component is not a string/integer
	 * @throws IndexOutOfBoundsException if a list index is
	 * negative or greater/equal to the list length
	 * @throws ClassCastException if the located object is not a {@code Number}
	 * @throws NullPointerException if any argument or path component
	 * or the located object is {@code null}
	 */
	public static float getFloat(Object root, Object... path) {
		return ((Number)getObject(root, path)).floatValue();
	}
	
	
	/**
	 * Traverses the specified JSON object along the specified path, and
	 * converts the located object to a {@code double} value to be returned.
	 * See the documentation of {@link #getObject getObject()} for detailed examples.
	 * @param root the JSON object to query
	 * @param path the sequence of strings and integers that expresses the query
	 * @return the {@code double} value at the location
	 * @throws IllegalArgumentException if a map/list was expected but not found,
	 * or a map key was not found, or a path component is not a string/integer
	 * @throws IndexOutOfBoundsException if a list index is
	 * negative or greater/equal to the list length
	 * @throws ClassCastException if the located object is not a {@code Number}
	 * @throws NullPointerException if any argument or path component
	 * or the located object is {@code null}
	 */
	public static double getDouble(Object root, Object... path) {
		return ((Number)getObject(root, path)).doubleValue();
	}
	
	
	/**
	 * Traverses the specified JSON object along the specified path,
	 * and converts the located object to a string to be returned.
	 * See the documentation of {@link #getObject getObject()} for detailed examples.
	 * @param root the JSON object to query
	 * @param path the sequence of strings and integers that expresses the query
	 * @return the string object at the location (not {@code null})
	 * @throws IllegalArgumentException if a map/list was expected but not found,
	 * or a map key was not found, or a path component is not a string/integer
	 * @throws IndexOutOfBoundsException if a list index is
	 * negative or greater/equal to the list length
	 * @throws ClassCastException if the located object is not a {@code String}
	 * @throws NullPointerException if any argument or path component
	 * or the located object is {@code null}
	 */
	public static String getString(Object root, Object... path) {
		String result = (String)getObject(root, path);
		if (result == null)
			throw new NullPointerException();
		return result;
	}
	
	
	/**
	 * Traverses the specified JSON object along the specified path,
	 * and converts the located object to a list to be returned.
	 * See the documentation of {@link #getObject getObject()} for detailed examples.
	 * @param root the JSON object to query
	 * @param path the sequence of strings and integers that expresses the query
	 * @return the list object at the location (not {@code null})
	 * @throws IllegalArgumentException if a map/list was expected but not found,
	 * or a map key was not found, or a path component is not a string/integer
	 * @throws IndexOutOfBoundsException if a list index is
	 * negative or greater/equal to the list length
	 * @throws ClassCastException if the located object is not a {@code List}
	 * @throws NullPointerException if any argument or path component
	 * or the located object is {@code null}
	 */
	@SuppressWarnings("unchecked")
	public static List<Object> getList(Object root, Object... path) {
		List<Object> result = (List<Object>)getObject(root, path);
		if (result == null)
			throw new NullPointerException();
		return result;
	}
	
	
	/**
	 * Traverses the specified JSON object along the specified path,
	 * and converts the located object to a map to be returned.
	 * See the documentation of {@link #getObject getObject()} for detailed examples.
	 * @param root the JSON object to query
	 * @param path the sequence of strings and integers that expresses the query
	 * @return the map object at the location (not {@code null})
	 * @throws IllegalArgumentException if a map/list was expected but not found,
	 * or a map key was not found, or a path component is not a string/integer
	 * @throws IndexOutOfBoundsException if a list index is
	 * negative or greater/equal to the list length
	 * @throws ClassCastException if the located object is not a {@code Map}
	 * @throws NullPointerException if any argument or path component
	 * or the located object is {@code null}
	 */
	@SuppressWarnings("unchecked")
	public static Map<String,Object> getMap(Object root, Object... path) {
		Map<String,Object> result = (Map<String,Object>)getObject(root, path);
		if (result == null)
			throw new NullPointerException();
		return result;
	}
	
	
	
	/*---- Miscellaneous ----*/
	
	// Not instantiable
	private Json() {}
	
	
	
	private static final class SafeTreeMap<K,V> extends TreeMap<K,V> {
		
		public SafeTreeMap() {
			super();
		}
		
		
		public V get(Object key) {
			if (!containsKey(key))
				throw new IllegalArgumentException("Key does not exist: " + key);
			else
				return super.get(key);
		}
		
	}
	
}
