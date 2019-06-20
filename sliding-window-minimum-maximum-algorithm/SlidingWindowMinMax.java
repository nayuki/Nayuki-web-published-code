/* 
 * Sliding window min/max (Java)
 * 
 * Copyright (c) 2019 Project Nayuki. (MIT License)
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

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;


public final class SlidingWindowMinMax<E extends Comparable<? super E>> {
	
	/*---- Static functions for one-shot computation ----*/
	
	/* 
	 * Returns a new array such that each result[i] =
	 * min(array[i], array[i+1], ..., array[i+window-1]) or
	 * max(array[i], array[i+1], ..., array[i+window-1]),
	 * depending on the maximize argument.
	 */
	public static int[] compute(int[] array, int window, boolean maximize) {
		Objects.requireNonNull(array);
		if (window <= 0)
			throw new IllegalArgumentException("Window size must be positive");
		if (array.length < window)
			return new int[0];
		
		int[] result = new int[array.length - window + 1];
		Deque<Integer> deque = new ArrayDeque<>();
		for (int i = 0; i < array.length; i++) {  // Range end index (inclusive)
			int val = array[i];
			while (!deque.isEmpty() && (!maximize && val < deque.getLast() || maximize && val > deque.getLast()))
				deque.removeLast();
			deque.addLast(val);
			
			int j = i + 1 - window;  // Range start index, does not overflow
			if (j >= 0) {
				result[j] = deque.getFirst();
				if (array[j] == result[j])
					deque.removeFirst();
			}
		}
		return result;
	}
	
	
	/*
	 * Returns a new array such that each result[i] =
	 * min(list[i], list[i+1], ..., list[i+window-1]) or
	 * max(list[i], list[i+1], ..., list[i+window-1]),
	 * depending on the maximize argument.
	 */
	public static <E extends Comparable<? super E>> List<E> compute(List<E> list, int window, boolean maximize) {
		Objects.requireNonNull(list);
		if (window <= 0)
			throw new IllegalArgumentException("Window size must be positive");
		
		List<E> result = new ArrayList<>();
		Deque<E> deque = new ArrayDeque<>();
		Iterator<E> tail = list.iterator();
		int countdown = window - 1;
		for (E val : list) {
			
			while (!deque.isEmpty()) {
				int cmp = val.compareTo(deque.getLast());
				if (!maximize && cmp >= 0 || maximize && cmp <= 0)
					break;
				deque.removeLast();
			}
			deque.addLast(val);
			
			if (countdown > 0)
				countdown--;
			else {
				result.add(deque.getFirst());
				if (tail.next().compareTo(deque.getFirst()) == 0)
					deque.removeFirst();
			}
		}
		return result;
	}
	
	
	
	/*---- Stateful instance for incremental computation ----*/
	
	/*-- Fields --*/
	
	private Deque<E> minDeque;
	private Deque<E> maxDeque;
	
	
	/*-- Constructor --*/
	
	public SlidingWindowMinMax() {
		minDeque = new ArrayDeque<>();
		maxDeque = new ArrayDeque<>();
	}
	
	
	/*-- Methods --*/
	
	public E getMinimum() {
		return minDeque.getFirst();
	}
	
	
	public E getMaximum() {
		return maxDeque.getFirst();
	}
	
	
	public void addTail(E val) {
		while (!minDeque.isEmpty() && val.compareTo(minDeque.getLast()) < 0)
			minDeque.removeLast();
		minDeque.addLast(val);
		
		while (!maxDeque.isEmpty() && val.compareTo(maxDeque.getLast()) > 0)
			maxDeque.removeLast();
		maxDeque.addLast(val);
	}
	
	
	public void removeHead(E val) {
		int cmp = val.compareTo(minDeque.getFirst());
		if (cmp < 0)
			throw new IllegalArgumentException("Wrong value");
		else if (cmp == 0)
			minDeque.removeFirst();
		
		cmp = val.compareTo(maxDeque.getFirst());
		if (cmp > 0)
			throw new IllegalArgumentException("Wrong value");
		else if (cmp == 0)
			maxDeque.removeFirst();
	}
	
}
