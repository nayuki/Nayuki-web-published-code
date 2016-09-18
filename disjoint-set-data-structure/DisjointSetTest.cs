/* 
 * Disjoint-set data structure - Test suite (C#)
 * 
 * Copyright (c) 2016 Project Nayuki
 * https://www.nayuki.io/page/disjoint-set-data-structure
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

using System;


public sealed class DisjointSetTest {
	
	/*---- Main runner ----*/
	
	public static void Main(string[] args) {
		testNew();
		testMerge();
		testBigMerge();
		testAgainstNaiveRandomly();
		Console.WriteLine("Test passed");
	}
	
	
	/*---- Test suite ----*/
	
	private static void testNew() {
		DisjointSet ds = new DisjointSet(10);
		assert(ds.GetNumberOfSets() == 10);
		assert(ds.GetSizeOfSet(0) == 1);
		assert(ds.GetSizeOfSet(2) == 1);
		assert(ds.GetSizeOfSet(9) == 1);
		assert(ds.AreInSameSet(0, 0));
		assert(!ds.AreInSameSet(0, 1));
		assert(!ds.AreInSameSet(9, 3));
		ds.CheckStructure();
	}
	
	
	private static void testMerge() {
		DisjointSet ds = new DisjointSet(10);
		assert(ds.MergeSets(0, 1));
		ds.CheckStructure();
		assert(ds.GetNumberOfSets() == 9);
		assert(ds.AreInSameSet(0, 1));
		
		assert(ds.MergeSets(2, 3));
		ds.CheckStructure();
		assert(ds.GetNumberOfSets() == 8);
		assert(ds.AreInSameSet(2, 3));
		
		assert(!ds.MergeSets(2, 3));
		ds.CheckStructure();
		assert(ds.GetNumberOfSets() == 8);
		assert(!ds.AreInSameSet(0, 2));
		
		assert(ds.MergeSets(0, 3));
		ds.CheckStructure();
		assert(ds.GetNumberOfSets() == 7);
		assert(ds.AreInSameSet(0, 2));
		assert(ds.AreInSameSet(3, 0));
		assert(ds.AreInSameSet(1, 3));
	}
	
	
	private static void testBigMerge() {
		int maxRank = 20;
		int trials = 10000;
		
		int numElems = 1 << maxRank;  // Grows exponentially
		DisjointSet ds = new DisjointSet(numElems);
		for (int level = 0; level < maxRank; level++) {
			int mergeStep = 1 << level;
			int incrStep = mergeStep * 2;
			for (int i = 0; i < numElems; i += incrStep) {
				assert(!ds.AreInSameSet(i, i + mergeStep));
				assert(ds.MergeSets(i, i + mergeStep));
			}
			// Now we have a bunch of sets of size 2^(level+1)
			
			// Do random tests
			int mask = -incrStep;  // 0b11...100...00
			for (int i = 0; i < trials; i++) {
				int j = rand.Next(numElems);
				int k = rand.Next(numElems);
				bool expect = (j & mask) == (k & mask);
				assert(ds.AreInSameSet(j, k) == expect);
			}
		}
	}
	
	
	private static void testAgainstNaiveRandomly() {
		int trials = 1000;
		int iterations = 3000;
		int numElems = 300;
		
		for (int i = 0; i < trials; i++) {
			NaiveDisjointSet nds = new NaiveDisjointSet(numElems);
			DisjointSet ds = new DisjointSet(numElems);
			for (int j = 0; j < iterations; j++) {
				int k = rand.Next(numElems);
				int l = rand.Next(numElems);
				assert(ds.GetSizeOfSet(k) == nds.GetSizeOfSet(k));
				assert(ds.AreInSameSet(k, l) == nds.AreInSameSet(k, l));
				if (rand.NextDouble() < 0.1)
					assert(ds.MergeSets(k, l) == nds.MergeSets(k, l));
				assert(nds.GetNumberOfSets() == ds.GetNumberOfSets());
				if (rand.NextDouble() < 0.001)
					ds.CheckStructure();
			}
			ds.CheckStructure();
		}
	}
	
	
	/*---- Helper definitions ----*/
	
	private static void assert(bool ok) {
		if (!ok)
			throw new SystemException("Assertion failed");
	}
	
	
	private static Random rand = new Random();
	
}



sealed class NaiveDisjointSet {
	
	private int[] representatives;
	
	public NaiveDisjointSet(int numElems) {
		representatives = new int[numElems];
		for (int i = 0; i < numElems; i++)
			representatives[i] = i;
	}
	
	public int GetNumberOfSets() {
		int result = 0;
		for (int i = 0; i < representatives.Length; i++) {
			if (representatives[i] == i)
				result++;
		}
		return result;
	}
	
	public int GetSizeOfSet(int elemIndex) {
		int repr = representatives[elemIndex];
		int result = 0;
		foreach (int r in representatives) {
			if (r == repr)
				result++;
		}
		return result;
	}
	
	public bool AreInSameSet(int elemIndex0, int elemIndex1) {
		return representatives[elemIndex0] == representatives[elemIndex1];
	}
	
	public bool MergeSets(int elemIndex0, int elemIndex1) {
		int repr0 = representatives[elemIndex0];
		int repr1 = representatives[elemIndex1];
		for (int i = 0; i < representatives.Length; i++) {
			if (representatives[i] == repr1)
				representatives[i] = repr0;
		}
		return repr0 != repr1;
	}
	
}
