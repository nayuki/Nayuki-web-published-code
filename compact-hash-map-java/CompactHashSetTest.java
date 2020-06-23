/* 
 * Compact hash set test
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Random;
import java.util.Set;
import org.junit.Test;


public final class CompactHashSetTest {
	
	/* Test cases */
	
	@Test public void testAdd() {
		CompactHashSet<String> set = new CompactHashSet<>(TRANSLATOR);
		assertTrue(set.add("a"));
		assertTrue(set.add("b"));
		assertTrue(set.add("c"));
		assertFalse(set.add("a"));
		assertTrue(set.add("d"));
		assertFalse(set.add("d"));
		set.checkStructure();
		assertTrue(set.add("e"));
		assertFalse(set.add("a"));
		assertTrue(set.add("f"));
		assertTrue(set.add("g"));
		assertFalse(set.add("b"));
		assertTrue(set.add("h"));
		assertFalse(set.add("e"));
		set.checkStructure();
	}
	
	
	@Test public void testSize() {
		CompactHashSet<String> set = new CompactHashSet<>(TRANSLATOR);
		set.checkStructure();
		assertEquals(0, set.size());
		set.add("xy");
		assertEquals(1, set.size());
		set.add("xyz");
		assertEquals(2, set.size());
		set.add("xy");
		assertEquals(2, set.size());
		set.add("a");
		set.add("b");
		set.add("c");
		assertEquals(5, set.size());
		set.checkStructure();
	}
	
	
	@Test public void testMediumSimple() {
		Set<String> set = new CompactHashSet<>(TRANSLATOR);
		for (int i = 0; i < 10000; i++) {
			assertTrue(set.add(Integer.toString(i, 2)));
			assertEquals(i + 1, set.size());
			int j = rand.nextInt(20000) - 5000;
			assertTrue(set.contains(Integer.toString(j, 2)) == (j >= 0 && j <= i));
		}
	}
	
	
	@Test public void testMediumSeesaw() {
		Set<String> set0 = new HashSet<>();
		CompactHashSet<String> set1 = new CompactHashSet<>(TRANSLATOR);
		for (int i = 0; i < 30; i++) {
			// Generate random data
			String[] objs = new String[rand.nextInt(30000)];
			for (int j = 0; j < objs.length; j++)
				objs[j] = Integer.toString(rand.nextInt(100000), 36);  // Can produce duplicates
			
			// Do all insertions
			for (String obj : objs) {
				assertTrue(set0.add(obj) == set1.add(obj));
				String query = Integer.toString(rand.nextInt(100000), 36);
				assertTrue(set0.contains(query) == set1.contains(query));
				if (rand.nextDouble() < 0.001)
					set1.checkStructure();
			}
			assertEquals(set0.size(), set1.size());  // May be less than objs.length due to duplicate objects
			
			// Do all removals
			for (String obj : objs) {
				assertTrue(set0.remove(obj) == set1.remove(obj));
				String query = Integer.toString(rand.nextInt(100000), 36);
				assertTrue(set0.contains(query) == set1.contains(query));
				if (rand.nextDouble() < 0.001)
					set1.checkStructure();
			}
			assertEquals(0, set0.size());
			assertEquals(0, set1.size());
		}
	}
	
	
	@Test public void testLargeRandomly() {
		Set<String> set0 = new HashSet<>();
		CompactHashSet<String> set1 = new CompactHashSet<>(TRANSLATOR);
		for (int i = 0; i < 1000000; i++) {
			String obj = Integer.toString(rand.nextInt(100000), 36);
			int op = rand.nextInt(10);
			if (op < 5)
				assertTrue(set0.add(obj) == set1.add(obj));
			else
				assertTrue(set0.remove(obj) == set1.remove(obj));
			assertEquals(set0.size(), set1.size());
			String query = Integer.toString(rand.nextInt(100000), 36);
			assertTrue(set0.contains(query) == set1.contains(query));
			if (rand.nextDouble() < 0.0001)
				set1.checkStructure();
		}
	}
	
	
	@Test public void testIteratorDump() {
		for (int i = 0; i < 100; i++) {
			// Generate random data
			int n = rand.nextInt(30000);
			String[] objs = new String[n];
			for (int j = 0; j < n; j++)
				objs[j] = Integer.toString(rand.nextInt(100000), 36);  // Can produce duplicates
			
			// Do insertions and removals
			Set<String> set0 = new HashSet<>();
			CompactHashSet<String> set1 = new CompactHashSet<>(TRANSLATOR);
			for (int j = 0; j < n / 2; j++) {
				set0.add(objs[j]);
				set1.add(objs[j]);
			}
			for (int j = n / 2; j < n; j++) {
				set0.remove(objs[j]);
				set1.remove(objs[j]);
			}
			set1.checkStructure();
			
			// Test the iterator
			for (String obj : set1)
				assertTrue(set0.remove(obj));
			assertEquals(0, set0.size());
		}
	}
	
	
	@Test public void testIteratorRemove() {
		for (int i = 0; i < 100; i++) {
			// Generate random data
			int n = rand.nextInt(30000);
			String[] objs = new String[n];
			for (int j = 0; j < n; j++)
				objs[j] = Integer.toString(rand.nextInt(100000), 36);  // Can produce duplicates
			
			// Do insertions and removals
			Set<String> set0 = new HashSet<>();
			CompactHashSet<String> set1 = new CompactHashSet<>(TRANSLATOR);
			for (int j = 0; j < n / 2; j++) {
				set0.add(objs[j]);
				set1.add(objs[j]);
			}
			for (int j = n / 2; j < n; j++) {
				set0.remove(objs[j]);
				set1.remove(objs[j]);
			}
			set1.checkStructure();
			
			// Do iterator removals and map entry modifications
			double deleteProb = rand.nextDouble();
			for (Iterator<String> iter = set1.iterator(); iter.hasNext(); ) {
				String obj = iter.next();
				if (rand.nextDouble() < deleteProb) {
					iter.remove();
					set0.remove(obj);
				}
			}
			set1.checkStructure();
			assertEquals(set0.size(), set1.size());
			
			// Check remaining contents for sameness
			for (String obj : set1)
				assertTrue(set0.remove(obj));
			assertEquals(0, set0.size());
		}
	}
	
	
	/* Utilities */
	
	private static Random rand = new Random();
	
	
	// Serialization format: String s -> [s as bytes in UTF-8].
	private static final CompactSetTranslator<String> TRANSLATOR = new CompactSetTranslator<String>() {
		
		public byte[] serialize(String s) {
			return s.getBytes(StandardCharsets.UTF_8);
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
			return new String(packed, StandardCharsets.UTF_8);
		}
		
	};
	
}
