/* 
 * Basic AVL tree set (Java)
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


@SuppressWarnings({"unchecked","rawtypes"})
public final class BasicAvlTreeSet<E extends Comparable<? super E>> {
	
	private Node<E> root = (Node<E>)Node.EMPTY_LEAF;
	
	public boolean contains(E val) {
		for (Node<E> node = root; node != Node.EMPTY_LEAF; ) {
			if (val.compareTo(node.value) < 0)
				node = node.left;
			else if (val.compareTo(node.value) > 0)
				node = node.right;
			else
				return true;
		}
		return false;
	}
	
	public void add(E val) {
		root = root.add(val);
	}
	
	public void remove(E val) {
		root = root.remove(val);
	}
	
	
	private static final class Node<E extends Comparable<? super E>> {
		
		public E value       = null;
		private int height   = 0;
		public Node<E> left  = (Node<E>)EMPTY_LEAF;
		public Node<E> right = (Node<E>)EMPTY_LEAF;
		
		public Node<E> add(E val) {
			if (this == EMPTY_LEAF) {
				Node<E> result = new Node<>();
				result.value = val;
				result.height = 1;
				return result;
			} else if (val.compareTo(value) < 0)
				left = left.add(val);
			else if (val.compareTo(value) > 0)
				right = right.add(val);
			return recalculate().balance();
		}
		
		public Node<E> remove(E val) {
			if (this == EMPTY_LEAF)
				return this;
			else if (val.compareTo(value) < 0)
				left = left.remove(val);
			else if (val.compareTo(value) > 0)
				right = right.remove(val);
			else if (left != EMPTY_LEAF && right != EMPTY_LEAF) {
				Node<E> temp = right;
				for (; temp.left != EMPTY_LEAF; temp = temp.left);
				value = temp.value;
				right = right.remove(value);
			} else
				return left == EMPTY_LEAF ? right : left;
			return recalculate().balance();
		}
		
		private Node<E> balance() {
			Node<E> result = this;
			if (right.height - left.height == -2) {
				if (left.right.height - left.left.height == +1)
					left = left.rotateLeft();
				result = rotateRight();
			} else if (right.height - left.height == +2) {
				if (right.right.height - right.left.height == -1)
					right = right.rotateRight();
				result = rotateLeft();
			}
			return result;
		}
		
		private Node<E> rotateLeft() {
			Node<E> root = this.right;
			this.right = root.left;
			root.left = this;
			this.recalculate();
			return root.recalculate();
		}
		
		private Node<E> rotateRight() {
			Node<E> root = this.left;
			this.left = root.right;
			root.right = this;
			this.recalculate();
			return root.recalculate();
		}
		
		private Node<E> recalculate() {
			height = (Math.max(left.height, right.height) + 1);
			return this;
		}
		
		public static final Node EMPTY_LEAF = new Node();
	}
}
