/* 
 * Disjoint-set data structure - Test suite (Java)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/disjoint-set-data-structure
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
import java.util.Random;
import org.junit.Test;


public final class DisjointSetTest {
	
	/*---- Test suite ----*/
	
	@Test public void testNew() {
		DisjointSet ds = new DisjointSet(10);
		assertEquals(10, ds.getNumberOfSets());
		assertEquals(1, ds.getSizeOfSet(0));
		assertEquals(1, ds.getSizeOfSet(2));
		assertEquals(1, ds.getSizeOfSet(9));
		assertTrue(ds.areInSameSet(0, 0));
		assertFalse(ds.areInSameSet(0, 1));
		assertFalse(ds.areInSameSet(9, 3));
		ds.checkStructure();
	}
	
	
	@Test public void testMerge() {
		DisjointSet ds = new DisjointSet(10);
		assertTrue(ds.mergeSets(0, 1));
		ds.checkStructure();
		assertEquals(9, ds.getNumberOfSets());
		assertTrue(ds.areInSameSet(0, 1));
		
		assertTrue(ds.mergeSets(2, 3));
		ds.checkStructure();
		assertEquals(8, ds.getNumberOfSets());
		assertTrue(ds.areInSameSet(2, 3));
		
		assertFalse(ds.mergeSets(2, 3));
		ds.checkStructure();
		assertEquals(8, ds.getNumberOfSets());
		assertFalse(ds.areInSameSet(0, 2));
		
		assertTrue(ds.mergeSets(0, 3));
		ds.checkStructure();
		assertEquals(7, ds.getNumberOfSets());
		assertTrue(ds.areInSameSet(0, 2));
		assertTrue(ds.areInSameSet(3, 0));
		assertTrue(ds.areInSameSet(1, 3));
	}
	
	
	@Test public void testBigMerge() {
		int maxRank = 20;
		int trials = 10000;
		
		int numElems = 1 << maxRank;  // Grows exponentially
		DisjointSet ds = new DisjointSet(numElems);
		for (int level = 0; level < maxRank; level++) {
			int mergeStep = 1 << level;
			int incrStep = mergeStep * 2;
			for (int i = 0; i < numElems; i += incrStep) {
				assertFalse(ds.areInSameSet(i, i + mergeStep));
				assertTrue(ds.mergeSets(i, i + mergeStep));
			}
			// Now we have a bunch of sets of size 2^(level+1)
			
			// Do random tests
			int mask = -incrStep;  // 0b11...100...00
			for (int i = 0; i < trials; i++) {
				int j = rand.nextInt(numElems);
				int k = rand.nextInt(numElems);
				boolean expect = (j & mask) == (k & mask);
				assertTrue(expect == ds.areInSameSet(j, k));
			}
		}
	}
	
	
	@Test public void testAgainstNaiveRandomly() {
		int trials = 1000;
		int iterations = 3000;
		int numElems = 300;
		
		for (int i = 0; i < trials; i++) {
			NaiveDisjointSet nds = new NaiveDisjointSet(numElems);
			DisjointSet ds = new DisjointSet(numElems);
			for (int j = 0; j < iterations; j++) {
				int k = rand.nextInt(numElems);
				int l = rand.nextInt(numElems);
				assertEquals(nds.getSizeOfSet(k), ds.getSizeOfSet(k));
				assertTrue(nds.areInSameSet(k, l) == ds.areInSameSet(k, l));
				if (rand.nextDouble() < 0.1)
					assertTrue(nds.mergeSets(k, l) == ds.mergeSets(k, l));
				assertEquals(nds.getNumberOfSets(), ds.getNumberOfSets());
				if (rand.nextDouble() < 0.001)
					ds.checkStructure();
			}
			ds.checkStructure();
		}
	}
	
	
	
	/*---- Helper definitions ----*/
	
	private static Random rand = new Random();
	
	
	private static final class NaiveDisjointSet {
		
		private int[] representatives;
		
		public NaiveDisjointSet(int numElems) {
			representatives = new int[numElems];
			for (int i = 0; i < numElems; i++)
				representatives[i] = i;
		}
		
		public int getNumberOfSets() {
			int result = 0;
			for (int i = 0; i < representatives.length; i++) {
				if (representatives[i] == i)
					result++;
			}
			return result;
		}
		
		public int getSizeOfSet(int elemIndex) {
			int repr = representatives[elemIndex];
			int result = 0;
			for (int r : representatives) {
				if (r == repr)
					result++;
			}
			return result;
		}
		
		public boolean areInSameSet(int elemIndex0, int elemIndex1) {
			return representatives[elemIndex0] == representatives[elemIndex1];
		}
		
		public boolean mergeSets(int elemIndex0, int elemIndex1) {
			int repr0 = representatives[elemIndex0];
			int repr1 = representatives[elemIndex1];
			for (int i = 0; i < representatives.length; i++) {
				if (representatives[i] == repr1)
					representatives[i] = repr0;
			}
			return repr0 != repr1;
		}
		
	}
	
}
