/* 
 * Binary array set test (Java)
 * 
 * Copyright (c) 2014 Nayuki Minase
 * http://nayuki.eigenstate.org/page/binary-array-set
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
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import org.junit.Test;


public final class BinaryArraySetTest {
	
	@Test public void testBlank() {
		Set<Integer> set = newSet();
		assertFalse(set.contains(0));
		assertFalse(set.contains(-5));
		assertFalse(set.contains(2));
	}
	
	
	@Test public void testConstructFromExisting() {
		List<Integer> list = new ArrayList<Integer>();
		list.add(1);
		list.add(5);
		list.add(5);
		list.add(8);
		Set<Integer> set = new BinaryArraySet<Integer>(list);
		assertEquals(3, set.size());
		assertTrue(set.contains(1));
		assertTrue(set.contains(5));
		assertTrue(set.contains(8));
		assertFalse(set.contains(-2));
		assertFalse(set.contains(0));
		assertFalse(set.contains(4));
		assertFalse(set.contains(9));
	}
	
	
	@Test public void testAdd0() {
		Set<Integer> set = newSet();
		for (int i = 1; i <= 100; i++) {
			set.add(i - 1);
			assertEquals(i, set.size());
			assertFalse(set.contains(-7));
			assertFalse(set.contains(-1));
			for (int j = 0; j < i; j++)
				assertTrue(set.contains(j));
			for (int j = i; j < i + 10; j++)
				assertFalse(set.contains(j));
		}
	}
	
	
	@Test public void testAdd1() {
		Set<Integer> set = newSet();
		for (int i = 1; i <= 30; i++) {
			set.add((i - 1) * (i - 1));
			for (int j = -3; j < i * i + 5; j++)
				assertTrue(set.contains(j) == (j <= (i - 1) * (i - 1) && isPerfectSquare(j)));
		}
	}
	
	
	@Test public void testIterator() {
		Set<Integer> set = newSet();
		for (int i = 1; i <= 100; i++) {
			set.add((i - 1) * (i - 1));
			
			List<Integer> list = new ArrayList<Integer>(set);
			Collections.sort(list);
			assertEquals(i, list.size());
			
			for (int j = 0; j < i; j++)
				assertEquals(j * j, (int)list.get(j));
		}
	}
	
	
	// Comprehensively tests all the defined methods
	@Test public void testAgainstJavaListRandomly() {
		Random rand = new Random();
		Set<Integer> set0 = new HashSet<Integer>();
		Set<Integer> set1 = newSet();
		int size = 0;
		for (int i = 0; i < 10000; i++) {
			int op = rand.nextInt(100);
			
			if (op < 1) {  // Fast clear
				checkStructure(set1);
				set0.clear();
				set1.clear();
				size = 0;
				
			} else if (op < 2) {  // Clear with iterator and removal
				for (Integer val : set1)
					assertTrue(set0.remove(val));
				set1.clear();
				size = 0;
				
			} else if (op < 3) {  // Check iterator fully
				List<Integer> list0 = new ArrayList<Integer>(set0);
				List<Integer> list1 = new ArrayList<Integer>(set1);
				Collections.sort(list0);
				Collections.sort(list1);
				assertEquals(list0, list1);
				
			} else if (op < 70) {  // Add
				int n = rand.nextInt(100) + 1;
				for (int j = 0; j < n; j++) {
					int val = rand.nextInt(10000);
					boolean added = set0.add(val);
					assertTrue(set1.add(val) == added);
					if (added)
						size++;
				}
				
			} else if (op < 100) {  // Contains
				int n = rand.nextInt(100) + 1;
				for (int j = 0; j < n; j++) {
					int val = rand.nextInt(10000);
					assertTrue(set1.contains(val) == set0.contains(val));
				}
				
			} else
				throw new AssertionError();
			
			assertEquals(size, set0.size());
			assertEquals(size, set1.size());
		}
	}
	
	
	// This test suite is valid for any java.util.Set, not only BinaryArraySet.
	// You could substitute other classes in this instantiation here.
	private static <E extends Comparable<? super E>> Set<E> newSet() {
		return new BinaryArraySet<E>();
	}
	
	
	private static <E extends Comparable<? super E>> void checkStructure(Set<E> set) {
		if (set instanceof BinaryArraySet)
			((BinaryArraySet<E>)set).checkStructure();
	}
	
	
	private static boolean isPerfectSquare(int n) {
		for (int i = 0; i * i <= n; i++) {
			if (i * i == n)
				return true;
		}
		return false;
	}
	
}
