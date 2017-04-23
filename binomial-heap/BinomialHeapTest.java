/* 
 * Binomial heap test (Java)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/binomial-heap
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
import java.util.PriorityQueue;
import java.util.Queue;
import java.util.Random;
import org.junit.Test;


public final class BinomialHeapTest {
	
	@Test public void testSize1() {
		Queue<Integer> h = newPriorityQueue();
		h.add(3);
		assertEquals(1, h.size());
		assertEquals(3, (int)h.element());
		assertEquals(3, (int)h.remove());
		assertEquals(0, h.size());
	}
	
	
	@Test public void testSize2() {
		Queue<Integer> h = newPriorityQueue();
		h.add(4);
		h.add(2);
		assertEquals(2, h.size());
		assertEquals(2, (int)h.element());
		assertEquals(2, (int)h.remove());
		assertEquals(1, h.size());
		assertEquals(4, (int)h.element());
		assertEquals(4, (int)h.remove());
		assertEquals(0, h.size());
		
	}
	
	
	@Test public void testSize7() {
		Queue<Integer> h = newPriorityQueue();
		h.add(2);
		h.add(7);
		h.add(1);
		h.add(8);
		h.add(3);
		h.add(1);
		h.add(4);
		assertEquals(7, h.size());
		assertEquals(1, (int)h.remove());  assertEquals(6, h.size());
		assertEquals(1, (int)h.remove());  assertEquals(5, h.size());
		assertEquals(2, (int)h.remove());  assertEquals(4, h.size());
		assertEquals(3, (int)h.remove());  assertEquals(3, h.size());
		assertEquals(4, (int)h.remove());  assertEquals(2, h.size());
		assertEquals(7, (int)h.remove());  assertEquals(1, h.size());
		assertEquals(8, (int)h.remove());  assertEquals(0, h.size());
	}
	
	
	// Comprehensively tests all the defined methods
	@Test public void testAgainstJavaPriorityQueueRandomly() {
		Random rand = new Random();
		BinomialHeap<Integer> heap = new BinomialHeap<>();
		PriorityQueue<Integer> queue = new PriorityQueue<>();
		int size = 0;
		for (int i = 0; i < 100000; i++) {
			int op = rand.nextInt(100);
			
			if (op < 1) {  // Clear
				heap.checkStructure();
				for (int j = 0; j < size; j++)
					assertEquals(queue.remove(), heap.remove());
				size = 0;
				
			} else if (op < 2) {  // Peek
				heap.checkStructure();
				if (size > 0)
					assertEquals(queue.element(), heap.element());
				
			} else if (op < 60) {  // Add
				int n = rand.nextInt(100) + 1;
				for (int j = 0; j < n; j++) {
					int val = rand.nextInt(10000);
					queue.add(val);
					heap.add(val);
				}
				size += n;
				
			} else if (op < 70) {  // Merge
				int n = rand.nextInt(100) + 1;
				BinomialHeap<Integer> temp = new BinomialHeap<>();
				for (int j = 0; j < n; j++) {
					int val = rand.nextInt(10000);
					queue.add(val);
					temp.add(val);
				}
				heap.merge(temp);
				assertEquals(0, temp.size());
				size += n;
				
			} else if (op < 100) {  // Remove
				int n = Math.min(rand.nextInt(100) + 1, size);
				for (int j = 0; j < n; j++)
					assertEquals(queue.remove(), heap.remove());
				size -= n;
				
			} else
				throw new AssertionError();
			
			assertEquals(size, queue.size());
			assertEquals(size, heap.size());
		}
	}
	
	
	private static <E extends Comparable<? super E>> Queue<E> newPriorityQueue() {
		return new BinomialHeap<E>();
	}
	
}
