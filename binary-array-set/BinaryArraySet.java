/* 
 * Binary array set (Java)
 * 
 * Copyright (c) 2014 Nayuki Minase
 * http://nayuki.eigenstate.org/page/binary-array-set
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
import java.util.Iterator;
import java.util.NoSuchElementException;


public final class BinaryArraySet<E extends Comparable<? super E>> extends AbstractSet<E> {
	
	// For each i, values[i] is either null or it's an ascending-sorted array of length 2^i
	@SuppressWarnings("rawtypes")
	private Comparable[][] values;
	
	private int size;
	
	
	
	public BinaryArraySet() {
		values = new Comparable[30][];
	}
	
	
	public BinaryArraySet(Collection<? extends E> col) {
		this();
		for (E val : col)
			add(val);
	}
	
	
	
	// Runs in O(1) time
	public int size() {
		return size;
	}
	
	
	// Runs in O((log n)^2) time
	public boolean contains(E val) {
		for (Object[] vals : values) {
			if (vals != null) {
				int index = Arrays.binarySearch(vals, val);
				if (index >= 0)
					return true;
			}
		}
		return false;
	}
	
	
	// Runs in amortized O(1) time, worst-case O(n) time
	@SuppressWarnings({"rawtypes","unchecked"})
	public boolean add(E val) {
		if (val == null)
			throw new NullPointerException();
		if (size == Integer.MAX_VALUE || contains(val))
			return false;
		
		Comparable[] toPut = new Comparable[]{val};
		for (int i = 0; i < values.length; i++) {
			assert toPut.length == 1 << i;
			Comparable[] vals = values[i];
			if (vals == null) {
				values[i] = toPut;
				break;
			} else {
				// Merge two sorted arrays
				if (i == values.length - 1)
					throw new AssertionError();
				assert vals.length == 1 << i;
				Comparable[] next = new Comparable[2 << i];
				int j = 0;
				int k = 0;
				int l = 0;
				for (; j < vals.length && k < toPut.length; l++) {
					int cmp = vals[j].compareTo(toPut[k]);
					assert cmp != 0;
					if (cmp < 0) {
						next[l] = vals[j];
						j++;
					} else {
						next[l] = toPut[k];
						k++;
					}
				}
				for (; j < vals.length; j++, l++)
					next[l] = vals[j];
				for (; k < toPut.length; k++, l++)
					next[l] = toPut[k];
				assert l == next.length;
				toPut = next;
				values[i] = null;
			}
		}
		size++;
		return true;
	}
	
	
	// Runs in O(1) time
	public void clear() {
		values = new Comparable[30][];
		size = 0;
	}
	
	
	public Iterator<E> iterator() {
		return new Iter();
	}
	
	
	// For unit tests
	@SuppressWarnings({"rawtypes","unchecked"})
	void checkStructure() {
		if (size < 0)
			throw new AssertionError();
		
		int sum = 0;
		for (int i = 0; i < values.length; i++) {
			Comparable[] vals = values[i];
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
	
	
	
	private class Iter implements Iterator<E> {
		
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
		@SuppressWarnings("unchecked")
		public E next() {
			if (!hasNext())
				throw new NoSuchElementException();
			
			E result = (E)values[index][subIndex];
			subIndex++;
			if (subIndex == values[index].length) {
				subIndex = 0;
				index++;
				while (index < values.length && values[index] == null)
					index++;
			}
			return result;
		}
		
		
		public void remove() {
			throw new UnsupportedOperationException();
		}
		
	}
	
}
