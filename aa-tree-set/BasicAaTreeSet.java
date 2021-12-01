/* 
 * Basic AA tree set (Java)
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
public final class BasicAaTreeSet<E extends Comparable<? super E>> {
	
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
		private int level    = 0;
		public Node<E> left  = (Node<E>)EMPTY_LEAF;
		public Node<E> right = (Node<E>)EMPTY_LEAF;
		
		public Node<E> add(E val) {
			if (this == EMPTY_LEAF) {
				Node<E> result = new Node<>();
				result.value = val;
				result.level = 1;
				return result;
			} else if (val.compareTo(value) < 0)
				left = left.add(val);
			else if (val.compareTo(value) > 0)
				right = right.add(val);
			return skew().split();
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
			if (this.level == Math.min(left.level, right.level) + 1)
				return this;
			this.level--;
			right.level = Math.min(this.level, right.level);
			Node<E> result = this.skew();
			result.right = result.right.skew();
			if (result.right.right != EMPTY_LEAF)
				result.right.right = result.right.right.skew();
			result = result.split();
			result.right = result.right.split();
			return result;
		}
		
		private Node<E> skew() {
			if (left.level < this.level)
				return this;
			Node<E> result = this.left;
			this.left = result.right;
			result.right = this;
			return result;
		}
		
		private Node<E> split() {
			if (right.level < this.level || right.right.level < this.level)
				return this;
			Node<E> result = right;
			this.right = result.left;
			result.left = this;
			result.level++;
			return result;
		}
		
		public static final Node EMPTY_LEAF = new Node();
	}
}
