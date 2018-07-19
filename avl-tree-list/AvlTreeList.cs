/* 
 * AVL tree list (C#)
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

using System;
using System.Collections.Generic;
using System.Diagnostics;


public sealed class AvlTreeList<E> {
	
	/*---- Fields ----*/
	
	private Node<E> root;  // Never null
	
	
	
	/*---- Constructors ----*/
	
	public AvlTreeList() {
		Clear();
	}
	
	
	
	/*---- Methods ----*/
	
	// Must not exceed int.MaxValue.
	public int Count {
		get {
			return root.Size;
		}
	}
	
	
	public E this[int index] {
		get {
			if (index < 0 || index >= Count)
				throw new IndexOutOfRangeException();
			return root.GetNodeAt(index).Value;
		}
		set {
			if (index < 0 || index >= Count)
				throw new IndexOutOfRangeException();
			root.GetNodeAt(index).Value = value;
		}
	}
	
	
	public void Add(E val) {
		Insert(Count, val);
	}
	
	
	public void Insert(int index, E val) {
		if (index < 0 || index > Count)  // Different constraint than the other methods
			throw new IndexOutOfRangeException();
		if (Count == int.MaxValue)
			throw new InvalidOperationException("Maximum size reached");
		root = root.InsertAt(index, val);
	}
	
	
	public void RemoveAt(int index) {
		if (index < 0 || index >= Count)
			throw new IndexOutOfRangeException();
		root = root.RemoveAt(index);
	}
	
	
	public void Clear() {
		root = Node<E>.EmptyLeaf;
	}
	
	
	// For unit tests.
	public void CheckStructure() {
		root.CheckStructure(new HashSet<Node<E>>());
	}
	
	
	
	/*---- Helper class: AVL tree node ----*/
	
	private sealed class Node<T> {
		
		// A bit of a hack, but more elegant than using null values as leaf nodes.
		public static readonly Node<T> EmptyLeaf = new Node<T>();
		
		
		/*-- Fields --*/
		
		// The object stored at this node. Can be null.
		public T Value;
		
		// The height of the tree rooted at this node. Empty nodes have height 0.
		// This node has height equal to max(Left.Height, Right.Height) + 1.
		public int Height;
		
		// The number of non-empty nodes in the tree rooted at this node, including this node.
		// Empty nodes have size 0. This node has size equal to Left.Size + Right.Size + 1.
		public int Size;
		
		// The root node of the left subtree.
		public Node<T> Left;
		
		// The root node of the right subtree.
		public Node<T> Right;
		
		
		/*-- Constructors --*/
		
		// For the singleton empty leaf node.
		private Node() {
			Value  = default(T);
			Height = 0;
			Size   = 0;
			Left   = null;
			Right  = null;
		}
		
		
		// Normal non-leaf nodes.
		private Node(T val) {
			Value  = val;
			Height = 1;
			Size   = 1;
			Left   = EmptyLeaf;
			Right  = EmptyLeaf;
		}
		
		
		/*-- Methods --*/
		
		public Node<T> GetNodeAt(int index) {
			Debug.Assert(0 <= index && index < Size);
			if (this == EmptyLeaf)
				throw new ArgumentException();
			
			int leftSize = Left.Size;
			if (index < leftSize)
				return Left.GetNodeAt(index);
			else if (index > leftSize)
				return Right.GetNodeAt(index - leftSize - 1);
			else
				return this;
		}
		
		
		public Node<T> InsertAt(int index, T obj) {
			Debug.Assert(0 <= index && index <= Size);
			if (this == EmptyLeaf) {
				if (index == 0)
					return new Node<T>(obj);
				else
					throw new IndexOutOfRangeException();
			}
			
			int leftSize = Left.Size;
			if (index <= leftSize)
				Left = Left.InsertAt(index, obj);
			else
				Right = Right.InsertAt(index - leftSize - 1, obj);
			Recalculate();
			return DoBalance();
		}
		
		
		public Node<T> RemoveAt(int index) {
			Debug.Assert(0 <= index && index < Size);
			if (this == EmptyLeaf)
				throw new ArgumentException();
			
			int leftSize = Left.Size;
			if (index < leftSize)
				Left = Left.RemoveAt(index);
			else if (index > leftSize)
				Right = Right.RemoveAt(index - leftSize - 1);
			else if (Left == EmptyLeaf && Right == EmptyLeaf)
				return EmptyLeaf;
			else if (Left != EmptyLeaf && Right == EmptyLeaf)
				return Left;
			else if (Left == EmptyLeaf && Right != EmptyLeaf)
				return Right;
			else {
				// We can remove the successor or the predecessor
				Value = Successor;
				Right = Right.RemoveAt(0);
			}
			Recalculate();
			return DoBalance();
		}
		
		
		private T Successor {
			get {
				if (this == EmptyLeaf || Right == EmptyLeaf)
					throw new InvalidOperationException();
				Node<T> node = Right;
				while (node.Left != EmptyLeaf)
					node = node.Left;
				return node.Value;
			}
		}
		
		
		// Balances the subtree rooted at this node and returns the new root.
		private Node<T> DoBalance() {
			int bal = Balance;
			Debug.Assert(Math.Abs(bal) <= 2);
			Node<T> result = this;
			if (bal == -2) {
				Debug.Assert(Math.Abs(Left.Balance) <= 1);
				if (Left.Balance == +1)
					Left = Left.RotateLeft();
				result = RotateRight();
			} else if (bal == +2) {
				Debug.Assert(Math.Abs(Right.Balance) <= 1);
				if (Right.Balance == -1)
					Right = Right.RotateRight();
				result = RotateLeft();
			}
			Debug.Assert(Math.Abs(result.Balance) <= 1);
			return result;
		}
		
		
		/* 
		 *   A            B
		 *  / \          / \
		 * 0   B   ->   A   2
		 *    / \      / \
		 *   1   2    0   1
		 */
		private Node<T> RotateLeft() {
			if (Right == EmptyLeaf)
				throw new InvalidOperationException();
			Node<T> root = this.Right;
			this.Right = root.Left;
			root.Left = this;
			this.Recalculate();
			root.Recalculate();
			return root;
		}
		
		
		/* 
		 *     B          A
		 *    / \        / \
		 *   A   2  ->  0   B
		 *  / \            / \
		 * 0   1          1   2
		 */
		private Node<T> RotateRight() {
			if (Left == EmptyLeaf)
				throw new InvalidOperationException();
			Node<T> root = this.Left;
			this.Left = root.Right;
			root.Right = this;
			this.Recalculate();
			root.Recalculate();
			return root;
		}
		
		
		// Needs to be called every time the left or right subtree is changed.
		// Assumes the left and right subtrees have the correct values computed already.
		private void Recalculate() {
			Debug.Assert(this != EmptyLeaf);
			Debug.Assert(Left.Height >= 0 && Right.Height >= 0);
			Debug.Assert(Left.Size >= 0 && Right.Size >= 0);
			Height = Math.Max(Left.Height, Right.Height) + 1;
			Size = Left.Size + Right.Size + 1;
			Debug.Assert(Height >= 0 && Size >= 0);
		}
		
		
		private int Balance {
			get {
				return Right.Height - Left.Height;
			}
		}
		
		
		// For unit tests, invokable by the outer class.
		public void CheckStructure(ISet<Node<T>> visitedNodes) {
			if (this == EmptyLeaf)
				return;
			
			if (visitedNodes.Contains(this))
				throw new SystemException("AVL tree structure violated: Not a tree");
			visitedNodes.Add(this);
			Left .CheckStructure(visitedNodes);
			Right.CheckStructure(visitedNodes);
			
			if (Height != Math.Max(Left.Height, Right.Height) + 1)
				throw new SystemException("AVL tree structure violated: Incorrect cached height");
			if (Size != Left.Size + Right.Size + 1)
				throw new SystemException("AVL tree structure violated: Incorrect cached size");
			if (Math.Abs(Balance) > 1)
				throw new SystemException("AVL tree structure violated: Height imbalance");
		}
		
	}
	
}
