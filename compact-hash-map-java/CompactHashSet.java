/* 
 * Compact hash set
 * 
 * Copyright (c) 2015 Project Nayuki
 * http://www.nayuki.io/page/compact-hash-map-java
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
import java.util.Iterator;
import java.util.NoSuchElementException;


/**
 * A hash table based set that stores data as byte arrays, but converts to and from regular Java objects
 * on the fly at each query. Requires a translator object for additional functionality.
 */
public final class CompactHashSet<E> extends AbstractSet<E> {
	
	/* Fields */
	
	private Object[] table;  // Length is always a power of 2. Each element is either null, byte[], or Node.
	private int size;        // Number of items stored (can be greater than table.length due to chaining)
	private final double loadFactor = 1.0;  // Increase capacity when size / table.length > loadFactor
	private final CompactSetTranslator<E> translator;
	
	
	
	/* Constructors */
	
	public CompactHashSet(CompactSetTranslator<E> trans) {
		if (trans == null)
			throw new NullPointerException();
		this.translator = trans;
		clear();
	}
	
	
	
	/* Basic methods */
	
	public void clear() {
		table = new Object[1];
		size = 0;
	}
	
	
	public int size() {
		return size;
	}
	
	
	public boolean contains(Object obj) {
		if (obj == null)
			throw new NullPointerException();
		if (!translator.isInstance(obj))
			return false;
		@SuppressWarnings("unchecked")
		Object chain = table[getIndex((E)obj)];
		if (chain == null)
			return false;
		while (true) {
			if (chain instanceof byte[])
				return equals(obj, (byte[])chain);
			else {  // chain instanceof Node
				Node node = (Node)chain;
				if (equals(obj, node.object))
					return true;
				chain = node.next;
			}
		}
	}
	
	
	public boolean add(E obj) {
		if (obj == null)
			throw new NullPointerException();
		final int index = getIndex(obj);
		final Object head = table[index];
		final byte[] packed = translator.serialize(obj);
		
		// Simple cases
		if (head == null) {
			checkMaxSize();
			table[index] = packed;
			return incrementSize();
		}
		if (head instanceof byte[]) {
			byte[] headObj = (byte[])head;
			if (equals(obj, headObj))
				return false;
			else {
				checkMaxSize();
				table[index] = new Node(packed, head);
				return incrementSize();
			}
		}
		
		// Else head instanceof Node
		Node node = (Node)head;
		while (true) {
			byte[] nodeObj = node.object;
			if (equals(obj, nodeObj))
				return false;
			Object next = node.next;
			if (next instanceof byte[]) {
				byte[] nextObj = (byte[])next;
				if (equals(obj, nextObj))
					return false;
				else {
					checkMaxSize();
					node.next = new Node(packed, node.next);
					return incrementSize();
				}
			}
			// Else next instanceof Node
			node = (Node)next;
		}
	}
	
	
	public boolean remove(Object obj) {
		if (obj == null)
			throw new NullPointerException();
		if (!translator.isInstance(obj))
			return false;
		@SuppressWarnings("unchecked")
		final int index = getIndex((E)obj);
		final Object head = table[index];
		
		// Simple cases
		if (head == null)
			return false;
		if (head instanceof byte[]) {
			if (equals(obj, (byte[])head)) {
				table[index] = null;
				return decrementSize();
			}
			return false;
		}
		
		// Else head instanceof Node
		Node node = (Node)head;
		if (equals(obj, node.object)) {
			table[index] = node.next;
			return decrementSize();
		}
		Object next = node.next;
		if (next instanceof byte[]) {
			if (equals(obj, (byte[])next)) {
				table[index] = node.object;
				return decrementSize();
			}
			return false;
		}
		
		// Else next instanceof Node
		Node nextNode = (Node)next;
		next = null;  // Do not use this variable anymore
		while (true) {
			Object nextNext = nextNode.next;
			if (equals(obj, nextNode.object)) {
				node.next = nextNext;
				return decrementSize();
			}
			if (nextNext instanceof byte[]) {
				if (equals(obj, (byte[])nextNext)) {
					node.next = nextNode.object;
					return decrementSize();
				}
				return false;
			}
			// Else nextNext instanceof Node
			node = nextNode;
			nextNode = (Node)nextNext;
		}
	}
	
	
	/* Helper methods */
	
	private int getIndex(E obj) {
		return translator.getHash(obj) & (table.length - 1);
	}
	
	
	private boolean equals(Object obj, byte[] packed) {
		return obj.equals(translator.deserialize(packed));
	}
	
	
	private void checkMaxSize() {
		if (size == Integer.MAX_VALUE)
			throw new IllegalStateException("Maximum size reached");
	}
	
	
	private boolean incrementSize() {
		size++;
		if ((double)size / table.length > loadFactor && table.length <= Integer.MAX_VALUE / 2) {  // Expand hash table
			Object[] oldTable = table;
			table = new Object[table.length * 2];
			for (Object chain : oldTable) {
				while (chain != null) {
					// Grab current entry and advance the chain
					byte[] obj;
					if (chain instanceof byte[]) {
						obj = (byte[])chain;
						chain = null;
					} else {  // chain instanceof Node
						Node node = (Node)chain;
						obj = node.object;
						chain = node.next;
					}
					
					// Re-hash the entry and add to new table
					int index = getIndex(translator.deserialize(obj));
					if (table[index] == null)
						table[index] = obj;
					else
						table[index] = new Node(obj, table[index]);
				}
			}
		}
		return true;  // To save repeated code for the caller
	}
	
	
	private boolean decrementSize() {
		size--;
		if (table.length > 1 && (double)size / table.length < loadFactor / 4) {  // Shrink hash table
			// The algorithm here only works for halving the length, not for other scale factors
			int halfLen = table.length / 2;
			Object[] newTable = Arrays.copyOf(table, halfLen);  // Copy first half
			for (int i = halfLen; i < table.length; i++) {  // Merge second half
				Object chain = table[i];
				if (chain != null) {
					int j = i - halfLen;
					if (newTable[j] == null)
						newTable[j] = chain;
					else if (newTable[j] instanceof byte[])
						newTable[j] = new Node((byte[])newTable[j], chain);
					else {  // newTable[j] instanceof Node
						Node node = (Node)newTable[j];
						while (node.next instanceof Node)
							node = (Node)node.next;
						// Now node.next instanceof byte[]
						node.next = new Node((byte[])node.next, chain);
					}
				}
			}
			table = newTable;
		}
		return true;  // To save repeated code for the caller
	}
	
	
	/* Advanced methods */
	
	public Iterator<E> iterator() {
		return new Iter();
	}
	
	
	// For unit tests.
	void checkStructure() {
		if (table == null || Integer.bitCount(table.length) != 1 || size < 0 || loadFactor <= 0 || Double.isNaN(loadFactor) || translator == null)
			throw new AssertionError();
		int count = 0;
		for (int i = 0; i < table.length; i++) {
			Object chain = table[i];
			while (chain != null) {
				byte[] obj;
				if (chain instanceof byte[]) {
					obj = (byte[])chain;
					chain = null;
				} else if (chain instanceof Node) {
					Node node = (Node)chain;
					if (node.object == null || node.next == null)
						throw new AssertionError();
					obj = node.object;
					chain = node.next;
				} else
					throw new AssertionError();
				count++;
				if (getIndex(translator.deserialize(obj)) != i)
					throw new AssertionError();
			}
		}
		if (count != size)
			throw new AssertionError();
	}
	
	
	
	/* Helper classes */
	
	// A linked list non-terminal node.
	private static class Node {
		
		public byte[] object;  // Represents a packed object. Not null.
		public Object next;    // Either byte[] or Node, not null.
		
		
		// Both arguments must be non-null.
		public Node(byte[] object, Object next) {
			this.object = object;
			this.next = next;
		}
		
	}
	
	
	
	// For the iterator() method.
	private class Iter implements Iterator<E> {
		
		private int nextIndex;  // Managed by hasNext()
		private Object chain;   // Set by hasNext(), advanced and cleared by next()
		
		
		public Iter() {
			nextIndex = 0;
			chain = null;
		}
		
		
		public boolean hasNext() {
			if (chain != null)
				return true;
			while (nextIndex < table.length) {
				if (table[nextIndex] == null)
					nextIndex++;
				else {
					chain = table[nextIndex];
					nextIndex++;
					return true;
				}
			}
			return false;
		}
		
		
		public E next() {
			if (!hasNext())
				throw new NoSuchElementException();
			byte[] packed;
			if (chain instanceof byte[]) {
				packed = (byte[])chain;
				chain = null;
			} else {  // chain instanceof Node
				Node node = (Node)chain;
				packed = node.object;
				chain = node.next;
			}
			return translator.deserialize(packed);
		}
		
		
		public void remove() {
			throw new UnsupportedOperationException();
		}
		
	}
	
}
