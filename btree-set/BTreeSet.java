/* 
 * B-tree set (Java)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/btree-set
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

import java.util.AbstractSet;
import java.util.Arrays;
import java.util.Collection;
import java.util.Comparator;
import java.util.Iterator;
import java.util.NoSuchElementException;
import java.util.SortedSet;
import java.util.Stack;


public final class BTreeSet<E extends Comparable<? super E>>
	extends AbstractSet<E> implements SortedSet<E> {
	
	/*---- Fields ----*/
	
	private Node<E> root;  // Not null
	private int size;  // Non-negative
	private final int minKeys;  // At least 1, equal to degree-1
	private final int maxKeys;  // At least 3, odd number, equal to minKeys*2+1
	
	
	
	/*---- Constructors ----*/
	
	// The degree is the minimum number of children each non-root internal node must have.
	public BTreeSet(int degree) {
		if (degree < 2)
			throw new IllegalArgumentException("Degree must be at least 2");
		if (degree * 2L > Integer.MAX_VALUE)  // In other words, need maxChildren <= INT_MAX
			throw new IllegalArgumentException("Degree too large");
		minKeys = degree - 1;
		maxKeys = degree * 2 - 1;
		clear();
	}
	
	
	public BTreeSet(int degree, Collection<E> coll) {
		this(degree);
		addAll(coll);
	}
	
	
	
	/*---- Methods ----*/
	
	public int size() {
		return size;
	}
	
	
	public void clear() {
		root = new Node<>(maxKeys, true);
		size = 0;
	}
	
	
	public boolean contains(Object obj) {
		if (obj == null)
			throw new NullPointerException();
		@SuppressWarnings("unchecked")
		E key = (E)obj;
		
		// Walk down the tree
		Node<E> node = root;
		while (true) {
			int index = node.search(key);
			if (index >= 0)
				return true;
			else if (node.isLeaf())
				return false;
			else  // Internal node
				node = node.children[~index];
		}
	}
	
	
	public boolean add(E obj) {
		if (obj == null)
			throw new NullPointerException();
		
		// Special preprocessing to split root node
		if (root.numKeys == maxKeys) {
			Node<E> child = root;
			root = new Node<>(maxKeys, false);  // Increment tree height
			root.children[0] = child;
			root.splitChild(0);
		}
		
		// Walk down the tree
		Node<E> node = root;
		while (true) {
			// Search for index in current node
			assert node.numKeys < maxKeys;
			assert node == root || node.numKeys >= minKeys;
			int index = node.search(obj);
			if (index >= 0)
				return false;  // Key already exists in tree
			index = ~index;
			assert index >= 0;
			
			if (node.isLeaf()) {  // Simple insertion into leaf
				if (size == Integer.MAX_VALUE)
					throw new IllegalStateException("Maximum size reached");
				node.insertKeyAndChild(index, obj, -1, null);
				size++;
				return true;
			} else {  // Handle internal node
				Node<E> child = node.children[index];
				if (child.numKeys == maxKeys) {  // Split child node
					node.splitChild(index);
					int cmp = obj.compareTo(node.keys[index]);
					if (cmp == 0)
						return false;  // Key already exists in tree
					else if (cmp > 0)
						child = node.children[index + 1];
				}
				node = child;
			}
		}
	}
	
	
	public boolean remove(Object obj) {
		if (obj == null)
			throw new NullPointerException();
		@SuppressWarnings("unchecked")
		E key = (E)obj;
		
		// Walk down the tree
		int index = root.search(key);
		Node<E> node = root;
		while (true) {
			assert node.numKeys <= maxKeys;
			assert node == root || node.numKeys > minKeys;
			if (node.isLeaf()) {
				if (index >= 0) {  // Simple removal from leaf
					node.removeKeyAndChild(index, -1);
					size--;
					return true;
				} else
					return false;
				
			} else {  // Internal node
				if (index >= 0) {  // Key is stored at current node
					Node<E> left  = node.children[index + 0];
					Node<E> right = node.children[index + 1];
					assert left != null && right != null;
					if (left.numKeys > minKeys) {  // Replace key with predecessor
						node.keys[index] = left.removeMax();
						size--;
						return true;
					} else if (right.numKeys > minKeys) {  // Replace key with successor
						node.keys[index] = right.removeMin();
						size--;
						return true;
					} else {  // Merge key and right node into left node, then recurse
						node.mergeChildren(index);
						if (node == root && root.numKeys == 0) {
							root = root.children[0];  // Decrement tree height
							assert root != null;
						}
						node = left;
						index = minKeys;  // Index known due to merging; no need to search
					}
				} else {  // Key might be found in some child
					Node<E> child = node.ensureChildRemove(~index);
					if (node == root && root.numKeys == 0) {
						root = root.children[0];  // Decrement tree height
						assert root != null;
					}
					node = child;
					index = node.search(key);
				}
			}
		}
	}
	
	
	public E first() {
		if (size == 0)
			throw new NoSuchElementException();
		Node<E> node = root;
		while (!node.isLeaf())
			node = node.children[0];
		return node.keys[0];
	}
	
	
	public E last() {
		if (size == 0)
			throw new NoSuchElementException();
		Node<E> node = root;
		while (!node.isLeaf())
			node = node.children[node.numKeys];
		return node.keys[node.numKeys - 1];
	}
	
	
	// Note: Not fail-fast on concurrent modification.
	public Iterator<E> iterator() {
		return new Iter();
	}
	
	
	public Comparator<? super E> comparator() {
		return new Comparator<E>() {  // Natural ordering
			public int compare(E x, E y) {
				return x.compareTo(y);
			}
		};
	}
	
	
	public SortedSet<E> subSet(E fromElement, E toElement) {
		throw new UnsupportedOperationException();
	}
	
	public SortedSet<E> headSet(E toElement) {
		throw new UnsupportedOperationException();
	}
	
	public SortedSet<E> tailSet(E fromElement) {
		throw new UnsupportedOperationException();
	}
	
	
	// For unit tests
	void checkStructure() {
		// Check size and root node properties
		if (size < 0 || root == null || size > maxKeys && root.isLeaf()
				|| size <= minKeys * 2 && (!root.isLeaf() || root.numKeys != size))
			throw new AssertionError("Invalid size or root type");
		
		// Calculate height by descending into one branch
		int height = 0;
		for (Node<E> node = root; !node.isLeaf(); node = node.children[0])
			height++;
		
		// Check all nodes and total size
		if (root.checkStructure(true, height, null, null) != size)
			throw new AssertionError("Size mismatch");
	}
	
	
	
	/*---- Helper class: B-tree node ----*/
	
	private static final class Node<E extends Comparable<? super E>> {
		
		/*-- Fields --*/
		
		public final E[] keys;  // Length equal to maxKeys, not null
		public final Node<E>[] children;  // Null if leaf node, length maxKeys+1 if internal node
		public int numKeys;  // Range is [0, maxKeys] for root, but [minKeys, maxKeys] for all other nodes
		
		
		/*-- Constructors --*/
		
		// Note: Once created, a node's structure never changes between a leaf and internal node.
		@SuppressWarnings("unchecked")
		public Node(int maxKeys, boolean leaf) {
			if (maxKeys < 3 || maxKeys % 2 != 1)
				throw new IllegalArgumentException();
			keys = (E[])new Comparable[maxKeys];
			children = leaf ? null : new Node[maxKeys + 1];
			numKeys = 0;
		}
		
		
		/*-- Methods --*/
		
		private int minKeys() {
			return keys.length / 2;
		}
		
		
		private int maxKeys() {
			return keys.length;
		}
		
		
		public boolean isLeaf() {
			return children == null;
		}
		
		
		// Searches this node's keys array and returns i (non-negative) if obj equals keys[i],
		// otherwise returns ~i (negative) if children[i] should be explored. For simplicity,
		// the implementation uses linear search. It's possible to replace it with binary search for speed.
		public int search(E obj) {
			int i = 0;
			while (i < numKeys) {
				int cmp = obj.compareTo(keys[i]);
				if (cmp == 0)
					return i;  // Key found
				else if (cmp > 0)
					i++;
				else  // cmp < 0
					break;
			}
			return ~i;  // Not found, caller should recurse on child
		}
		
		
		// Removes and returns the minimum key among the whole subtree rooted at this node.
		public E removeMin() {
			Node<E> node = this;
			while (!node.isLeaf()) {
				assert node.numKeys > minKeys();
				node = node.ensureChildRemove(0);
			}
			assert node.numKeys > minKeys();
			return node.removeKeyAndChild(0, -1);
		}
		
		
		// Removes and returns the maximum key among the whole subtree rooted at this node.
		public E removeMax() {
			Node<E> node = this;
			while (!node.isLeaf()) {
				assert node.numKeys > minKeys();
				node = node.ensureChildRemove(node.numKeys);
			}
			assert node.numKeys > minKeys();
			return node.removeKeyAndChild(node.numKeys - 1, -1);
		}
		
		
		// Inserts the given key and child into this node's arrays at the given indices, incrementing the number of keys.
		public void insertKeyAndChild(int keyIndex, E key, int childIndex, Node<E> child) {
			if (numKeys < 0 || numKeys >= maxKeys())
				throw new IllegalStateException();
			if (keyIndex < 0 || keyIndex > numKeys)
				throw new IndexOutOfBoundsException();
			
			// Handle children array
			if (isLeaf()) {
				if (childIndex != -1)
					throw new IllegalArgumentException();
			} else {
				if (childIndex < 0 || childIndex > numKeys + 1)
					throw new IndexOutOfBoundsException();
				System.arraycopy(children, childIndex, children, childIndex + 1, numKeys + 1 - childIndex);
				children[childIndex] = child;
			}
			
			// Handle keys array
			System.arraycopy(keys, keyIndex, keys, keyIndex + 1, numKeys - keyIndex);
			keys[keyIndex] = key;
			numKeys++;
		}
		
		
		// Removes and returns this node's key at the given index, decrementing the number of keys.
		// Also must remove a child at the given index if this is not a leaf node.
		public E removeKeyAndChild(int keyIndex, int childIndex) {
			if (numKeys < 1 || numKeys > keys.length)
				throw new IllegalStateException();
			if (keyIndex < 0 || keyIndex >= numKeys)
				throw new IndexOutOfBoundsException();
			
			// Handle children array
			if (isLeaf()) {
				if (childIndex != -1)
					throw new IllegalArgumentException();
			} else {
				if (childIndex < 0 || childIndex >= numKeys + 1)
					throw new IndexOutOfBoundsException();
				assert children[childIndex] != null;
				System.arraycopy(children, childIndex + 1, children, childIndex, numKeys - childIndex);
				children[numKeys] = null;
			}
			
			// Handle keys array
			E result = keys[keyIndex];
			assert result != null;
			System.arraycopy(keys, keyIndex + 1, keys, keyIndex, numKeys - 1 - keyIndex);
			keys[numKeys - 1] = null;
			numKeys--;
			return result;
		}
		
		
		// For the child node at the given index, this moves the right half of keys and children to a new node,
		// and adds the middle key and new child to this node. The left half of child's data is not moved.
		public void splitChild(int index) {
			if (this.isLeaf() || this.numKeys >= maxKeys())
				throw new IllegalStateException("Cannot split child node");
			Node<E> left = this.children[index];
			if (left.numKeys != maxKeys())
				throw new IllegalStateException("Can only split full node");
			Node<E> right = new Node<>(maxKeys(), left.isLeaf());
			int minKeys = minKeys();
			
			// Handle children
			if (!left.isLeaf()) {
				System.arraycopy(left.children, minKeys + 1, right.children, 0, minKeys + 1);
				Arrays.fill(left.children, minKeys + 1, left.children.length, null);
			}
			
			// Handle keys
			E middleKey = left.keys[minKeys];
			System.arraycopy(left.keys, minKeys + 1, right.keys, 0, minKeys);
			Arrays.fill(left.keys, minKeys, left.keys.length, null);
			left.numKeys = minKeys;
			right.numKeys = minKeys;
			
			this.insertKeyAndChild(index, middleKey, index + 1, right);
		}
		
		
		// Merges the child node at index+1 into the child node at index,
		// assuming the current node is not empty and both children have minkeys.
		public void mergeChildren(int index) {
			if (isLeaf() || numKeys == 0)
				throw new IllegalStateException("Cannot merge children");
			Node<E> left  = children[index + 0];
			Node<E> right = children[index + 1];
			if (left.numKeys != minKeys() || right.numKeys != minKeys())
				throw new IllegalStateException("Cannot merge children");
			if (!left.isLeaf())
				System.arraycopy(right.children, 0, left.children, minKeys() + 1, minKeys() + 1);
			left.keys[minKeys()] = removeKeyAndChild(index, index + 1);
			System.arraycopy(right.keys, 0, left.keys, minKeys() + 1, minKeys());
			left.numKeys += minKeys() + 1;
		}
		
		
		// Performs modifications to ensure that this node's child at the given index has at least
		// minKeys+1 keys in preparation for a single removal. The child may gain a key and subchild
		// from its sibling, or it may be merged with a sibling, or nothing needs to be done.
		// A reference to the appropriate child is returned, which is helpful if the old child no longer exists.
		public Node<E> ensureChildRemove(int index) {
			// Preliminaries
			assert !isLeaf();
			Node<E> child = children[index];
			if (child.numKeys > minKeys())  // Already satisfies the condition
				return child;
			assert child.numKeys == minKeys();
			
			// Get siblings
			Node<E> left = index >= 1 ? children[index - 1] : null;
			Node<E> right = index < this.numKeys ? children[index + 1] : null;
			boolean internal = !child.isLeaf();
			assert left != null || right != null;  // At least one sibling exists because degree >= 2
			assert left  == null || left .isLeaf() != internal;  // Sibling must be same type (internal/leaf) as child
			assert right == null || right.isLeaf() != internal;  // Sibling must be same type (internal/leaf) as child
			
			if (left != null && left.numKeys > minKeys()) {  // Steal rightmost item from left sibling
				child.insertKeyAndChild(0, this.keys[index - 1],
					(internal ? 0 : -1), (internal ? left.children[left.numKeys] : null));
				this.keys[index - 1] = left.removeKeyAndChild(left.numKeys - 1, (internal ? left.numKeys : -1));
				return child;
			} else if (right != null && right.numKeys > minKeys()) {  // Steal leftmost item from right sibling
				child.insertKeyAndChild(child.numKeys, this.keys[index],
					(internal ? child.numKeys + 1 : -1), (internal ? right.children[0] : null));
				this.keys[index] = right.removeKeyAndChild(0, (internal ? 0 : -1));
				return child;
			} else if (left != null) {  // Merge child into left sibling
				mergeChildren(index - 1);
				return left;  // This is the only case where the return value is different
			} else if (right != null) {  // Merge right sibling into child
				mergeChildren(index);
				return child;
			} else
				throw new AssertionError("Impossible condition");
		}
		
		
		// Checks the structure recursively and returns the total number
		// of keys in the subtree rooted at this node. For unit tests.
		int checkStructure(boolean isRoot, int leafDepth, E min, E max) {
			// Check basic fields
			if (isLeaf() != (leafDepth == 0))
				throw new AssertionError("Incorrect leaf/internal node type");
			if (numKeys < 0 || numKeys > maxKeys())
				throw new AssertionError("Invalid number of keys");
			if (isRoot && !isLeaf() && numKeys <= 0)
				throw new AssertionError("Invalid number of keys");
			else if (!isRoot && numKeys < minKeys())
				throw new AssertionError("Invalid number of keys");
			
			// Check keys
			for (int i = 0; i < keys.length; i++) {
				E key = keys[i];
				if ((key != null) != (i < numKeys))
					throw new AssertionError("Invalid filling of key array");
				if (i < numKeys) {
					boolean fail = i == 0 && min != null && key.compareTo(min) <= 0;
					fail |= i >= 1 && key.compareTo(keys[i - 1]) <= 0;
					fail |= i == numKeys - 1 && max != null && key.compareTo(max) >= 0;
					if (fail)
						throw new AssertionError("Invalid key ordering");
				}
			}
			
			// Count keys in this subtree
			long count = numKeys;
			if (!isLeaf()) {
				// Check children pointers and recurse
				for (int i = 0; i < children.length; i++) {
					if ((children[i] != null) != (i <= numKeys))
						throw new AssertionError("Invalid filling of children array");
					if (i <= numKeys)
						count += children[i].checkStructure(false, leafDepth - 1, (i == 0 ? min : keys[i - 1]), (i == numKeys ? max : keys[i]));
					if (count > Integer.MAX_VALUE)
						throw new AssertionError("Size overflow");
				}
			}
			return (int)count;
		}
		
	}
	
	
	
	/*---- Helper class: B-tree iterator ----*/
	
	private final class Iter implements Iterator<E> {
		
		/*-- Fields --*/
		
		private Stack<Node<E>> nodeStack;
		private Stack<Integer> indexStack;
		
		
		/*-- Constructors --*/
		
		public Iter() {
			nodeStack  = new Stack<>();
			indexStack = new Stack<>();
			if (root.numKeys == 0)
				return;
			pushLeftPath(root);
		}
		
		
		/*-- Methods --*/
		
		public boolean hasNext() {
			return !nodeStack.isEmpty();
		}
		
		
		public E next() {
			if (!hasNext())
				throw new NoSuchElementException();
			
			Node<E> node = nodeStack.peek();
			int index = indexStack.pop();
			E result = node.keys[index];
			index++;
			if (index < node.numKeys)
				indexStack.push(index);
			else
				nodeStack.pop();
			if (!node.isLeaf())
				pushLeftPath(node.children[index]);
			return result;
		}
		
		
		public void remove() {
			throw new UnsupportedOperationException();
		}
		
		
		private void pushLeftPath(Node<E> node) {
			while (true) {
				nodeStack.push(node);
				indexStack.push(0);
				if (node.isLeaf())
					break;
				node = node.children[0];
			}
		}
		
	}
	
}
