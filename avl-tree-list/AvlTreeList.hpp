/* 
 * AVL tree list (C++)
 * 
 * Copyright (c) 2017 Project Nayuki
 * https://www.nayuki.io/page/avl-tree-list
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

#pragma once

#include <algorithm>
#include <cassert>
#include <cstddef>
#include <cstdint>
#include <set>
#include <utility>


template <typename E>
class AvlTreeList final {
	
private:
	class Node;  // Forward declaration
	Node *root;  // Never nullptr
	
	
public:
	
	AvlTreeList() :
		root(&Node::emptyLeafNode) {}
	
	
	~AvlTreeList() {
		clear();
	}
	
	
	bool empty() const {
		return root->size == 0;
	}
	
	
	size_t size() const {
		return root->size;
	}
	
	
	E &at(size_t index) {
		if (index >= size())
			throw "Index out of bounds";
		return root->getNodeAt(index)->value;
	}
	
	
	const E &at(size_t index) const {
		if (index >= size())
			throw "Index out of bounds";
		return root->getNodeAt(index)->value;
	}
	
	
	void insert(size_t index, const E &val) {
		if (index > size())  // Different constraint than the other methods
			throw "Index out of bounds";
		if (size() == SIZE_MAX)
			throw "Maximum size reached";
		root = root->insertAt(index, val);
	}
	
	
	void insert(size_t index, E &&val) {
		if (index > size())  // Different constraint than the other methods
			throw "Index out of bounds";
		if (size() == SIZE_MAX)
			throw "Maximum size reached";
		root = root->insertAt(index, std::move(val));
	}
	
	
	void erase(size_t index) {
		if (index >= size())
			throw "Index out of bounds";
		Node *toDelete = nullptr;
		root = root->removeAt(index, &toDelete);
		if (toDelete != nullptr)
			delete toDelete;
	}
	
	
	void clear() {
		if (root != &Node::emptyLeafNode) {
			delete root;
			root = &Node::emptyLeafNode;
		}
	}
	
	
	// For unit tests.
	void checkStructure() const {
		std::set<const Node*> visited;
		root->checkStructure(visited);
	}
	
	
private:
	class Node final {
		
	public:
		// A bit of a hack, but more elegant than using nullptr values as leaf nodes.
		static Node emptyLeafNode;
		
		
		// The object stored at this node.
		E value;
		
		// The height of the tree rooted at this node. Empty nodes have height 0.
		// This node has height equal to max(left->height, right->height) + 1.
		int height;
		
		// The number of nodes in the tree rooted at this node, including this node.
		// Empty nodes have size 0. This node has size equal to left->size + right->size + 1.
		size_t size;
		
		// The root node of the left subtree.
		Node *left;
		
		// The root node of the right subtree.
		Node *right;
		
		
	private:
		
		// For the singleton empty leaf node.
		Node() :
			value(),  // Default constructor on type E
			height(0),
			size  (0),
			left (nullptr),
			right(nullptr) {}
		
		
		// Normal non-leaf nodes.
		Node(const E &val) :
			value(val),  // Copy constructor on type E
			height(1),
			size  (1),
			left (&emptyLeafNode),
			right(&emptyLeafNode) {}
		
		
		// Normal non-leaf nodes.
		Node(E &&val) :
			value(std::move(val)),  // Move constructor on type E
			height(1),
			size  (1),
			left (&emptyLeafNode),
			right(&emptyLeafNode) {}
		
		
	public:
		~Node() {
			if (left != &emptyLeafNode)
				delete left;
			if (right != &emptyLeafNode)
				delete right;
		}
		
		
		Node *getNodeAt(size_t index) {
			assert(index < size);
			if (this == &emptyLeafNode)
				throw "Illegal argument";
			
			size_t leftSize = left->size;
			if (index < leftSize)
				return left->getNodeAt(index);
			else if (index > leftSize)
				return right->getNodeAt(index - leftSize - 1);
			else
				return this;
		}
		
		
		Node *insertAt(size_t index, const E &obj) {
			assert(index <= size);
			if (this == &emptyLeafNode) {
				if (index == 0)
					return new Node(obj);
				else
					throw "Index out of bounds";
			}
			
			size_t leftSize = left->size;
			if (index <= leftSize)
				left = left->insertAt(index, obj);
			else
				right = right->insertAt(index - leftSize - 1, obj);
			recalculate();
			return balance();
		}
		
		
		Node *insertAt(size_t index, E &&obj) {
			assert(index <= size);
			if (this == &emptyLeafNode) {
				if (index == 0)
					return new Node(std::move(obj));
				else
					throw "Index out of bounds";
			}
			
			size_t leftSize = left->size;
			if (index <= leftSize)
				left = left->insertAt(index, std::move(obj));
			else
				right = right->insertAt(index - leftSize - 1, std::move(obj));
			recalculate();
			return balance();
		}
		
		
		Node *removeAt(size_t index, Node **toDelete) {
			assert(index < size);
			if (this == &emptyLeafNode)
				throw "Illegal argument";
			
			size_t leftSize = left->size;
			if (index < leftSize)
				left = left->removeAt(index, toDelete);
			else if (index > leftSize)
				right = right->removeAt(index - leftSize - 1, toDelete);
			else if (left == &emptyLeafNode && right == &emptyLeafNode) {
				assert(*toDelete == nullptr);
				*toDelete = this;
				return &emptyLeafNode;
			} else if (left != &emptyLeafNode && right == &emptyLeafNode) {
				Node *result = left;
				left = nullptr;
				assert(*toDelete == nullptr);
				*toDelete = this;
				return result;
			} else if (left == &emptyLeafNode && right != &emptyLeafNode) {
				Node *result = right;
				right = nullptr;
				assert(*toDelete == nullptr);
				*toDelete = this;
				return result;
			} else {
				// We can remove the successor or the predecessor
				std::swap(value, getSuccessor());
				right = right->removeAt(0, toDelete);
			}
			recalculate();
			return balance();
		}
		
		
	private:
		
		// Note: This returns a mutable value.
		E &getSuccessor() {
			if (this == &emptyLeafNode || right == &emptyLeafNode)
				throw "Illegal state";
			Node *node = right;
			while (node->left != &emptyLeafNode)
				node = node->left;
			return node->value;
		}
		
		
		// Balances the subtree rooted at this node and returns the new root.
		Node *balance() {
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
		Node *rotateLeft() {
			if (right == &emptyLeafNode)
				throw "Illegal state";
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
		Node *rotateRight() {
			if (left == &emptyLeafNode)
				throw "Illegal state";
			Node *root = this->left;
			this->left = root->right;
			root->right = this;
			this->recalculate();
			root->recalculate();
			return root;
		}
		
		
		// Needs to be called every time the left or right subtree is changed.
		// Assumes the left and right subtrees have the correct values computed already.
		void recalculate() {
			assert(this != &emptyLeafNode);
			assert(left->height >= 0 && right->height >= 0);
			assert(left->size >= 0 && right->size >= 0);
			height = std::max(left->height, right->height) + 1;
			size = left->size + right->size + 1;
			assert(height >= 0 && size >= 0);
		}
		
		
		int getBalance() const {
			return right->height - left->height;
		}
		
		
		// For unit tests, invokable by the outer class.
	public:
		void checkStructure(std::set<const Node*> &visitedNodes) const {
			if (this == &emptyLeafNode)
				return;
			
			if (visitedNodes.find(this) != visitedNodes.end())
				throw "AVL tree structure violated: Not a tree";
			visitedNodes.insert(this);
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
typename AvlTreeList<E>::Node AvlTreeList<E>::Node::emptyLeafNode;
