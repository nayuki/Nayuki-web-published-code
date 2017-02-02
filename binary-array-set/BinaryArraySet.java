/* 
 * Binary array set (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * https://www.nayuki.io/page/binary-array-set
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

import java.util.AbstractSet;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Iterator;
import java.util.NoSuchElementException;


public final class BinaryArraySet<E extends Comparable<? super E>> extends AbstractSet<E> {
	
	// For each i, values[i] is either null or it's an ascending-sorted array of length 2^i
	private E[][] values;
	
	private int size;
	
	
	
	// Runs in O(1) time
	public BinaryArraySet() {
		clear();
	}
	
	
	// Runs in O(n (log n)^2) time
	public BinaryArraySet(Collection<? extends E> col) {
		this();
		if (col == null)
			throw new NullPointerException();
		addAll(col);
	}
	
	
	// Runs in O(n (log n)^2) time
	public BinaryArraySet(E... vals) {
		this();
		if (vals == null)
			throw new NullPointerException();
		Collections.addAll(this, vals);
	}
	
	
	
	// Runs in O(1) time
	public int size() {
		return size;
	}
	
	
	// Runs in O((log n)^2) time
	public boolean contains(E val) {
		for (E[] vals : values) {
			if (vals != null && Arrays.binarySearch(vals, val) >= 0)
				return true;
		}
		return false;
	}
	
	
	// Runs in average-case O((log n)^2) time, worst-case O(n) time
	@SuppressWarnings("unchecked")
	public boolean add(E val) {
		if (val == null)
			throw new NullPointerException();
		if (size == Integer.MAX_VALUE)
			throw new IllegalStateException("Maximum size reached");
		
		// Checking for duplicates is expensive, taking O((log n)^2) time
		if (contains(val))
			return false;
		
		// The pure add portion below runs in amortized O(1) time
		E[] toPut = (E[])new Comparable[]{val};
		for (int i = 0; i < values.length; i++) {
			assert toPut.length == 1 << i;
			E[] vals = values[i];
			if (vals == null) {
				values[i] = toPut;
				break;
			} else {
				// Merge two sorted arrays
				if (i == values.length - 1)
					throw new AssertionError();
				assert vals.length == 1 << i;
				E[] next = (E[])new Comparable[2 << i];
				int j = 0;
				int k = 0;
				int l = 0;
				for (; j < vals.length && k < toPut.length; l++) {
					int cmp = vals[j].compareTo(toPut[k]);
					if (cmp < 0) {
						next[l] = vals[j];
						j++;
					} else if (cmp > 0) {
						next[l] = toPut[k];
						k++;
					} else
						throw new IllegalStateException();
				}
				System.arraycopy(vals , j, next, l, vals .length - j);
				System.arraycopy(toPut, k, next, l, toPut.length - k);
				toPut = next;
				values[i] = null;
			}
		}
		size++;
		return true;
	}
	
	
	// Runs in O(1) time
	@SuppressWarnings("unchecked")
	public void clear() {
		values = (E[][])new Comparable[30][];
		size = 0;
	}
	
	
	public Iterator<E> iterator() {
		return new Iter();
	}
	
	
	// For unit tests
	void checkStructure() {
		if (size < 0)
			throw new AssertionError();
		
		int sum = 0;
		for (int i = 0; i < values.length; i++) {
			E[] vals = values[i];
			if (vals != null) {
				if (vals.length != 1 << i)
					throw new AssertionError();
				sum += vals.length;
				for (int j = 1; j < vals.length; j++) {
					if (vals[j - 1].compareTo(vals[j]) >= 0)
						throw new AssertionError();
				}
			}
		}
		if (sum != size)
			throw new AssertionError();
	}
	
	
	
	// Note: Not fail-fast on concurrent modification
	private final class Iter implements Iterator<E> {
		
		private int index;
		private int subIndex;
		
		
		// Constructor runs in O(log n) time
		public Iter() {
			index = 0;
			while (index < values.length && values[index] == null)
				index++;
			subIndex = 0;
		}
		
		
		// Runs in O(1) time
		public boolean hasNext() {
			return index < values.length;
		}
		
		
		// Runs in amortized O(1) time, worst-case O(log n) time
		public E next() {
			if (!hasNext())
				throw new NoSuchElementException();
			
			E result = values[index][subIndex];
			subIndex++;
			if (subIndex == values[index].length) {
				subIndex = 0;
				do index++;
				while (index < values.length && values[index] == null);
			}
			return result;
		}
		
		
		public void remove() {
			throw new UnsupportedOperationException();
		}
		
	}
	
}
