/* 
 * AA tree set test (Java)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/aa-tree-set
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.TreeSet;
import org.junit.Test;


public final class AaTreeSetTest {
	
	@Test public void testSmallRandomly() {
		final int TRIALS = 300;
		final int OPERATIONS = 300;
		final int RANGE = 100;
		
		for (int i = 0; i < TRIALS; i++) {
			Set<Integer> set0 = new TreeSet<>();
			AaTreeSet<Integer> set1 = new AaTreeSet<>();
			for (int j = 0; j < OPERATIONS; j++) {
				
				// Add/remove a random value
				Integer val = rand.nextInt(RANGE);
				if (rand.nextDouble() < 0.001) {
					set0.clear();
					set1.clear();
				} else if (rand.nextDouble() < 0.5)
					assertTrue(set0.add(val) == set1.add(val));
				else
					assertTrue(set0.remove(val) == set1.remove(val));
				set1.checkStructure();
				
				// Check size and check element membership over entire range
				assertTrue(set0.isEmpty() == set1.isEmpty());
				assertEquals(set0.size(), set1.size());
				for (int k = -10; k < RANGE + 10; k++) {
					val = k;
					assertTrue(set0.contains(val) == set1.contains(val));
				}
			}
		}
	}
	
	
	@Test public void testLargeRandomly() {
		final int TRIALS = 100;
		final int OPERATIONS = 10_000;
		final int RANGE = 100_000;
		final int CHECKS = 10;
		
		for (int i = 0; i < TRIALS; i++) {
			Set<Integer> set0 = new TreeSet<>();
			AaTreeSet<Integer> set1 = new AaTreeSet<>();
			for (int j = 0; j < OPERATIONS; j++) {
				
				// Add/remove a random value
				Integer val = rand.nextInt(RANGE);
				if (rand.nextDouble() < 0.5)
					assertTrue(set0.add(val) == set1.add(val));
				else
					assertTrue(set0.remove(val) == set1.remove(val));
				
				// Check size and random element membership
				assertEquals(set0.size(), set1.size());
				for (int k = 0; k < CHECKS; k++) {
					val = rand.nextInt(RANGE + 100) - 50;
					assertTrue(set0.contains(val) == set1.contains(val));
				}
				
				// Occasionally check entire set and iterator
				if (rand.nextDouble() < 0.001) {
					set1.checkStructure();
					Iterator<Integer> iter0 = set0.iterator();
					Iterator<Integer> iter1 = set1.iterator();
					while (iter0.hasNext()) {
						assertTrue(iter1.hasNext());
						assertEquals(iter0.next(), iter1.next());
					}
					assertFalse(iter1.hasNext());
				}
			}
		}
	}
	
	
	@Test public void testInsertRandomly() {
		final int TRIALS = 100;
		final int OPERATIONS = 10_000;
		final int RANGE = 100_000;
		final int CHECKS = 10;
		
		for (int i = 0; i < TRIALS; i++) {
			Set<Integer> set0 = new HashSet<>();
			AaTreeSet<Integer> set1 = new AaTreeSet<>();
			for (int j = 0; j < OPERATIONS; j++) {
				
				// Add a random value
				Integer val = rand.nextInt(RANGE);
				assertTrue(set0.add(val) == set1.add(val));
				if (rand.nextDouble() < 0.003)
					set1.checkStructure();
				
				// Check size and random element membership
				assertEquals(set0.size(), set1.size());
				for (int k = 0; k < CHECKS; k++) {
					val = rand.nextInt(RANGE + 100) - 50;
					assertTrue(set0.contains(val) == set1.contains(val));
				}
			}
		}
	}
	
	
	@Test public void testIterator() {
		final int SIZE = 1000;
		Set<Integer> set = new AaTreeSet<>();
		for (int i = 0; i < SIZE; i++) {
			set.add(i * i);
			List<Integer> list = new ArrayList<>(set);
			assertEquals(i + 1, list.size());
			for (int j = 0; j < list.size(); j++)
				assertEquals(j * j, (int)list.get(j));
		}
	}
	
	
	@Test public void testAscendingOperations() {
		final int SIZE = 300_000;
		final int CHECKS = 10;
		AaTreeSet<Integer> set = new AaTreeSet<>();
		for (int i = 0; i < SIZE; i++) {
			assertEquals(i, set.size());
			assertTrue(set.add(i));
			for (int j = 0; j < CHECKS; j++) {
				int val = rand.nextInt(i + 100) - 50;
				assertTrue(set.contains(val) == (0 <= val && val <= i));
			}
		}
		for (int i = 0; i < SIZE; i++) {
			assertEquals(SIZE - i, set.size());
			assertTrue(set.remove(i));
			for (int j = 0; j < CHECKS; j++) {
				int val = rand.nextInt(i + 100) - 50;
				assertTrue(set.contains(val) == (i < val && val < SIZE));
			}
		}
		assertEquals(0, set.size());
	}
	
	
	@Test public void testDescendingOperations() {
		final int SIZE = 300_000;
		final int CHECKS = 10;
		AaTreeSet<Integer> set = new AaTreeSet<>();
		for (int i = 0; i < SIZE; i++) {
			assertEquals(i, set.size());
			assertTrue(set.add(-i));
			for (int j = 0; j < CHECKS; j++) {
				int val = -(rand.nextInt(i + 100) - 50);
				assertTrue(set.contains(val) == (-i <= val && val <= 0));
			}
		}
		for (int i = 0; i < SIZE; i++) {
			assertEquals(SIZE - i, set.size());
			assertTrue(set.remove(-i));
			for (int j = 0; j < CHECKS; j++) {
				int val = -(rand.nextInt(i + 100) - 50);
				assertTrue(set.contains(val) == (-SIZE < val && val < -i));
			}
		}
		assertEquals(0, set.size());
	}
	
	
	@Test public void testAllInsertionOrders() {
		final int LIMIT = 10;
		AaTreeSet<Integer> set = new AaTreeSet<>();
		
		for (int size = 1; size <= LIMIT; size++) {
			Integer[] values = new Integer[size];
			for (int i = 0; i < values.length; i++)
				values[i] = i;
			
			do {  // This runs factorial(size) iterations
				set.clear();
				for (Integer val : values)
					set.add(val);
				set.checkStructure();
				
				Iterator<Integer> iter = set.iterator();
				for (int i = 0; i < size; i++)
					assertEquals(i, (int)iter.next());
				assertFalse(iter.hasNext());
			} while (nextPermutation(values));
		}
	}
	
	
	@Test public void testRemoveAllRandomly() {
		final int TRIALS = 100;
		final int LIMIT = 10_000;
		final int RANGE = 100_000;
		final int CHECKS = 10;
		
		for (int i = 0; i < TRIALS; i++) {
			// Create sets and add all values
			Set<Integer> set0 = new HashSet<>();
			AaTreeSet<Integer> set1 = new AaTreeSet<>();
			for (int j = 0; j < LIMIT; j++) {
				Integer val = rand.nextInt(RANGE);
				assertTrue(set0.add(val) == set1.add(val));
			}
			set1.checkStructure();
			
			// Remove each value in random order
			List<Integer> list = new ArrayList<>(set0);
			Collections.shuffle(list);
			for (Integer val : list) {
				assertTrue(set0.remove(val) == set1.remove(val));
				if (rand.nextDouble() < Math.max(1.0 / set1.size(), 0.001))
					set1.checkStructure();
				assertEquals(set0.size(), set1.size());
				for (int j = 0; j < CHECKS; j++) {
					val = rand.nextInt(RANGE + 100) - 50;
					assertTrue(set0.contains(val) == set1.contains(val));
				}
			}
			assertTrue(set0.isEmpty() && set1.isEmpty());
		}
	}
	
	
	// Algorithm from https://www.nayuki.io/res/next-lexicographical-permutation-algorithm
	private static <T extends Comparable<? super T>> boolean nextPermutation(T[] array) {
		int i = array.length - 1;
		while (i > 0 && array[i - 1].compareTo(array[i]) >= 0)
			i--;
		if (i <= 0)
			return false;
		int j = array.length - 1;
		while (array[j].compareTo(array[i - 1]) <= 0)
			j--;
		T temp = array[i - 1];
		array[i - 1] = array[j];
		array[j] = temp;
		j = array.length - 1;
		while (i < j) {
			temp = array[i];
			array[i] = array[j];
			array[j] = temp;
			i++;
			j--;
		}
		return true;
	}
	
	
	private static Random rand = new Random();
	
}
