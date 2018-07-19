/* 
 * AVL tree list (Java)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/avl-tree-list
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

import java.util.AbstractList;
import java.util.Collection;
import java.util.HashSet;
import java.util.Iterator;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.Stack;


public final class AvlTreeList<E> extends AbstractList<E> {
	
	/*---- Fields ----*/
	
	private Node<E> root;  // Never null
	
	
	
	/*---- Constructors ----*/
	
	public AvlTreeList() {
		clear();
	}
	
	
	public AvlTreeList(Collection<? extends E> coll) {
		this();
		addAll(coll);
	}
	
	
	
	/*---- Methods ----*/
	
	// Must not exceed Integer.MAX_VALUE.
	public int size() {
		return root.size;
	}
	
	
	public E get(int index) {
		if (index < 0 || index >= size())
			throw new IndexOutOfBoundsException();
		return root.getNodeAt(index).value;
	}
	
	
	public E set(int index, E val) {
		if (index < 0 || index >= size())
			throw new IndexOutOfBoundsException();
		Node<E> node = root.getNodeAt(index);
		E result = node.value;
		node.value = val;
		return result;
	}
	
	
	public void add(int index, E val) {
		if (index < 0 || index > size())  // Different constraint than the other methods
			throw new IndexOutOfBoundsException();
		if (size() == Integer.MAX_VALUE)
			throw new IllegalStateException("Maximum size reached");
		root = root.insertAt(index, val);
	}
	
	
	public E remove(int index) {
		if (index < 0 || index >= size())
			throw new IndexOutOfBoundsException();
		E result = get(index);
		root = root.removeAt(index);
		return result;
	}
	
	
	@SuppressWarnings("unchecked")
	public void clear() {
		root = (Node<E>)Node.EMPTY_LEAF;
	}
	
	
	public Iterator<E> iterator() {
		return new Iter();
	}
	
	
	// For unit tests.
	void checkStructure() {
		root.checkStructure(new HashSet<Node<E>>());
	}
	
	
	
	/*---- Helper class: AVL tree node ----*/
	
	private static final class Node<E> {
		
		// A bit of a hack, but more elegant than using null values as leaf nodes.
		public static final Node<?> EMPTY_LEAF = new Node<Object>();
		
		
		/*-- Fields --*/
		
		// The object stored at this node. Can be null.
		public E value;
		
		// The height of the tree rooted at this node. Empty nodes have height 0.
		// This node has height equal to max(left.height, right.height) + 1.
		public int height;
		
		// The number of non-empty nodes in the tree rooted at this node, including this node.
		// Empty nodes have size 0. This node has size equal to left.size + right.size + 1.
		public int size;
		
		// The root node of the left subtree.
		public Node<E> left;
		
		// The root node of the right subtree.
		public Node<E> right;
		
		
		/*-- Constructors --*/
		
		// For the singleton empty leaf node.
		private Node() {
			value  = null;
			height = 0;
			size   = 0;
			left   = null;
			right  = null;
		}
		
		
		// Normal non-leaf nodes.
		@SuppressWarnings("unchecked")
		private Node(E val) {
			value  = val;
			height = 1;
			size   = 1;
			left   = (Node<E>)EMPTY_LEAF;
			right  = (Node<E>)EMPTY_LEAF;
		}
		
		
		/*-- Methods --*/
		
		public Node<E> getNodeAt(int index) {
			assert 0 <= index && index < size;
			if (this == EMPTY_LEAF)
				throw new IllegalArgumentException();
			
			int leftSize = left.size;
			if (index < leftSize)
				return left.getNodeAt(index);
			else if (index > leftSize)
				return right.getNodeAt(index - leftSize - 1);
			else
				return this;
		}
		
		
		public Node<E> insertAt(int index, E obj) {
			assert 0 <= index && index <= size;
			if (this == EMPTY_LEAF) {
				if (index == 0)
					return new Node<>(obj);
				else
					throw new IndexOutOfBoundsException();
			}
			
			int leftSize = left.size;
			if (index <= leftSize)
				left = left.insertAt(index, obj);
			else
				right = right.insertAt(index - leftSize - 1, obj);
			recalculate();
			return balance();
		}
		
		
		@SuppressWarnings("unchecked")
		public Node<E> removeAt(int index) {
			assert 0 <= index && index < size;
			if (this == EMPTY_LEAF)
				throw new IllegalArgumentException();
			
			int leftSize = left.size;
			if (index < leftSize)
				left = left.removeAt(index);
			else if (index > leftSize)
				right = right.removeAt(index - leftSize - 1);
			else if (left == EMPTY_LEAF && right == EMPTY_LEAF)
				return (Node<E>)EMPTY_LEAF;
			else if (left != EMPTY_LEAF && right == EMPTY_LEAF)
				return left;
			else if (left == EMPTY_LEAF && right != EMPTY_LEAF)
				return right;
			else {
				// We can remove the successor or the predecessor
				value = getSuccessor();
				right = right.removeAt(0);
			}
			recalculate();
			return balance();
		}
		
		
		public String toString() {
			return String.format("AvlTreeNode(size=%d, height=%d, val=%s)", size, height, value);
		}
		
		
		private E getSuccessor() {
			if (this == EMPTY_LEAF || right == EMPTY_LEAF)
				throw new IllegalStateException();
			Node<E> node = right;
			while (node.left != EMPTY_LEAF)
				node = node.left;
			return node.value;
		}
		
		
		// Balances the subtree rooted at this node and returns the new root.
		private Node<E> balance() {
			int bal = getBalance();
			assert Math.abs(bal) <= 2;
			Node<E> result = this;
			if (bal == -2) {
				assert Math.abs(left.getBalance()) <= 1;
				if (left.getBalance() == +1)
					left = left.rotateLeft();
				result = rotateRight();
			} else if (bal == +2) {
				assert Math.abs(right.getBalance()) <= 1;
				if (right.getBalance() == -1)
					right = right.rotateRight();
				result = rotateLeft();
			}
			assert Math.abs(result.getBalance()) <= 1;
			return result;
		}
		
		
		/* 
		 *   A            B
		 *  / \          / \
		 * 0   B   ->   A   2
		 *    / \      / \
		 *   1   2    0   1
		 */
		private Node<E> rotateLeft() {
			if (right == EMPTY_LEAF)
				throw new IllegalStateException();
			Node<E> root = this.right;
			this.right = root.left;
			root.left = this;
			this.recalculate();
			root.recalculate();
			return root;
		}
		
		
		/* 
		 *     B          A
		 *    / \        / \
		 *   A   2  ->  0   B
		 *  / \            / \
		 * 0   1          1   2
		 */
		private Node<E> rotateRight() {
			if (left == EMPTY_LEAF)
				throw new IllegalStateException();
			Node<E> root = this.left;
			this.left = root.right;
			root.right = this;
			this.recalculate();
			root.recalculate();
			return root;
		}
		
		
		// Needs to be called every time the left or right subtree is changed.
		// Assumes the left and right subtrees have the correct values computed already.
		private void recalculate() {
			assert this != EMPTY_LEAF;
			assert left.height >= 0 && right.height >= 0;
			assert left.size >= 0 && right.size >= 0;
			height = Math.max(left.height, right.height) + 1;
			size = left.size + right.size + 1;
			assert height >= 0 && size >= 0;
		}
		
		
		private int getBalance() {
			return right.height - left.height;
		}
		
		
		// For unit tests, invokable by the outer class.
		void checkStructure(Set<Node<E>> visitedNodes) {
			if (this == EMPTY_LEAF)
				return;
			
			if (visitedNodes.contains(this))
				throw new AssertionError("AVL tree structure violated: Not a tree");
			visitedNodes.add(this);
			left .checkStructure(visitedNodes);
			right.checkStructure(visitedNodes);
			
			if (height != Math.max(left.height, right.height) + 1)
				throw new AssertionError("AVL tree structure violated: Incorrect cached height");
			if (size != left.size + right.size + 1)
				throw new AssertionError("AVL tree structure violated: Incorrect cached size");
			if (Math.abs(getBalance()) > 1)
				throw new AssertionError("AVL tree structure violated: Height imbalance");
		}
		
	}
	
	
	
	/*---- Helper class: Binary search tree iterator ----*/
	
	// Note: Not fail-fast on concurrent modification.
	private final class Iter implements Iterator<E> {
		
		/*-- Fields --*/
		
		private int index;
		private Stack<Node<E>> stack;
		
		
		/*-- Constructors --*/
		
		public Iter() {
			index = 0;
			stack = new Stack<>();
			initPath();
		}
		
		
		/*-- Methods --*/
		
		private void initPath() {
			stack.clear();
			int idx = index;
			for (Node<E> node = root; node != Node.EMPTY_LEAF; ) {
				assert 0 <= idx && idx <= node.size;
				if (idx <= node.left.size) {
					stack.push(node);
					if (idx < node.left.size)
						node = node.left;
					else
						break;
				} else {
					idx -= node.left.size + 1;
					node = node.right;
				}
			}
		}
		
		
		public boolean hasNext() {
			assert stack.isEmpty() == (index == root.size);
			return !stack.isEmpty();
		}
		
		
		public E next() {
			if (!hasNext())
				throw new NoSuchElementException();
			
			Node<E> node = stack.pop();
			E result = node.value;
			node = node.right;
			while (node != Node.EMPTY_LEAF) {
				stack.push(node);
				node = node.left;
			}
			index++;
			return result;
		}
		
		
		public void remove() {
			index--;
			AvlTreeList.this.remove(index);
			initPath();
		}
		
	}
	
}
