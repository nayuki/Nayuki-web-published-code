/* 
 * Binomial heap (Java)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
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

import java.util.AbstractQueue;
import java.util.Iterator;
import java.util.Objects;


public final class BinomialHeap<E extends Comparable<? super E>> extends AbstractQueue<E> {
	
	/*---- Fields ----*/
	
	// Only the reference is fixed; all the contents are mutable
	private final Node<E> head;
	
	
	
	/*---- Constructors ----*/
	
	public BinomialHeap() {
		head = new Node<E>();  // Dummy node
	}
	
	
	
	/*---- Methods ----*/
	
	public boolean isEmpty() {
		return head.next == null;
	}
	
	
	public int size() {
		int result = 0;
		for (Node<?> node = head.next; node != null; node = node.next) {
			if (node.rank >= 31) {
				// The result cannot be returned, however the data structure is still valid
				throw new ArithmeticException("Size overflow");
			}
			result |= 1 << node.rank;
		}
		return result;
	}
	
	
	public void clear() {
		head.next = null;
	}
	
	
	public boolean offer(E val) {
		Objects.requireNonNull(val);
		merge(new Node<E>(val));
		return true;
	}
	
	
	public E peek() {
		E result = null;
		for (Node<E> node = head.next; node != null; node = node.next) {
			if (result == null || node.value.compareTo(result) < 0)
				result = node.value;
		}
		return result;
	}
	
	
	public E poll() {
		if (head.next == null)
			return null;
		E min = null;
		Node<E> nodeBeforeMin = null;
		for (Node<E> prevNode = head; ; ) {
			Node<E> node = prevNode.next;
			if (node == null)
				break;
			if (min == null || node.value.compareTo(min) < 0) {
				min = node.value;
				nodeBeforeMin = prevNode;
			}
			prevNode = node;
		}
		assert min != null && nodeBeforeMin != null;
		
		Node<E> minNode = nodeBeforeMin.next;
		nodeBeforeMin.next = minNode.next;
		minNode.next = null;
		merge(minNode.removeRoot());
		return min;
	}
	
	
	// Moves all the values in the given heap into this heap
	public void merge(BinomialHeap<E> other) {
		if (other == this)
			throw new IllegalArgumentException();
		merge(other.head.next);
		other.head.next = null;
	}
	
	
	// Can't support min-order traversal in place; would need to clone the heap
	public Iterator<E> iterator() {
		throw new UnsupportedOperationException();
	}
	
	
	private void merge(Node<E> other) {
		assert other == null || other.rank >= 0;
		Node<E> self = head.next;
		head.next = null;
		Node<E> prevTail = null;
		Node<E> tail = head;
		
		while (self != null || other != null) {
			Node<E> node;
			if (other == null || self != null && self.rank <= other.rank) {
				node = self;
				self = self.next;
			} else {
				node = other;
				other = other.next;
			}
			node.next = null;
			
			assert tail.next == null;
			if (tail.rank < node.rank) {
				prevTail = tail;
				tail.next = node;
				tail = node;
			} else if (tail.rank == node.rank + 1) {
				assert prevTail != null;
				node.next = tail;
				prevTail.next = node;
				prevTail = node;
			} else if (tail.rank == node.rank) {
				// Merge nodes
				if (tail.value.compareTo(node.value) <= 0) {
					node.next = tail.down;
					tail.down = node;
					tail.rank++;
				} else {
					assert prevTail != null;
					tail.next = node.down;
					node.down = tail;
					node.rank++;
					tail = node;
					prevTail.next = node;
				}
			} else
				throw new AssertionError();
		}
	}
	
	
	// For unit tests
	void checkStructure() {
		if (head.value != null || head.rank != -1)
			throw new AssertionError("Head must be dummy node");
		// Check chain of nodes and their children
		head.checkStructure(true, null);
	}
	
	
	
	/*---- Helper class: Binomial heap node ----*/
	
	private static final class Node<E extends Comparable<? super E>> {
		
		/*-- Fields --*/
		
		public E value;
		public int rank;
		
		public Node<E> down;
		public Node<E> next;
		
		
		/*-- Constructors --*/
		
		// Dummy sentinel node at head of list
		public Node() {
			this(null);
			rank = -1;
		}
		
		
		// Regular node
		public Node(E val) {
			value = val;
			rank = 0;
			down = null;
			next = null;
		}
		
		
		/*-- Methods --*/
		
		public Node<E> removeRoot() {
			assert next == null;
			Node<E> result = null;
			Node<E> node = down;
			while (node != null) {  // Reverse the order of nodes from descending rank to ascending rank
				Node<E> next = node.next;
				node.next = result;
				result = node;
				node = next;
			}
			return result;
		}
		
		
		// For unit tests
		void checkStructure(boolean isMain, E lowerBound) {
			// Basic checks
			if ((rank < 0) != (value == null))
				throw new AssertionError("Invalid node rank or value");
			if (isMain != (lowerBound == null))
				throw new AssertionError("Invalid arguments");
			if (!isMain && value.compareTo(lowerBound) < 0)
				throw new AssertionError("Min-heap property violated");
			
			// Check children and non-main chains
			if (rank > 0) {
				if (down == null || down.rank != rank - 1)
					throw new AssertionError("Down node absent or has invalid rank");
				down.checkStructure(false, value);
				if (!isMain) {
					if (next == null || next.rank != rank - 1)
						throw new AssertionError("Next node absent or has invalid rank");
					next.checkStructure(false, lowerBound);
				}
			} else if (down != null)
				throw new AssertionError("Down node must be absent");
			
			// Check main chain
			if (isMain && next != null) {
				if (next.rank <= rank)
					throw new AssertionError("Next node has invalid rank");
				next.checkStructure(true, null);
			}
		}
		
	}
	
}
