/* 
 * Sliding window min/max test (Java)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/sliding-window-minimum-maximum-algorithm
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

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.junit.Assert;
import org.junit.Test;


public final class SlidingWindowMinMaxTest {
	
	/*---- Test suite ----*/
	
	@Test public void testIntArray() {
		final int trials = 30000;
		for (int i = 0; i < trials; i++) {
			
			int[] array = new int[rand.nextInt(1000)];
			for (int j = 0; j < array.length; j++)
				array[j] = rand.nextInt(100);
			int window = rand.nextInt(30) + 1;
			boolean maximize = rand.nextBoolean();
			
			int[] expect = computeNaive(array, window, maximize);
			int[] actual = SlidingWindowMinMax.compute(array, window, maximize);
			Assert.assertArrayEquals(expect, actual);
		}
	}
	
	
	@Test public void testLongList() {
		final int trials = 30000;
		for (int i = 0; i < trials; i++) {
			
			List<Long> list = new ArrayList<>();
			int listLen = rand.nextInt(1000);
			for (int j = 0; j < listLen; j++)
				list.add((long)rand.nextInt(100));
			int window = rand.nextInt(10) + 1;
			boolean maximize = rand.nextBoolean();
			
			List<Long> expect = computeNaive(list, window, maximize);
			List<Long> actual = SlidingWindowMinMax.compute(list, window, maximize);
			Assert.assertEquals(expect, actual);
		}
	}
	
	
	@Test public void testIncremental() {
		final int trials = 10000;
		for (int i = 0; i < trials; i++) {
			
			int[] array = new int[1000];
			for (int j = 0; j < array.length; j++)
				array[j] = rand.nextInt(100);
			
			SlidingWindowMinMax<Integer> swm = new SlidingWindowMinMax<>();
			for (int start = 0, end = 0; start < array.length; ) {
				if (start == end || end < array.length && rand.nextBoolean()) {
					swm.addTail(array[end]);
					end++;
				} else {
					swm.removeHead(array[start]);
					start++;
				}
				
				if (start > end)
					throw new AssertionError();
				if (start < end) {
					Assert.assertEquals(min(array, start, end), (int)swm.getMinimum());
					Assert.assertEquals(max(array, start, end), (int)swm.getMaximum());
				}
			}
		}
	}
	
	
	
	/*---- Naive/simple computation functions ----*/
	
	private static int[] computeNaive(int[] array, int window, boolean maximize) {
		if (window <= 0)
			throw new IllegalArgumentException();
		if (array.length < window)
			return new int[0];
		int[] result = new int[array.length - window + 1];
		for (int i = 0; i < result.length; i++) {
			int temp = array[i];
			for (int j = 1; j < window; j++) {
				int val = array[i + j];
				if (!maximize && val < temp || maximize && val > temp)
					temp = val;
			}
			result[i] = temp;
		}
		return result;
	}
	
	
	private static <E extends Comparable<? super E>> List<E> computeNaive(List<E> list, int window, boolean maximize) {
		if (window <= 0)
			throw new IllegalArgumentException();
		List<E> result = new ArrayList<>();
		for (int i = 0; i < list.size() - window + 1; i++) {
			E temp = list.get(i);
			for (int j = 1; j < window; j++) {
				E val = list.get(i + j);
				int cmp = val.compareTo(temp);
				if (!maximize && cmp < 0 || maximize && cmp > 0)
					temp = val;
			}
			result.add(temp);
		}
		return result;
	}
	
	
	private static int min(int[] array, int start, int end) {
		if (end <= start)
			throw new IllegalArgumentException();
		int result = array[start];
		for (int i = start + 1; i < end; i++)
			result = Math.min(array[i], result);
		return result;
	}
	
	
	private static int max(int[] array, int start, int end) {
		if (end <= start)
			throw new IllegalArgumentException();
		int result = array[start];
		for (int i = start + 1; i < end; i++)
			result = Math.max(array[i], result);
		return result;
	}
	
	
	
	/*---- Miscellaneous ----*/
	
	private static Random rand = new Random();
	
}
