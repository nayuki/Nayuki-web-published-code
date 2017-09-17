/* 
 * B-tree set (C++)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/btree-set
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
#include <climits>
#include <cstdint>
#include <utility>
#include <vector>


template <typename E>
class BTreeSet final {
	
	private: class Node;  // Forward declaration
	
	/*---- Fields ----*/
	
	private: Node *root;  // Never nullptr
	private: std::size_t count;
	private: const std::uint32_t minKeys;  // At least 1, equal to degree-1
	private: const std::uint32_t maxKeys;  // At least 3, odd number, equal to minKeys*2+1
	
	
	
	/*---- Constructors ----*/
	
	// The degree is the minimum number of children each non-root internal node must have.
	public: explicit BTreeSet(std::uint32_t deg) :
			count(0),
			minKeys(deg - 1),
			maxKeys(deg * 2 - 1) {
		if (deg < 2)
			throw "Degree must be at least 2";
		if (deg > UINT32_MAX / 4 + 1)  // In other words, need maxChildren <= (UINT32_MAX + 1) / 2
			throw "Degree too large";
		root = new Node(maxKeys, true);
	}
	
	
	public: ~BTreeSet() {
		assert(root != nullptr);
		delete root;
	}
	
	
	
	/*---- Methods ----*/
	
	public: bool empty() const {
		return count == 0;
	}
	
	
	public: std::size_t size() const {
		return count;
	}
	
	
	public: void clear() {
		assert(root != nullptr);
		delete root;
		root = new Node(maxKeys, true);
	}
	
	
	public: bool contains(const E &val) const {
		// Walk down the tree
		const Node *node = root;
		while (true) {
			std::uint32_t index = node->search(val);
			if ((index >> 31) == 0)
				return true;
			else if (node->isLeaf())
				return false;
			else  // Internal node
				node = node->children.at(~index);
		}
	}
	
	
	public: void insert(const E &val) {
		// Special preprocessing to split root node
		if (root->keys.size() == maxKeys) {
			Node *rightNode = nullptr;
			E middleKey = root->split(&rightNode);
			Node *left = root;
			root = new Node(maxKeys, false);  // Increment tree height
			root->keys.push_back(std::move(middleKey));
			root->children.push_back(left);
			root->children.push_back(rightNode);
		}
		
		// Walk down the tree
		Node *node = root;
		while (true) {
			// Search for index in current node
			assert(node->keys.size() < maxKeys);
			assert(node == root || node->keys.size() >= minKeys);
			std::uint32_t index = node->search(val);
			if ((index >> 31) == 0)
				return;  // Key already exists in tree
			index = ~index;
			
			if (node->isLeaf()) {  // Simple insertion into leaf
				if (count == SIZE_MAX)
					throw "Maximum size reached";
				node->keys.insert(node->keys.begin() + index, val);
				count++;
				return;  // Successfully inserted
			} else {  // Handle internal node
				Node *child = node->children.at(index);
				if (child->keys.size() == maxKeys) {  // Split child node
					Node *rightNode = nullptr;
					E middleKey = child->split(&rightNode);
					int cmp;
					if (val < middleKey)
						cmp = -1;
					else if (val > middleKey)
						cmp = 1;
					else
						cmp = 0;
					node->keys.insert(node->keys.begin() + index, std::move(middleKey));
					node->children.insert(node->children.begin() + index + 1, rightNode);
					if (cmp == 0)
						return;  // Key already exists in tree
					else if (cmp > 0)
						child = rightNode;
				}
				node = child;
			}
		}
	}
	
	
	public: std::size_t erase(const E &val) {
		// Walk down the tree
		std::uint32_t index = root->search(val);
		Node *node = root;
		while (true) {
			assert(node->keys.size() <= maxKeys);
			assert(node == root || node->keys.size() > minKeys);
			if (node->isLeaf()) {
				if ((index >> 31) == 0) {  // Simple removal from leaf
					node->removeKey(index);
					assert(count > 0);
					count--;
					return 1;
				} else
					return 0;
				
			} else {  // Internal node
				if ((index >> 31) == 0) {  // Key is stored at current node
					Node *left  = node->children.at(index + 0);
					Node *right = node->children.at(index + 1);
					assert(left != nullptr && right != nullptr);
					if (left->keys.size() > minKeys) {  // Replace key with predecessor
						node->keys.at(index) = left->removeMax();
						assert(count > 0);
						count--;
						return 1;
					} else if (right->keys.size() > minKeys) {  // Replace key with successor
						node->keys.at(index) = right->removeMin();
						assert(count > 0);
						count--;
						return 1;
					} else if (left->keys.size() == minKeys && right->keys.size() == minKeys) {
						// Merge key and right node into left node, then recurse
						if (!left->isLeaf()) {
							left->children.insert(left->children.end(), right->children.begin(), right->children.end());
							right->children.clear();
						}
						left->keys.push_back(node->removeKey(index));
						std::move(right->keys.begin(), right->keys.end(), std::back_inserter(left->keys));
						node->children.erase(node->children.begin() + index + 1);
						delete right;
						if (node == root && root->keys.empty()) {
							assert(root->children.size() == 1);
							Node *newRoot = root->children.at(0);
							assert(newRoot != nullptr);
							root->children.clear();
							delete root;
							root = newRoot;  // Decrement tree height
						}
						node = left;
						index = minKeys;  // Index known due to merging; no need to search
					} else
						throw "Impossible condition";
				} else {  // Key might be found in some child
					Node *child = node->ensureChildRemove(~index);
					if (node == root && root->keys.empty()) {
						assert(root->children.size() == 1);
						Node *newRoot = root->children.at(0);
						assert(newRoot != nullptr);
						root->children.clear();
						delete root;
						root = newRoot;  // Decrement tree height
					}
					node = child;
					index = node->search(val);
				}
			}
		}
	}
	
	
	// For unit tests
	public: void checkStructure() const {
		// Check size and root node properties
		if (root == nullptr || (count > maxKeys && root->isLeaf())
				|| (count <= minKeys * 2 && (!root->isLeaf() || root->keys.size() != count)))
			throw "Invalid size or root type";
		
		// Calculate height by descending into one branch
		int height = 0;
		for (const Node *node = root; !node->isLeaf(); node = node->children.at(0)) {
			if (height == INT_MAX)
				throw "Integer overflow";
			height++;
		}
		
		// Check all nodes and total size
		if (root->checkStructure(true, height, nullptr, nullptr) != count)
			throw "Size mismatch";
	}
	
	
	
	/*---- Helper class: B-tree node ----*/
	
	private: class Node final {
		
		/*-- Fields --*/
		
		// Size is in the range [0, maxKeys] for root node, [minKeys, maxKeys] for all other nodes.
		public: std::vector<E> keys;
		
		// If leaf then size is 0, otherwise if internal node then size always equals keys.size()+1.
		public: std::vector<Node*> children;
		
		public: const std::uint32_t maxKeys;
		
		
		/*-- Constructors --*/
		
		// Note: Once created, a node's structure never changes between a leaf and internal node.
		public: Node(std::uint32_t mxKeys, bool leaf) :
				maxKeys(mxKeys) {
			assert(maxKeys >= 3 && maxKeys % 2 == 1);
			keys.reserve(maxKeys);
			if (!leaf)
				children.reserve(maxKeys + 1);
		}
		
		
		public: ~Node() {
			for (Node *node : children)
				delete node;
		}
		
		
		/*-- Methods --*/
		
		public: bool isLeaf() const {
			return children.empty();
		}
		
		
		// Searches this node's keys array and returns i (with top bit clear) if obj equals keys[i],
		// otherwise returns ~i (with top bit set) if children[i] should be explored. For simplicity,
		// the implementation uses linear search. It's possible to replace it with binary search for speed.
		public: std::uint32_t search(const E &val) const {
			assert(keys.size() <= UINT32_MAX / 2);
			std::uint32_t i = 0;
			while (i < keys.size()) {
				const E &elem = keys.at(i);
				if (val == elem)
					return i;  // Key found
				else if (val > elem)
					i++;
				else  // val < elem
					break;
			}
			assert((i >> 31) == 0);
			return ~i;  // Not found, caller should recurse on child
		}
		
		
		// Removes and returns the minimum key among the whole subtree rooted at this node.
		public: E removeMin() {
			std::uint32_t minKeys = maxKeys / 2;
			Node *node = this;
			while (!node->isLeaf()) {
				assert(node->keys.size() > minKeys);
				node = node->ensureChildRemove(0);
			}
			assert(node->keys.size() > minKeys);
			return node->removeKey(0);
		}
		
		
		// Removes and returns the maximum key among the whole subtree rooted at this node.
		public: E removeMax() {
			std::uint32_t minKeys = maxKeys / 2;
			Node *node = this;
			while (!node->isLeaf()) {
				assert(node->keys.size() > minKeys);
				node = node->ensureChildRemove(node->children.size() - 1);
			}
			assert(node->keys.size() > minKeys);
			return node->removeKey(node->keys.size() - 1);
		}
		
		
		// Removes and returns this node's key at the given index.
		public: E removeKey(std::uint32_t index) {
			E result = std::move(keys.at(index));
			keys.erase(keys.begin() + index);
			return result;
		}
		
		
		// Moves the right half of keys and children to a new node, yielding the pair of values
		// (new node, promoted key). The left half of data is still retained in this node.
		public: E split(Node **rightNode) {
			// Manipulate numbers
			assert(keys.size() == maxKeys);
			std::uint32_t minKeys = maxKeys / 2;
			
			// Handle children
			*rightNode = new Node(maxKeys, isLeaf());
			if (!isLeaf()) {
				(*rightNode)->children.insert((*rightNode)->children.end(), children.begin() + minKeys + 1, children.end());
				children.erase(children.begin() + minKeys + 1, children.end());
			}
			
			// Handle keys
			E result = std::move(keys.at(minKeys));
			std::move(keys.begin() + minKeys + 1, keys.end(), std::back_inserter((*rightNode)->keys));
			keys.erase(keys.begin() + minKeys, keys.end());
			return result;
		}
		
		
		// Performs modifications to ensure that this node's child at the given index has at least
		// minKeys+1 keys in preparation for a single removal. The child may gain a key and subchild
		// from its sibling, or it may be merged with a sibling, or nothing needs to be done.
		// A reference to the appropriate child is returned, which is helpful if the old child no longer exists.
		public: Node *ensureChildRemove(std::uint32_t index) {
			// Preliminaries
			assert(!isLeaf());
			std::uint32_t minKeys = maxKeys / 2;
			Node *child = children.at(index);
			if (child->keys.size() > minKeys)  // Already satisfies the condition
				return child;
			assert(child->keys.size() == minKeys);
			
			// Get siblings
			Node *left = index >= 1 ? children.at(index - 1) : nullptr;
			Node *right = index < this->keys.size() ? children.at(index + 1) : nullptr;
			bool internal = !child->isLeaf();
			assert(left != nullptr || right != nullptr);  // At least one sibling exists because degree >= 2
			assert(left  == nullptr || left ->isLeaf() != internal);  // Sibling must be same type (internal/leaf) as child
			assert(right == nullptr || right->isLeaf() != internal);  // Sibling must be same type (internal/leaf) as child
			
			if (left != nullptr && left->keys.size() > minKeys) {  // Steal rightmost item from left sibling
				if (internal) {
					child->children.insert(child->children.begin(), left->children.back());
					left->children.pop_back();
				}
				child->keys.insert(child->keys.begin(), std::move(this->keys.at(index - 1)));
				this->keys.at(index - 1) = std::move(left->keys.back());
				left->keys.pop_back();
				return child;
			} else if (right != nullptr && right->keys.size() > minKeys) {  // Steal leftmost item from right sibling
				if (internal) {
					child->children.push_back(right->children.front());
					right->children.erase(right->children.begin());
				}
				child->keys.push_back(std::move(this->keys.at(index)));
				this->keys.at(index) = std::move(right->keys.front());
				right->keys.erase(right->keys.begin());
				return child;
			} else if (left != nullptr) {  // Merge child into left sibling
				assert(left->keys.size() == minKeys);
				if (internal) {
					left->children.insert(left->children.end(), child->children.begin(), child->children.end());
					child->children.clear();
				}
				left->keys.push_back(this->removeKey(index - 1));
				std::move(child->keys.begin(), child->keys.end(), std::back_inserter(left->keys));
				this->children.erase(this->children.begin() + index);
				delete child;
				return left;  // This is the only case where the return value is different
			} else if (right != nullptr) {  // Merge right sibling into child
				assert(right->keys.size() == minKeys);
				if (internal) {
					child->children.insert(child->children.end(), right->children.begin(), right->children.end());
					right->children.clear();
				}
				child->keys.push_back(this->removeKey(index));
				std::move(right->keys.begin(), right->keys.end(), std::back_inserter(child->keys));
				this->children.erase(this->children.begin() + index + 1);
				delete right;
				return child;
			} else
				throw "Impossible condition";
		}
		
		
		// Checks the structure recursively and returns the total number of keys in the subtree rooted at this node. For unit tests
		public: std::size_t checkStructure(bool isRoot, int leafDepth, const E *min, const E *max) const {
			// Check basic fields
			if (keys.size() > maxKeys || (!isRoot && keys.size() < maxKeys / 2))
				throw "Invalid number of keys";
			if (isLeaf() != (leafDepth == 0))
				throw "Incorrect leaf/internal node type";
			
			// Check keys
			for (std::size_t i = 0; i < keys.size(); i++) {
				const E &key = keys.at(i);
				bool fail = i == 0 && min != nullptr && key <= *min;
				fail |= i >= 1 && key <= keys.at(i - 1);
				fail |= i == keys.size() - 1 && max != nullptr && key >= *max;
				if (fail)
					throw "Invalid key ordering";
			}
			
			// Count keys in this subtree
			std::size_t count = keys.size();
			if (!isLeaf()) {
				if (children.size() != keys.size() + 1)
					throw "Invalid number of children";
				// Check children pointers and recurse
				for (std::size_t i = 0; i < children.size(); i++) {
					std::size_t temp = children.at(i)->checkStructure(false, leafDepth - 1,
						(i == 0 ? min : &keys.at(i - 1)), (i == keys.size() ? max : &keys.at(i)));
					if (SIZE_MAX - temp < count)
						throw "Size overflow";
					count += temp;
				}
			}
			return count;
		}
		
	};
	
};
