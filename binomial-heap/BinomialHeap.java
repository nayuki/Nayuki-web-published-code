/* 
 * Binomial heap (Java)
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

import java.util.AbstractQueue;
import java.util.Iterator;


public final class BinomialHeap<E extends Comparable<? super E>> extends AbstractQueue<E> {
	
	private Node<E> head;
	
	
	
	public BinomialHeap() {
		head = new Node<E>();  // Dummy node
	}
	
	
	
	public int size() {
		int result = 0;
		for (Node<?> node = head.next; node != null; node = node.next) {
			if (node.rank >= 31)
				throw new ArithmeticException("Size overflow");  // The result cannot be returned, however the data structure is still valid
			result |= 1 << node.rank;
		}
		return result;
	}
	
	
	public void clear() {
		head.next = null;
	}
	
	
	public boolean offer(E val) {
		merge(new Node<E>(val));
		return true;
	}
	
	
	public E peek() {
		if (head == null)
			return null;
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
		Node<E> nodeBeforeMin = head;
		for (Node<E> node = head.next, prevNode = head; node != null; prevNode = node, node = node.next) {
			if (min == null || node.value.compareTo(min) < 0) {
				min = node.value;
				nodeBeforeMin = prevNode;
			}
		}
		if (min == null)
			throw new AssertionError();
		
		Node<E> temp = nodeBeforeMin.next;
		nodeBeforeMin.next = nodeBeforeMin.next.next;
		temp.next = null;
		merge(Node.removeRoot(temp));
		return min;
	}
	
	
	// Moves all the values in the given heap into this heap
	public void merge(BinomialHeap<E> other) {
		if (other == this)
			throw new IllegalArgumentException();
		merge(other.head.next);
		other.head.next = null;
	}
	
	
	// Can't support traversal in place; need to clone the heap
	public Iterator<E> iterator() {
		throw new UnsupportedOperationException();
	}
	
	
	// 'other' must not start with a dummy node
	private void merge(Node<E> other) {
		assert head.rank == -1;
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
				tail = tail.next;
			} else if (tail.rank == node.rank + 1) {
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
					tail.next = node.down;
					node.down = tail;
					node.rank++;
					tail = node;
					prevTail.next = tail;
				}
			} else
				throw new AssertionError();
		}
	}
	
	
	// For unit tests
	void checkStructure() {
		if (head.value != null || head.rank != -1)
			throw new AssertionError();
		if (head.next != null) {
			if (head.next.rank <= head.rank)
				throw new AssertionError();
			head.next.checkStructure(true);
		}
	}
	
	
	
	private static final class Node<E> {
		
		public E value;
		public int rank;
		
		public Node<E> down;
		public Node<E> next;
		
		
		
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
		
		
		
		public static <E> Node<E> removeRoot(Node<E> node) {
			assert node.next == null;
			Node<E> result = null;
			node = node.down;
			while (node != null) {  // Reverse the order of nodes from descending rank to ascending rank
				Node<E> next = node.next;
				node.next = result;
				result = node;
				node = next;
			}
			return result;
		}
		
		
		// For unit tests
		void checkStructure(boolean isMain) {
			if (value == null || rank < 0)
				throw new AssertionError();
			if (rank >= 1) {
				if (down == null || down.rank != rank - 1)
					throw new AssertionError();
				down.checkStructure(false);
				if (!isMain) {
					if (next == null || next.rank != rank - 1)
						throw new AssertionError();
					next.checkStructure(false);
				}
			}
			if (isMain && next != null) {
				if (next.rank <= rank)
					throw new AssertionError();
				next.checkStructure(true);
			}
		}
		
	}
	
}
