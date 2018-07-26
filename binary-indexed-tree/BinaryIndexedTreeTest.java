/* 
 * Binary indexed tree test (Java)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/binary-indexed-tree
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
import java.util.Arrays;
import java.util.Random;
import org.junit.Test;


public final class BinaryIndexedTreeTest {
	
	@Test public void testSizeConstructor() {
		final int SIZELIMIT = 10_000;
		final int CHECKS = 10;
		for (int len = 0; len < SIZELIMIT; len++) {
			
			BinaryIndexedTree bt = new BinaryIndexedTree(len);
			assertEquals(len, bt.length());
			assertEquals(0, bt.getTotal());
			
			for (int i = 0; i < CHECKS; i++) {
				if (len > 0)
					assertEquals(0, bt.get(rand.nextInt(len)));
				assertEquals(0, bt.getPrefixSum(rand.nextInt(len + 1)));
				
				int start = rand.nextInt(len + 1);
				int end   = rand.nextInt(len + 1);
				if (start > end) {
					int temp = start;
					start = end;
					end = temp;
				}
				assertEquals(0, bt.getRangeSum(start, end));
			}
		}
	}
	
	
	@Test public void testAllOnes() {
		final int SIZELIMIT = 10_000;
		final int CHECKS = 10;
		for (int len = 1; len < SIZELIMIT; len++) {
			
			BinaryIndexedTree bt;
			int mode = rand.nextInt(4);
			if (mode == 0) {
				long[] vals = new long[len];
				Arrays.fill(vals, 1);
				bt = new BinaryIndexedTree(vals);
			} else {
				bt = new BinaryIndexedTree(len);
				double p;
				if      (mode == 1) p = 0;
				else if (mode == 2) p = 1;
				else if (mode == 3) p = rand.nextDouble();
				else throw new AssertionError();
				for (int i = 0; i < len; i++) {
					if (rand.nextDouble() < p)
						bt.add(i, 1);
					else
						bt.set(i, 1);
				}
			}
			
			assertEquals(len, bt.length());
			assertEquals(len, bt.getTotal());
			for (int i = 0; i < CHECKS; i++) {
				assertEquals(1, bt.get(rand.nextInt(len)));
				int k = rand.nextInt(len + 1);
				assertEquals(k, bt.getPrefixSum(k));
				
				int start = rand.nextInt(len + 1);
				int end   = rand.nextInt(len + 1);
				if (start > end) {
					int temp = start;
					start = end;
					end = temp;
				}
				assertEquals(end - start, bt.getRangeSum(start, end));
			}
		}
	}
	
	
	@Test public void testArrayConstructorRandomly() {
		final int TRIALS = 10_000;
		final int SIZELIMIT = 10_000;
		final int CHECKS = 100;
		for (int i = 0; i < TRIALS; i++) {
			
			int len = rand.nextInt(SIZELIMIT);
			long[] vals = new long[len];
			long[] cums = new long[len + 1];
			cums[0] = 0;
			for (int j = 0; j < vals.length; j++) {
				vals[j] = rand.nextLong();
				cums[j + 1] = cums[j] + vals[j];
			}
			
			BinaryIndexedTree bt = new BinaryIndexedTree(vals);
			assertEquals(len, bt.length());
			assertEquals(cums[len], bt.getTotal());
			
			for (int j = 0; j < CHECKS; j++) {
				if (len > 0) {
					int k = rand.nextInt(len);
					assertEquals(vals[k], bt.get(k));
				}
				int k = rand.nextInt(len + 1);
				assertEquals(cums[k], bt.getPrefixSum(k));
				
				int start = rand.nextInt(len + 1);
				int end   = rand.nextInt(len + 1);
				if (start > end) {
					int temp = start;
					start = end;
					end = temp;
				}
				assertEquals(cums[end] - cums[start], bt.getRangeSum(start, end));
			}
		}
	}
	
	
	@Test public void testAddAndSetRandomly() {
		final int TRIALS = 10_000;
		final int SIZELIMIT = 10_000;
		final int OPERATIONS = 10_000;
		final int CHECKS = 100;
		for (int i = 0; i < TRIALS; i++) {
			
			int len = rand.nextInt(SIZELIMIT) + 1;
			long[] vals = new long[len];
			BinaryIndexedTree bt;
			if (rand.nextBoolean())
				bt = new BinaryIndexedTree(len);
			else {
				for (int j = 0; j < vals.length; j++)
					vals[j] = rand.nextLong();
				bt = new BinaryIndexedTree(vals);
			}
			
			for (int j = 0; j < OPERATIONS; j++) {
				int k = rand.nextInt(len);
				long x = rand.nextLong();
				if (rand.nextBoolean()) {
					vals[k] += x;
					bt.add(k, x);
				} else {
					vals[k] = x;
					bt.set(k, x);
				}
			}
			
			long[] cums = new long[vals.length + 1];
			for (int j = 0; j < vals.length; j++)
				cums[j + 1] = cums[j] + vals[j];
			
			for (int j = 0; j < CHECKS; j++) {
				int k = rand.nextInt(len);
				assertEquals(vals[k], bt.get(k));
				k = rand.nextInt(len + 1);
				assertEquals(cums[k], bt.getPrefixSum(k));
				
				int start = rand.nextInt(len + 1);
				int end   = rand.nextInt(len + 1);
				if (start > end) {
					int temp = start;
					start = end;
					end = temp;
				}
				assertEquals(cums[end] - cums[start], bt.getRangeSum(start, end));
			}
		}
	}
	
	
	private static Random rand = new Random();
	
}
