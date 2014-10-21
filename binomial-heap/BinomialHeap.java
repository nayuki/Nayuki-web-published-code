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
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;


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
		head = null;
	}
	
	
	public boolean offer(E val) {
		head = Node.merge(head, new Node<E>(val));
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
		temp = Node.removeRoot(temp);
		head = Node.merge(head, temp);
		return min;
	}
	
	
	// Moves all the values in the given heap into this heap
	public void merge(BinomialHeap<E> other) {
		if (other == this)
			throw new IllegalArgumentException();
		head = Node.merge(head, other.head.next);
		other.head.next = null;
	}
	
	
	// Can't support traversal in place; need to clone the heap
	public Iterator<E> iterator() {
		throw new UnsupportedOperationException();
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
		
		
		
		// x and the result start with a dummy node, whereas y doesn't
		public static <E extends Comparable<? super E>> Node<E> merge(Node<E> x, Node<E> y) {
			Node<E> head = x;  // Dummy node
			Node<E> tail = head;
			x = x.next;
			
			// An algorithm like bitwise binary addition, starting from the least significant bit
			Node<E> c = null;  // Carry
			List<Node<E>> acc = new ArrayList<Node<E>>();  // Accumulator
			while (x != null || y != null || c != null) {
				int minRank = Integer.MAX_VALUE;
				if (x != null) minRank = Math.min(x.rank, minRank);
				if (y != null) minRank = Math.min(y.rank, minRank);
				if (c != null) minRank = Math.min(c.rank, minRank);
				assert minRank >= 0 && minRank != Integer.MAX_VALUE;
				
				if (x != null && x.rank == minRank) {
					Node<E> temp = x;
					x = x.next;
					temp.next = null;
					acc.add(temp);
				}
				if (y != null && y.rank == minRank) {
					Node<E> temp = y;
					y = y.next;
					temp.next = null;
					acc.add(temp);
				}
				if (c != null && c.rank == minRank) {
					acc.add(c);
					c = null;
				}
				
				if (acc.size() >= 2) {
					// Merge two nodes of the same rank that are detached from the main chain, assigning the new root
					Node<E> u = acc.remove(0);
					Node<E> v = acc.remove(0);
					assert u.rank == v.rank && u.next == null && v.next == null;
					if (u.value.compareTo(v.value) <= 0) {
						v.next = u.down;
						u.down = v;
						u.rank++;
						c = u;
					} else {
						u.next = v.down;
						v.down = u;
						v.rank++;
						c = v;
					}
				}
				if (acc.size() >= 1)
					tail = tail.next = acc.remove(0);
				assert acc.size() == 0;
			}
			
			return head;  // Starts with dummy node
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
