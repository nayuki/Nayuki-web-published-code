/* 
 * Knuth-Morris-Pratt string matcher test (Java)
 * 
 * Copyright (c) 2014 Nayuki Minase
 * http://nayuki.eigenstate.org/page/knuth-morris-pratt-string-matching
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

import static org.junit.Assert.assertEquals;
import java.util.Random;
import org.junit.Test;


public class KmpStringMatcherTest {
	
	/* Test suite */
	
	@Test public void testEmpty() {
		test("", "");
		test("", "ab");
	}
	
	
	@Test public void testOneChar() {
		test("a", "a");
		test("a", "b");
	}
	
	
	@Test public void testRepeat() {
		test("aaa", "aaaaa");
		test("aaa", "abaaba");
		test("abab", "abacababc");
		test("abab", "babacaba");
	}
	
	
	@Test public void testPartialRepeat() {
		test("aaacaaaaac", "aaacacaacaaacaaaacaaaaac");
		test("ababcababdabababcababdaba", "ababcababdabababcababdaba");
	}
	
	
	@Test public void testRandomly() {
		for (int i = 0; i < 1000; i++) {
			String pattern = randomPattern();
			KmpStringMatcher mat = new KmpStringMatcher(pattern);
			mat.checkStructure();
			for (int j = 0; j < 100; j++)
				test(pattern, mat, randomText(pattern));
		}
	}
	
	
	/* Helper functions */
	
	private static String randomPattern() {
		StringBuilder sb = new StringBuilder();
		int steps = random.nextInt(10) + 1;
		for (int i = 0; i < steps; i++) {
			if (sb.length() == 0 || random.nextBoolean()) {  // Add literal
				int len = random.nextInt(5) + 1;
				for (int j = 0; j < len; j++)
					sb.append(alphabet.charAt(random.nextInt(alphabet.length())));
			} else {  // Repeat prefix
				int len = random.nextInt(sb.length()) + 1;
				int reps = random.nextInt(3) + 1;
				if (sb.length() + len * reps > 1000)
					break;
				for (int j = 0; j < reps; j++)
					sb.append(sb.substring(0, len));
			}
		}
		return sb.toString();
	}
	
	
	private static String randomText(String pattern) {
		StringBuilder sb = new StringBuilder();
		int steps = random.nextInt(100);
		for (int i = 0; i < steps && sb.length() < 10000; i++) {
			if (random.nextDouble() < 0.7) {  // Add prefix of pattern
				int len = random.nextInt(pattern.length()) + 1;
				sb.append(pattern.substring(0, len));
			} else {  // Add literal
				int len = random.nextInt(30) + 1;
				for (int j = 0; j < len; j++)
					sb.append(alphabet.charAt(random.nextInt(alphabet.length())));
			}
		}
		return sb.toString();
	}
	
	
	private static void test(String pattern, String text) {
		KmpStringMatcher mat = new KmpStringMatcher(pattern);
		mat.checkStructure();
		test(pattern, mat, text);
	}
	
	
	private static void test(String pattern, KmpStringMatcher mat, String text) {
		assertEquals(text.indexOf(pattern), mat.search(text));
	}
	
	
	private static Random random = new Random();
	private static String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	
}
