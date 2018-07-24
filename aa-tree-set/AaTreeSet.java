/* 
 * AA tree set (Java)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/aa-tree-set
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
import java.util.Collection;
import java.util.HashSet;
import java.util.Iterator;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;
import java.util.Stack;


public final class AaTreeSet<E extends Comparable<? super E>> extends AbstractSet<E> {
	
	/*---- Fields ----*/
	
	private Node<E> root;  // Never null
	
	private int size;
	
	
	
	/*---- Constructors ----*/
	
	public AaTreeSet() {
		clear();
	}
	
	
	public AaTreeSet(Collection<? extends E> coll) {
		this();
		Objects.requireNonNull(coll);
		addAll(coll);
	}
	
	
	
	/*---- Methods ----*/
	
	@SuppressWarnings("unchecked")
	public void clear() {
		root = (Node<E>)Node.EMPTY_LEAF;
		size = 0;
	}
	
	
	public int size() {
		return size;
	}
	
	
	public boolean contains(E val) {
		Objects.requireNonNull(val);
		for (Node<E> node = root; node != Node.EMPTY_LEAF; ) {
			int cmp = val.compareTo(node.value);
			if (cmp < 0)
				node = node.left;
			else if (cmp > 0)
				node = node.right;
			else
				return true;
		}
		return false;
	}
	
	
	public boolean add(E val) {
		Objects.requireNonNull(val);
		if (size == Integer.MAX_VALUE)
			throw new IllegalStateException("Maximum size reached");
		if (contains(val))
			return false;
		root = root.add(val);
		size++;
		return true;
	}
	
	
	public boolean remove(E val) {
		Objects.requireNonNull(val);
		if (!contains(val))
			return false;
		root = root.remove(val);
		size--;
		return true;
	}
	
	
	public Iterator<E> iterator() {
		return new Iter();
	}
	
	
	void checkStructure() {
		HashSet<Node<E>> visited = new HashSet<Node<E>>();
		if (root.checkStructure(visited) != size || visited.size() != size)
			throw new AssertionError();
	}
	
	
	
	/*---- Helper class: AA tree node ----*/
	
	private static final class Node<E extends Comparable<? super E>> {
		
		/*-- Fields --*/
		
		public E value;
		private byte level;
		public Node<E> left;
		public Node<E> right;
		
		
		/*-- Constructors --*/
		
		public Node() {
			value = null;
			level = 0;
			left  = null;
			right = null;
		}
		
		
		@SuppressWarnings("unchecked")
		public Node(E val) {
			assert val != null;
			value = val;
			level = 1;
			left  = (Node<E>)EMPTY_LEAF;
			right = (Node<E>)EMPTY_LEAF;
		}
		
		
		/*-- Methods --*/
		
		public Node<E> add(E val) {
			if (this == EMPTY_LEAF)
				return new Node<>(val);
			int cmp = val.compareTo(value);
			if (cmp < 0)
				left = left.add(val);
			else if (cmp > 0)
				right = right.add(val);
			else
				throw new AssertionError("Value already in tree");
			return skew().split();  // Rebalance this node
		}
		
		
		@SuppressWarnings("unchecked")
		public Node<E> remove(E val) {
			if (this == EMPTY_LEAF)
				throw new AssertionError("Value not in tree");
			int cmp = val.compareTo(value);
			if (cmp < 0)
				left = left.remove(val);
			else if (cmp > 0)
				right = right.remove(val);
			else {  // Remove value at this node
				if (left != EMPTY_LEAF) {
					// Find predecessor node
					Node<E> temp = left;
					while (temp.right != EMPTY_LEAF)
						temp = temp.right;
					value = temp.value;  // Replace value with predecessor
					left = left.remove(value);  // Remove predecessor node
				} else if (right != EMPTY_LEAF) {
					// Find successor node
					Node<E> temp = right;
					while (temp.left != EMPTY_LEAF)
						temp = temp.left;
					value = temp.value;  // Replace value with successor
					right = right.remove(value);  // Remove successor node
				} else {
					assert level == 1;
					return EMPTY_LEAF;
				}
			}
			
			// Rebalance this node if a child was lowered
			if (this.level == Math.min(left.level, right.level) + 1)
				return this;
			if (right.level == this.level)
				right.level--;
			this.level--;
			Node<E> result = this.skew();
			result.right = result.right.skew();
			if (result.right.right != EMPTY_LEAF)
				result.right.right = result.right.right.skew();
			result = result.split();
			result.right = result.right.split();
			return result;
		}
		
		
		/* 
		 *       |          |
		 *   A - B    ->    A - B
		 *  /   / \        /   / \
		 * 0   1   2      0   1   2
		 */
		private Node<E> skew() {
			assert this != EMPTY_LEAF;
			if (left.level < this.level)
				return this;
			Node<E> result = this.left;
			this.left = result.right;
			result.right = this;
			return result;
		}
		
		
		/* 
		 *   |                      |
		 *   |                    - B -
		 *   |                   /     \
		 *   A - B - C    ->    A       C
		 *  /   /   / \        / \     / \
		 * 0   1   2   3      0   1   2   3
		 */
		private Node<E> split() {
			assert this != EMPTY_LEAF;
			// Must short-circuit because if right.level < self.level, then right.right might be null
			if (right.level < this.level || right.right.level < this.level)
				return this;
			Node<E> result = right;
			this.right = result.left;
			result.left = this;
			result.level++;
			return result;
		}
		
		
		int checkStructure(Set<Node<E>> visitedNodes) {
			if (this == EMPTY_LEAF)
				return 0;
			if (!visitedNodes.add(this))
				throw new AssertionError();
			
			if (value == null || left == null || right == null)
				throw new AssertionError();
			if (!(this.level > 0 && this.level == left.level + 1 && (this.level == right.level + 1 || this.level == right.level)))
				throw new AssertionError();
			if (this.level == right.level && this.level == right.right.level)  // Must short-circuit evaluate
				throw new AssertionError();
			if (left != EMPTY_LEAF && !(left.value.compareTo(this.value) < 0))
				throw new AssertionError();
			if (right != EMPTY_LEAF && !(right.value.compareTo(this.value) > 0))
				throw new AssertionError();
			
			int size = 1 + left.checkStructure(visitedNodes) + right.checkStructure(visitedNodes);
			if (size < (1 << level) - 1)
				throw new AssertionError();
			// Not checked, but (size <= 3^level - 1) is also true
			return size;
		}
		
		
		@SuppressWarnings("rawtypes")
		public static final Node EMPTY_LEAF = new Node();
		
	}
	
	
	
	/*---- Helper class: Binary search tree iterator ----*/
	
	// Note: Not fail-fast on concurrent modification.
	private final class Iter implements Iterator<E> {
		
		/*-- Fields --*/
		
		private Stack<Node<E>> stack;
		
		
		/*-- Constructors --*/
		
		public Iter() {
			stack = new Stack<>();
			for (Node<E> node = root; node != Node.EMPTY_LEAF; node = node.left)
				stack.push(node);
		}
		
		
		/*-- Methods --*/
		
		public boolean hasNext() {
			return !stack.isEmpty();
		}
		
		
		public E next() {
			if (!hasNext())
				throw new NoSuchElementException();
			Node<E> node = stack.pop();
			E result = node.value;
			for (node = node.right; node != Node.EMPTY_LEAF; node = node.left)
				stack.push(node);
			return result;
		}
		
		
		public void remove() {
			throw new UnsupportedOperationException();
		}
		
	}
	
}
