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
	
	@Test public void testIntArray() {
		final int trials = 30000;
		for (int i = 0; i < trials; i++) {
			
			int[] array = new int[rand.nextInt(1000)];
			for (int j = 0; j < array.length; j++)
				array[j] = rand.nextInt(100);
			int window = rand.nextInt(30) + 1;
			boolean maximize = rand.nextBoolean();
			
			int[] expect = SlidingWindowMinMax.calcWindowMinOrMaxNaive(array, window, maximize);
			int[] actual = SlidingWindowMinMax.calcWindowMinOrMaxDeque(array, window, maximize);
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
			
			List<Long> expect = SlidingWindowMinMax.calcWindowMinOrMaxNaive(list, window, maximize);
			List<Long> actual = SlidingWindowMinMax.calcWindowMinOrMaxDeque(list, window, maximize);
			Assert.assertEquals(expect, actual);
		}
	}
	
	
	private static Random rand = new Random();
	
}
