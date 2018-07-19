/* 
 * AVL tree list (C++)
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

#pragma once

#include <algorithm>
#include <cassert>
#include <cstddef>
#include <cstdint>
#include <set>
#include <utility>


template <typename E>
class AvlTreeList final {
	
	private: class Node;  // Forward declaration
	private: Node *root;  // Never nullptr
	
	
	public: AvlTreeList() :
		root(&Node::EMPTY_LEAF) {}
	
	
	public: ~AvlTreeList() {
		clear();
	}
	
	
	public: bool empty() const {
		return root->size == 0;
	}
	
	
	public: std::size_t size() const {
		return root->size;
	}
	
	
	public: E &operator[](std::size_t index) {
		if (index >= size())
			throw "Index out of bounds";
		return root->getNodeAt(index)->value;
	}
	
	
	public: const E &operator[](std::size_t index) const {
		if (index >= size())
			throw "Index out of bounds";
		return root->getNodeAt(index)->value;
	}
	
	
	public: void push_back(const E &val) {
		insert(size(), val);
	}
	
	
	public: void push_back(E &&val) {
		insert(size(), std::move(val));
	}
	
	
	public: void insert(std::size_t index, const E &val) {
		if (index > size())  // Different constraint than the other methods
			throw "Index out of bounds";
		if (size() == SIZE_MAX)
			throw "Maximum size reached";
		root = root->insertAt(index, val);
	}
	
	
	public: void insert(std::size_t index, E &&val) {
		if (index > size())  // Different constraint than the other methods
			throw "Index out of bounds";
		if (size() == SIZE_MAX)
			throw "Maximum size reached";
		root = root->insertAt(index, std::move(val));
	}
	
	
	public: void erase(std::size_t index) {
		if (index >= size())
			throw "Index out of bounds";
		Node *toDelete = nullptr;
		root = root->removeAt(index, &toDelete);
		delete toDelete;
	}
	
	
	public: void clear() {
		if (root != &Node::EMPTY_LEAF) {
			delete root;
			root = &Node::EMPTY_LEAF;
		}
	}
	
	
	// For unit tests.
	public: void checkStructure() const {
		assert(root != nullptr);
		std::set<const Node*> visited;
		root->checkStructure(visited);
	}
	
	
	private: class Node final {
		
		// A bit of a hack, but more elegant than using nullptr values as leaf nodes.
		public: static Node EMPTY_LEAF;
		
		
		// The object stored at this node.
		public: E value;
		
		// The height of the tree rooted at this node. Empty nodes have height 0.
		// This node has height equal to max(left->height, right->height) + 1.
		private: int height;
		
		// The number of non-empty nodes in the tree rooted at this node, including this node.
		// Empty nodes have size 0. This node has size equal to left->size + right->size + 1.
		public: std::size_t size;
		
		// The root node of the left subtree.
		public: Node *left;
		
		// The root node of the right subtree.
		public: Node *right;
		
		
		// For the singleton empty leaf node.
		private: Node() :
			value (),  // Default constructor on type E
			height(0),
			size  (0),
			left  (nullptr),
			right (nullptr) {}
		
		
		// Normal non-leaf nodes.
		private: Node(const E &val) :
			value (val),  // Copy constructor on type E
			height(1),
			size  (1),
			left  (&EMPTY_LEAF),
			right (&EMPTY_LEAF) {}
		
		
		// Normal non-leaf nodes.
		private: Node(E &&val) :
			value (std::move(val)),  // Move constructor on type E
			height(1),
			size  (1),
			left  (&EMPTY_LEAF),
			right (&EMPTY_LEAF) {}
		
		
		public: ~Node() {
			if (left != &EMPTY_LEAF)
				delete left;
			if (right != &EMPTY_LEAF)
				delete right;
		}
		
		
		public: Node *getNodeAt(std::size_t index) {
			assert(index < size);  // Automatically implies this != &EMPTY_LEAF, because EMPTY_LEAF.size == 0
			std::size_t leftSize = left->size;
			if (index < leftSize)
				return left->getNodeAt(index);
			else if (index > leftSize)
				return right->getNodeAt(index - leftSize - 1);
			else
				return this;
		}
		
		
		public: Node *insertAt(std::size_t index, const E &obj) {
			assert(index <= size);
			if (this == &EMPTY_LEAF)  // Automatically implies index == 0, because EMPTY_LEAF.size == 0
				return new Node(obj);
			std::size_t leftSize = left->size;
			if (index <= leftSize)
				left = left->insertAt(index, obj);
			else
				right = right->insertAt(index - leftSize - 1, obj);
			recalculate();
			return balance();
		}
		
		
		public: Node *insertAt(std::size_t index, E &&obj) {
			assert(index <= size);
			if (this == &EMPTY_LEAF)  // Automatically implies index == 0, because EMPTY_LEAF.size == 0
				return new Node(std::move(obj));
			std::size_t leftSize = left->size;
			if (index <= leftSize)
				left = left->insertAt(index, std::move(obj));
			else
				right = right->insertAt(index - leftSize - 1, std::move(obj));
			recalculate();
			return balance();
		}
		
		
		public: Node *removeAt(std::size_t index, Node **toDelete) {
			assert(index < size);  // Automatically implies this != &EMPTY_LEAF, because EMPTY_LEAF.size == 0
			std::size_t leftSize = left->size;
			if (index < leftSize)
				left = left->removeAt(index, toDelete);
			else if (index > leftSize)
				right = right->removeAt(index - leftSize - 1, toDelete);
			else if (left == &EMPTY_LEAF && right == &EMPTY_LEAF) {
				assert(*toDelete == nullptr);
				*toDelete = this;
				return &EMPTY_LEAF;
			} else if (left != &EMPTY_LEAF && right == &EMPTY_LEAF) {
				Node *result = left;
				left = nullptr;
				assert(*toDelete == nullptr);
				*toDelete = this;
				return result;
			} else if (left == &EMPTY_LEAF && right != &EMPTY_LEAF) {
				Node *result = right;
				right = nullptr;
				assert(*toDelete == nullptr);
				*toDelete = this;
				return result;
			} else {
				// Find successor node. (Using the predecessor is valid too.)
				Node *temp = right;
				while (temp->left != &EMPTY_LEAF)
					temp = temp->left;
				value = std::move(temp->value);  // Replace value by successor
				right = right->removeAt(0, toDelete);  // Remove successor node
			}
			recalculate();
			return balance();
		}
		
		
		// Balances the subtree rooted at this node and returns the new root.
		private: Node *balance() {
			int bal = getBalance();
			assert(std::abs(bal) <= 2);
			Node *result = this;
			if (bal == -2) {
				assert(std::abs(left->getBalance()) <= 1);
				if (left->getBalance() == +1)
					left = left->rotateLeft();
				result = rotateRight();
			} else if (bal == +2) {
				assert(std::abs(right->getBalance()) <= 1);
				if (right->getBalance() == -1)
					right = right->rotateRight();
				result = rotateLeft();
			}
			assert(std::abs(result->getBalance()) <= 1);
			return result;
		}
		
		
		/* 
		 *   A            B
		 *  / \          / \
		 * 0   B   ->   A   2
		 *    / \      / \
		 *   1   2    0   1
		 */
		private: Node *rotateLeft() {
			assert(right != &EMPTY_LEAF);
			Node *root = this->right;
			this->right = root->left;
			root->left = this;
			this->recalculate();
			root->recalculate();
			return root;
		}
		
		
		/* 
		 *     B          A
		 *    / \        / \
		 *   A   2  ->  0   B
		 *  / \            / \
		 * 0   1          1   2
		 */
		private: Node *rotateRight() {
			assert(left != &EMPTY_LEAF);
			Node *root = this->left;
			this->left = root->right;
			root->right = this;
			this->recalculate();
			root->recalculate();
			return root;
		}
		
		
		// Needs to be called every time the left or right subtree is changed.
		// Assumes the left and right subtrees have the correct values computed already.
		private: void recalculate() {
			assert(this != &EMPTY_LEAF);
			assert(left->height >= 0 && right->height >= 0);
			assert(left->size >= 0 && right->size >= 0);
			height = std::max(left->height, right->height) + 1;
			size = left->size + right->size + 1;
			assert(height >= 0 && size >= 0);
		}
		
		
		private: int getBalance() const {
			return right->height - left->height;
		}
		
		
		// For unit tests, invokable by the outer class.
		public: void checkStructure(std::set<const Node*> &visitedNodes) const {
			if (this == &EMPTY_LEAF)
				return;
			
			if (!visitedNodes.insert(this).second)
				throw "AVL tree structure violated: Not a tree";
			left ->checkStructure(visitedNodes);
			right->checkStructure(visitedNodes);
			
			if (height != std::max(left->height, right->height) + 1)
				throw "AVL tree structure violated: Incorrect cached height";
			if (size != left->size + right->size + 1)
				throw "AVL tree structure violated: Incorrect cached size";
			if (std::abs(getBalance()) > 1)
				throw "AVL tree structure violated: Height imbalance";
		}
		
	};
	
};


template <typename E>
typename AvlTreeList<E>::Node AvlTreeList<E>::Node::EMPTY_LEAF;
