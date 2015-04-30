/* 
 * Compact hash map
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

import java.util.AbstractMap;
import java.util.AbstractSet;
import java.util.Arrays;
import java.util.Iterator;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;


/**
 * A hash table based map that stores data as byte arrays, but converts to and from regular Java objects
 * on the fly at each query. Requires a translator object for additional functionality.
 */
public final class CompactHashMap<K,V> extends AbstractMap<K,V> {
	
	/* Fields */
	
	private Object[] table;  // Length is always a power of 2. Each element is either null, byte[], or Node.
	private int size;        // Number of items stored (can be greater than table.length due to chaining)
	private final double loadFactor = 1.0;  // Increase capacity when size / table.length > loadFactor
	private final CompactMapTranslator<K,V> translator;
	
	
	
	/* Constructors */
	
	public CompactHashMap(CompactMapTranslator<K,V> trans) {
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
	
	
	public boolean containsKey(Object key) {
		if (key == null)
			throw new NullPointerException();
		if (!translator.isKeyInstance(key))
			return false;
		@SuppressWarnings("unchecked")
		Object chain = table[getIndex((K)key)];
		if (chain == null)
			return false;
		while (true) {
			if (chain instanceof byte[])
				return equals(key, (byte[])chain);
			else {  // chain instanceof Node
				Node node = (Node)chain;
				if (equals(key, node.object))
					return true;
				chain = node.next;
			}
		}
	}
	
	
	public V get(Object key) {
		if (key == null)
			throw new NullPointerException();
		if (!translator.isKeyInstance(key))
			return null;
		@SuppressWarnings("unchecked")
		Object chain = table[getIndex((K)key)];
		if (chain == null)
			return null;
		while (true) {
			if (chain instanceof byte[]) {
				byte[] obj = (byte[])chain;
				if (equals(key, obj))
					return translator.deserializeValue(obj);
				return null;
			}
			else {  // chain instanceof Node
				Node node = (Node)chain;
				if (equals(key, node.object))
					return translator.deserializeValue(node.object);
				chain = node.next;
			}
		}
	}
	
	
	public V put(K key, V value) {
		if (key == null)
			throw new NullPointerException();
		final int index = getIndex(key);
		final Object head = table[index];
		final byte[] packed = translator.serialize(key, value);
		
		// Simple cases
		if (head == null) {
			checkMaxSize();
			table[index] = packed;
			return incrementSize();
		}
		if (head instanceof byte[]) {
			byte[] headObj = (byte[])head;
			if (equals(key, headObj)) {
				table[index] = packed;
				return translator.deserializeValue(headObj);
			} else {
				checkMaxSize();
				table[index] = new Node(packed, head);
				return incrementSize();
			}
		}
		
		// Else head instanceof Node
		Node node = (Node)head;
		while (true) {
			byte[] obj = node.object;
			if (equals(key, obj)) {
				node.object = packed;
				return translator.deserializeValue(obj);
			}
			Object next = node.next;
			if (next instanceof byte[]) {
				byte[] nextObj = (byte[])next;
				if (equals(key, nextObj)) {
					node.next = packed;
					return translator.deserializeValue(nextObj);
				} else {
					checkMaxSize();
					node.next = new Node(packed, node.next);
					return incrementSize();
				}
			}
			// Else next instanceof Node
			node = (Node)next;
		}
	}
	
	
	public V remove(Object key) {
		if (key == null)
			throw new NullPointerException();
		if (!translator.isKeyInstance(key))
			return null;
		@SuppressWarnings("unchecked")
		final int index = getIndex((K)key);
		final Object head = table[index];
		
		// Simple cases
		if (head == null)
			return null;
		if (head instanceof byte[]) {
			byte[] headObj = (byte[])head;
			if (equals(key, headObj)) {
				table[index] = null;
				return decrementSize(headObj);
			}
			return null;
		}
		
		// Else head instanceof Node
		Node node = (Node)head;
		if (equals(key, node.object)) {
			table[index] = node.next;
			return decrementSize(node.object);
		}
		Object next = node.next;
		if (next instanceof byte[]) {
			byte[] nextObj = (byte[])next;
			if (equals(key, nextObj)) {
				table[index] = node.object;
				return decrementSize(nextObj);
			}
			return null;
		}
		
		// Else next instanceof Node
		Node nextNode = (Node)next;
		next = null;  // Do not use this variable anymore
		while (true) {
			Object nextNext = nextNode.next;
			if (equals(key, nextNode.object)) {
				node.next = nextNext;
				return decrementSize(nextNode.object);
			}
			if (nextNext instanceof byte[]) {
				byte[] nextNextObj = (byte[])nextNext;
				if (equals(key, nextNextObj)) {
					node.next = nextNode.object;
					return decrementSize(nextNextObj);
				}
				return null;
			}
			// Else nextNext instanceof Node
			node = nextNode;
			nextNode = (Node)nextNext;
		}
	}
	
	
	/* Helper methods */
	
	private int getIndex(K key) {
		return translator.getHash(key) & (table.length - 1);
	}
	
	
	private boolean equals(Object key, byte[] obj) {
		return key.equals(translator.deserializeKey(obj));
	}
	
	
	private void checkMaxSize() {
		if (size == Integer.MAX_VALUE)
			throw new IllegalStateException("Maximum size reached");
	}
	
	
	private V incrementSize() {
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
					int index = getIndex(translator.deserializeKey(obj));
					if (table[index] == null)
						table[index] = obj;
					else
						table[index] = new Node(obj, table[index]);
				}
			}
		}
		return null;  // To save repeated code for the caller
	}
	
	
	private V decrementSize(byte[] obj) {
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
		return translator.deserializeValue(obj);  // To save repeated code for the caller
	}
	
	
	/* Advanced methods */
	
	// Note: The returned entry set's iterator does not support {@code remove()},
	// and the returned map entries do not support {@code setValue()}.
	// Effectively the returned entry set provides a read-only view of this map.
	public Set<Map.Entry<K,V>> entrySet() {
		return new EntrySet();
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
				if (getIndex(translator.deserializeKey(obj)) != i)
					throw new AssertionError();
			}
		}
		if (count != size)
			throw new AssertionError();
	}
	
	
	
	/* Helper classes */
	
	// A linked list non-terminal node.
	private static class Node {
		
		public byte[] object;  // Represents a packed key-value pair. Not null.
		public Object next;    // Either byte[] or Node, not null.
		
		
		// Both arguments must be non-null.
		public Node(byte[] object, Object next) {
			this.object = object;
			this.next = next;
		}
		
	}
	
	
	
	// For the entrySet() method.
	private class EntrySet extends AbstractSet<Map.Entry<K,V>> {
		
		public Iterator<Map.Entry<K,V>> iterator() {
			return new Iter();
		}
		
		public int size() {
			return size;
		}
		
		
		private class Iter implements Iterator<Map.Entry<K,V>>, Map.Entry<K,V> {
			
			private int nextIndex;  // Managed by hasNext()
			private Object chain;   // Set by hasNext(), advanced and cleared by next()
			private K key;          // Set by next()
			private V value;        // Set by next()
			
			
			public Iter() {
				nextIndex = 0;
				chain = null;
			}
			
			
			// Iterator methods
			
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
			
			
			public Map.Entry<K,V> next() {
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
				key = translator.deserializeKey(packed);
				value = translator.deserializeValue(packed);
				return this;
			}
			
			
			public void remove() {
				throw new UnsupportedOperationException();
			}
			
			
			// Map.Entry methods
			
			public K getKey() {
				return key;
			}
			
			public V getValue() {
				return value;
			}
			
			public V setValue(V value) {
				throw new UnsupportedOperationException();
			}
			
		}
		
	}
	
}
