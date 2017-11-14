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
import static org.junit.Assert.assertTrue;
import java.util.Arrays;
import java.util.PriorityQueue;
import java.util.Random;
import org.junit.Test;


public final class BinomialHeapTest {
	
	@Test public void testSize1() {
		BinomialHeap<Integer> h = new BinomialHeap<>();
		h.add(3);
		h.checkStructure();
		assertEquals(1, h.size());
		assertEquals(3, (int)h.element());
		assertEquals(3, (int)h.remove());
		h.checkStructure();
		assertEquals(0, h.size());
	}
	
	
	@Test public void testSize2() {
		BinomialHeap<Integer> h = new BinomialHeap<>();
		h.add(4);
		h.add(2);
		h.checkStructure();
		assertEquals(2, h.size());
		assertEquals(2, (int)h.element());
		assertEquals(2, (int)h.remove());
		h.checkStructure();
		assertEquals(1, h.size());
		assertEquals(4, (int)h.element());
		assertEquals(4, (int)h.remove());
		h.checkStructure();
		assertEquals(0, h.size());
	}
	
	
	@Test public void testSize7() {
		BinomialHeap<Integer> h = new BinomialHeap<>();
		h.add(2);
		h.add(7);
		h.add(1);
		h.add(8);
		h.add(3);
		h.checkStructure();
		h.add(1);
		h.add(4);
		h.checkStructure();
		assertEquals(7, h.size());
		assertEquals(1, (int)h.remove());  assertEquals(6, h.size());
		assertEquals(1, (int)h.remove());  assertEquals(5, h.size());
		assertEquals(2, (int)h.remove());  assertEquals(4, h.size());
		assertEquals(3, (int)h.remove());  assertEquals(3, h.size());
		h.checkStructure();
		assertEquals(4, (int)h.remove());  assertEquals(2, h.size());
		assertEquals(7, (int)h.remove());  assertEquals(1, h.size());
		assertEquals(8, (int)h.remove());  assertEquals(0, h.size());
		h.checkStructure();
	}
	
	
	@Test public void testAgainstArrayRandomly() {
		final int TRIALS = 10_000;
		final int MAX_SIZE = 1000;
		final int RANGE = 1000;
		
		BinomialHeap<Integer> heap = new BinomialHeap<>();
		for (int i = 0; i < TRIALS; i++) {
			int[] values = new int[rand.nextInt(MAX_SIZE)];
			for (int j = 0; j < values.length; j++) {
				int val = rand.nextInt(RANGE);
				values[j] = val;
				heap.add(val);
			}
			
			Arrays.sort(values);
			for (int val : values)
				assertEquals(val, (int)heap.remove());
			
			assertTrue(heap.isEmpty());
			heap.clear();
		}
	}
	
	
	@Test public void testAgainstJavaPriorityQueueRandomly() {
		final int TRIALS = 100_000;
		final int ITER_OPS = 100;
		final int RANGE = 10_000;
		
		BinomialHeap<Integer> heap = new BinomialHeap<>();
		PriorityQueue<Integer> queue = new PriorityQueue<>();
		int size = 0;
		for (int i = 0; i < TRIALS; i++) {
			int op = rand.nextInt(100);
			
			if (op < 1) {  // Clear
				heap.checkStructure();
				for (int j = 0; j < size; j++)
					assertEquals(queue.remove(), heap.remove());
				size = 0;
				
			} else if (op < 2) {  // Peek
				heap.checkStructure();
				assertEquals(queue.peek(), heap.peek());
				
			} else if (op < 70) {  // Enqueue/merge
				boolean merge = !(op < 60);
				BinomialHeap<Integer> sink = merge ? new BinomialHeap<>() : heap;
				int n = rand.nextInt(ITER_OPS) + 1;
				for (int j = 0; j < n; j++) {
					int val = rand.nextInt(RANGE);
					queue.add(val);
					sink.add(val);
				}
				if (merge) {
					heap.merge(sink);
					assertEquals(0, sink.size());
				}
				size += n;
				
			} else if (op < 100) {  // Dequeue
				int n = Math.min(rand.nextInt(ITER_OPS) + 1, size);
				for (int j = 0; j < n; j++)
					assertEquals(queue.remove(), heap.remove());
				size -= n;
				
			} else
				throw new AssertionError();
			
			assertEquals(size, queue.size());
			assertEquals(size, heap.size());
			assertTrue(queue.isEmpty() == (size == 0));
			assertTrue(heap.isEmpty() == (size == 0));
		}
	}
	
	
	private static Random rand = new Random();
	
}
