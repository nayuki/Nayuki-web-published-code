/* 
 * Compact hash map
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/compact-hash-map-java
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

import java.util.AbstractMap;
import java.util.AbstractSet;
import java.util.ConcurrentModificationException;
import java.util.Iterator;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;


/**
 * A hash table based map that stores data as byte arrays, but converts to and from regular Java objects
 * on the fly at each query. Requires a translator object for additional functionality.
 */
public final class CompactHashMap<K,V> extends AbstractMap<K,V> {
	
	/*---- Fields ----*/
	
	private byte[][] table;  // Length is always a power of 2. Each element is either null, tombstone, or data. At least one element must be null.
	private int lengthBits;  // Equal to log2(table.length)
	private int size;        // Number of items stored in hash table
	private int filled;      // Items plus tombstones; 0 <= size <= filled < table.length
	private int version;
	private final double loadFactor = 0.5;  // 0 < loadFactor < 1
	private final CompactMapTranslator<K,V> translator;
	
	
	
	/*---- Constructors ----*/
	
	public CompactHashMap(CompactMapTranslator<K,V> trans) {
		if (trans == null)
			throw new NullPointerException();
		this.translator = trans;
		version = -1;
		clear();
	}
	
	
	
	/*---- Basic methods ----*/
	
	public void clear() {
		size = 0;
		table = null;
		version++;
		resize(1);
	}
	
	
	public int size() {
		return size;
	}
	
	
	@SuppressWarnings("unchecked")
	public boolean containsKey(Object key) {
		if (key == null)
			throw new NullPointerException();
		if (!translator.isKeyInstance(key))
			return false;
		return probe((K)key) >= 0;
	}
	
	
	public V get(Object key) {
		if (key == null)
			throw new NullPointerException();
		if (!translator.isKeyInstance(key))
			return null;
		@SuppressWarnings("unchecked")
		int index = probe((K)key);
		if (index >= 0)
			return translator.deserializeValue(table[index]);
		else
			return null;
	}
	
	
	public V put(K key, V value) {
		if (key == null)
			throw new NullPointerException();
		version++;
		int index = probe(key);
		boolean isNew = index < 0;
		V result = isNew ? null : translator.deserializeValue(table[index]);
		if (isNew) {
			if (size == MAX_TABLE_LEN - 1)  // Because table.length is a power of 2, and at least one slot must be free
				throw new IllegalStateException("Maximum size reached");
			index = ~index;
			if (table[index] != TOMBSTONE) {
				filled++;
			}
		}
		table[index] = translator.serialize(key, value);
		if (isNew) {
			incrementSize();
			if (filled == MAX_TABLE_LEN)
				resize(table.length);
		}
		return result;
	}
	
	
	public V remove(Object key) {
		if (key == null)
			throw new NullPointerException();
		if (!translator.isKeyInstance(key))
			return null;
		@SuppressWarnings("unchecked")
		int index = probe((K)key);
		if (index >= 0) {
			V result = translator.deserializeValue(table[index]);
			version++;
			table[index] = TOMBSTONE;
			decrementSize();
			return result;
		} else
			return null;
	}
	
	
	/*---- Helper methods ----*/
	
	// Returns either a match index (non-negative) or the bitwise complement of the first empty slot index (negative).
	private int probe(K key) {
		final int lengthMask = table.length - 1;
		final int hash = translator.getHash(key);
		final int initIndex = hash & lengthMask;
		
		int emptyIndex = -1;
		byte[] item = table[initIndex];
		if (item == null)
			return ~initIndex;
		else if (item == TOMBSTONE)
			emptyIndex = initIndex;
		else if (key.equals(translator.deserializeKey(item)))
			return initIndex;
		
		int increment = Math.max((hash >>> lengthBits) & lengthMask, 1);
		int index = (initIndex + increment) & lengthMask;
		int start = index;
		while (true) {
			item = table[index];
			if (item == null) {
				if (emptyIndex != -1)
					return ~emptyIndex;
				else
					return ~index;
			} else if (item == TOMBSTONE) {
				if (emptyIndex == -1)
					emptyIndex = index;
			} else if (key.equals(translator.deserializeKey(item)))
				return index;
			index = (index + 1) & lengthMask;
			if (index == start)
				throw new AssertionError();
		}
	}
	
	
	private void incrementSize() {
		size++;
		if (table.length < MAX_TABLE_LEN && (double)filled / table.length > loadFactor) {  // Refresh or expand hash table
			int newLen = table.length;
			while (newLen < MAX_TABLE_LEN && (double)size / newLen > loadFactor)
				newLen *= 2;
			resize(newLen);
		}
	}
	
	
	private void decrementSize() {
		size--;
		int newLen = table.length;
		while (newLen >= 2 && (double)size / newLen < loadFactor / 4 && size < newLen / 2)
			newLen /= 2;
		if (newLen < table.length)
			resize(newLen);
	}
	
	
	private void resize(int newLen) {
		if (newLen <= size)
			throw new AssertionError();
		byte[][] oldTable = table;
		table = new byte[newLen][];
		lengthBits = Integer.bitCount(newLen - 1);
		filled = size;
		if (oldTable == null)
			return;
		
		for (byte[] item : oldTable) {
			if (item != null && item != TOMBSTONE) {
				int index = probe(translator.deserializeKey(item));
				if (index >= 0)
					throw new AssertionError();
				table[~index] = item;
			}
		}
	}
	
	
	/*---- Advanced methods ----*/
	
	// Note: The returned entry set's iterator does not support {@code remove()},
	// and the returned map entries do not support {@code setValue()}.
	// Effectively the returned entry set provides a read-only view of this map.
	public Set<Map.Entry<K,V>> entrySet() {
		return new EntrySet();
	}
	
	
	// For unit tests.
	void checkStructure() {
		if (translator == null || table == null || Integer.bitCount(table.length) != 1 || lengthBits != Integer.bitCount(table.length - 1))
			throw new AssertionError();
		if (!(0 <= size && size <= filled && filled < table.length) || loadFactor <= 0 || loadFactor >= 1 || Double.isNaN(loadFactor))
			throw new AssertionError();
		if (table.length < MAX_TABLE_LEN && (double)filled / table.length > loadFactor)
			throw new AssertionError();
		// Note: Do not check for size / table.length < loadFactor / 4 because using the iterator's remove() can generate many empty slots
		
		int count = 0;
		int occupied = 0;
		boolean hasNull = false;
		for (int i = 0; i < table.length; i++) {
			byte[] item = table[i];
			hasNull |= item == null;
			if (item != null) {
				occupied++;
				if (item != TOMBSTONE) {
					count++;
					if (probe(translator.deserializeKey(item)) != i)
						throw new AssertionError();
				}
			}
		}
		if (!hasNull || count != size || occupied != filled)
			throw new AssertionError();
	}
	
	
	// Special placeholder reference for deleted slots. Note that even if the translator returns a
	// 0-length array, the tombstone is considered to be distinct from it, so no confusion can occur.
	private static final byte[] TOMBSTONE = new byte[0];
	
	private static final int MAX_TABLE_LEN = 0x40000000;  // Largest power of 2 that fits in an int
	
	
	
	/*---- Helper classes ----*/
	
	// For the entrySet() method.
	private final class EntrySet extends AbstractSet<Map.Entry<K,V>> {
		
		public int size() {
			return size;
		}
		
		
		public boolean contains(Object obj) {
			if (!(obj instanceof Map.Entry))
				throw new NullPointerException();
			@SuppressWarnings("unchecked")
			Map.Entry<K,V> entry = (Map.Entry<K,V>)obj;
			K key = entry.getKey();
			if (key == null)
				throw new NullPointerException();
			if (!CompactHashMap.this.containsKey(key))
				return false;
			V val0 = entry.getValue();
			V val1 = CompactHashMap.this.get(key);
			return val0 == null && val1 == null || val0 != null && val0.equals(val1);
		}
		
		
		public Iterator<Map.Entry<K,V>> iterator() {
			return new Iter();
		}
		
		
		private final class Iter implements Iterator<Map.Entry<K,V>>, Map.Entry<K,V> {
			
			private final int myVersion;
			private int currentIndex;
			private int nextIndex;
			private K key;    // Set by next()
			private V value;  // Set by next()
			
			
			public Iter() {
				myVersion = version;
				currentIndex = -1;
				nextIndex = 0;
			}
			
			
			// Iterator methods
			
			public boolean hasNext() {
				if (myVersion != version)
					throw new ConcurrentModificationException();
				while (true) {
					if (nextIndex >= table.length)
						return false;
					else if (table[nextIndex] != null && table[nextIndex] != TOMBSTONE)
						return true;
					else
						nextIndex++;
				}
			}
			
			
			public Map.Entry<K,V> next() {
				if (myVersion != version)
					throw new ConcurrentModificationException();
				if (!hasNext())
					throw new NoSuchElementException();
				currentIndex = nextIndex;
				key = translator.deserializeKey(table[currentIndex]);
				value = translator.deserializeValue(table[currentIndex]);
				nextIndex++;
				return this;
			}
			
			
			public void remove() {
				if (myVersion != version)
					throw new ConcurrentModificationException();
				if (currentIndex == -1 || table[currentIndex] == TOMBSTONE)
					throw new IllegalStateException();
				table[currentIndex] = TOMBSTONE;
				size--;  // Note: Do not use decrementSize() because a table resize will screw up the iterator's indexing
			}
			
			
			// Map.Entry methods
			
			public K getKey() {
				return key;
			}
			
			public V getValue() {
				return value;
			}
			
			
			public V setValue(V value) {
				if (myVersion != version)
					throw new ConcurrentModificationException();
				if (currentIndex == -1 || table[currentIndex] == TOMBSTONE)
					throw new IllegalStateException();
				byte[] item = table[currentIndex];
				table[currentIndex] = translator.serialize(translator.deserializeKey(item), value);
				return translator.deserializeValue(item);
			}
			
		}
		
	}
	
}
