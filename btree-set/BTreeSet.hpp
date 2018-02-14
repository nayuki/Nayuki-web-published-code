/* 
 * B-tree set (C++)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
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
#include <cstddef>
#include <cstdint>
#include <memory>
#include <utility>
#include <vector>


template <typename E>
class BTreeSet final {
	
	private: class Node;  // Forward declaration
	
	/*---- Fields ----*/
	
	private: std::unique_ptr<Node> root;  // Not nullptr
	private: std::size_t count;
	
	private: const std::uint32_t minKeys;  // At least 1, equal to degree-1
	private: const std::uint32_t maxKeys;  // At least 3, odd number, equal to minKeys*2+1
	
	
	
	/*---- Constructors ----*/
	
	// The degree is the minimum number of children each non-root internal node must have.
	public: explicit BTreeSet(std::uint32_t degree) :
			minKeys(degree - 1),
			maxKeys(degree <= UINT32_MAX / 2 ? degree * 2 - 1 : 0) {  // Avoid overflow
		if (degree < 2)
			throw "Degree must be at least 2";
		if (degree > UINT32_MAX / 2)  // In other words, need maxChildren <= UINT32_MAX
			throw "Degree too large";
		clear();
	}
	
	
	
	/*---- Methods ----*/
	
	public: bool empty() const {
		return count == 0;
	}
	
	
	public: std::size_t size() const {
		return count;
	}
	
	
	public: void clear() {
		root = std::make_unique<Node>(maxKeys, true);
		count = 0;
	}
	
	
	using SearchResult = std::pair<bool,std::uint32_t>;
	
	public: bool contains(const E &val) const {
		// Walk down the tree
		const Node *node = root.get();
		while (true) {
			SearchResult sr = node->search(val);
			if (sr.first)
				return true;
			else if (node->isLeaf())
				return false;
			else  // Internal node
				node = node->children.at(sr.second).get();
		}
	}
	
	
	public: void insert(const E &val) {
		// Special preprocessing to split root node
		if (root->keys.size() == maxKeys) {
			std::unique_ptr<Node> child = std::move(root);
			root = std::make_unique<Node>(maxKeys, false);  // Increment tree height
			root->children.push_back(std::move(child));
			root->splitChild(minKeys, maxKeys, 0);
		}
		
		// Walk down the tree
		Node *node = root.get();
		while (true) {
			// Search for index in current node
			assert(node->keys.size() < maxKeys);
			assert(node == root.get() || node->keys.size() >= minKeys);
			SearchResult sr = node->search(val);
			if (sr.first)
				return;  // Key already exists in tree
			std::uint32_t index = sr.second;
			
			if (node->isLeaf()) {  // Simple insertion into leaf
				if (count == SIZE_MAX)
					throw "Maximum size reached";
				node->keys.insert(node->keys.begin() + index, val);
				count++;
				return;  // Successfully inserted
				
			} else {  // Handle internal node
				Node *child = node->children.at(index).get();
				if (child->keys.size() == maxKeys) {  // Split child node
					node->splitChild(minKeys, maxKeys, index);
					const E &middleKey = node->keys.at(index);
					if (val == middleKey)
						return;  // Key already exists in tree
					else if (val > middleKey)
						child = node->children.at(index + 1).get();
				}
				node = child;
			}
		}
	}
	
	
	public: std::size_t erase(const E &val) {
		// Walk down the tree
		bool found;
		std::uint32_t index;
		{
			SearchResult sr = root->search(val);
			found = sr.first;
			index = sr.second;
		}
		Node *node = root.get();
		while (true) {
			assert(node->keys.size() <= maxKeys);
			assert(node == root.get() || node->keys.size() > minKeys);
			if (node->isLeaf()) {
				if (found) {  // Simple removal from leaf
					node->removeKey(index);
					assert(count > 0);
					count--;
					return 1;
				} else
					return 0;
				
			} else {  // Internal node
				if (found) {  // Key is stored at current node
					Node *left  = node->children.at(index + 0).get();
					Node *right = node->children.at(index + 1).get();
					assert(left != nullptr && right != nullptr);
					if (left->keys.size() > minKeys) {  // Replace key with predecessor
						node->keys.at(index) = left->removeMax(minKeys);
						assert(count > 0);
						count--;
						return 1;
					} else if (right->keys.size() > minKeys) {  // Replace key with successor
						node->keys.at(index) = right->removeMin(minKeys);
						assert(count > 0);
						count--;
						return 1;
					} else {  // Merge key and right node into left node, then recurse
						node->mergeChildren(minKeys, index);
						if (node == root.get() && root->keys.empty()) {
							assert(root->children.size() == 1);
							std::unique_ptr<Node> newRoot = std::move(root->children.at(0));
							root = std::move(newRoot);  // Decrement tree height
						}
						node = left;
						index = minKeys;  // Index known due to merging; no need to search
					}
					
				} else {  // Key might be found in some child
					Node *child = node->ensureChildRemove(minKeys, index);
					if (node == root.get() && root->keys.empty()) {
						assert(root->children.size() == 1);
						std::unique_ptr<Node> newRoot = std::move(root->children.at(0));
						root = std::move(newRoot);  // Decrement tree height
					}
					node = child;
					SearchResult sr = node->search(val);
					found = sr.first;
					index = sr.second;
				}
			}
		}
	}
	
	
	// For unit tests
	public: void checkStructure() const {
		// Check size and root node properties
		if (root.get() == nullptr || (count > maxKeys && root->isLeaf())
				|| (count <= minKeys * 2 && (!root->isLeaf() || root->keys.size() != count)))
			throw "Invalid size or root type";
		
		// Calculate height by descending into one branch
		int height = 0;
		for (const Node *node = root.get(); !node->isLeaf(); node = node->children.at(0).get()) {
			if (height == INT_MAX)
				throw "Integer overflow";
			height++;
		}
		
		// Check all nodes and total size
		if (root->checkStructure(minKeys, maxKeys, true, height, nullptr, nullptr) != count)
			throw "Size mismatch";
	}
	
	
	
	/*---- Helper class: B-tree node ----*/
	
	private: class Node final {
		
		/*-- Fields --*/
		
		// Size is in the range [0, maxKeys] for root node, [minKeys, maxKeys] for all other nodes.
		public: std::vector<E> keys;
		
		// If leaf then size is 0, otherwise if internal node then size always equals keys.size()+1.
		public: std::vector<std::unique_ptr<Node> > children;
		
		
		/*-- Constructors --*/
		
		// Note: Once created, a node's structure never changes between a leaf and internal node.
		public: Node(std::uint32_t maxKeys, bool leaf) {
			assert(maxKeys >= 3 && maxKeys % 2 == 1);
			keys.reserve(maxKeys);
			if (!leaf)
				children.reserve(maxKeys + 1);
		}
		
		
		/*-- Methods --*/
		
		public: bool isLeaf() const {
			return children.empty();
		}
		
		
		// Searches this node's keys vector and returns (true, i) if obj equals keys[i],
		// otherwise returns (false, i) if children[i] should be explored. For simplicity,
		// the implementation uses linear search. It's possible to replace it with binary search for speed.
		public: SearchResult search(const E &val) const {
			std::uint32_t i = 0;
			while (i < keys.size()) {
				const E &elem = keys.at(i);
				if (val == elem) {
					assert(i < keys.size());
					return SearchResult(true, i);  // Key found
				} else if (val > elem)
					i++;
				else  // val < elem
					break;
			}
			assert(i <= keys.size());
			return SearchResult(false, i);  // Not found, caller should recurse on child
		}
		
		
		// Removes and returns the minimum key among the whole subtree rooted at this node.
		// Requires this node to be preprocessed to have at least minKeys+1 keys.
		public: E removeMin(std::size_t minKeys) {
			for (Node *node = this; ; ) {
				assert(node->keys.size() > minKeys);
				if (node->isLeaf())
					return node->removeKey(0);
				else
					node = node->ensureChildRemove(minKeys, 0);
			}
		}
		
		
		// Removes and returns the maximum key among the whole subtree rooted at this node.
		// Requires this node to be preprocessed to have at least minKeys+1 keys.
		public: E removeMax(std::size_t minKeys) {
			for (Node *node = this; ; ) {
				assert(node->keys.size() > minKeys);
				if (node->isLeaf())
					return node->removeKey(node->keys.size() - 1);
				else
					node = node->ensureChildRemove(minKeys, node->children.size() - 1);
			}
		}
		
		
		// Removes and returns this node's key at the given index.
		public: E removeKey(std::uint32_t index) {
			E result = std::move(keys.at(index));
			keys.erase(keys.begin() + index);
			return result;
		}
		
		
		// For the child node at the given index, this moves the right half of keys and children to a new node,
		// and adds the middle key and new child to this node. The left half of child's data is not moved.
		public: void splitChild(std::size_t minKeys, std::size_t maxKeys, std::size_t index) {
			assert(!this->isLeaf() && index <= this->keys.size() && this->keys.size() < maxKeys);
			Node *left = this->children.at(index).get();
			assert(left->keys.size() == maxKeys);
			this->children.insert(this->children.begin() + index + 1, std::make_unique<Node>(maxKeys, left->isLeaf()));
			Node *right = this->children.at(index + 1).get();
			
			// Handle children
			if (!left->isLeaf()) {
				std::move(left->children.begin() + minKeys + 1, left->children.end(), std::back_inserter(right->children));
				left->children.erase(left->children.begin() + minKeys + 1, left->children.end());
			}
			
			// Handle keys
			this->keys.insert(this->keys.begin() + index, std::move(left->keys.at(minKeys)));
			std::move(left->keys.begin() + minKeys + 1, left->keys.end(), std::back_inserter(right->keys));
			left->keys.erase(left->keys.begin() + minKeys, left->keys.end());
		}
		
		
		// Merges the child node at index+1 into the child node at index,
		// assuming the current node is not empty and both children have minKeys.
		public: void mergeChildren(std::size_t minKeys, std::uint32_t index) {
			assert(!this->isLeaf() && index < this->keys.size());
			Node &left  = *children.at(index + 0);
			Node &right = *children.at(index + 1);
			assert(left.keys.size() == minKeys && right.keys.size() == minKeys);
			if (!left.isLeaf())
				std::move(right.children.begin(), right.children.end(), std::back_inserter(left.children));
			left.keys.push_back(removeKey(index));
			std::move(right.keys.begin(), right.keys.end(), std::back_inserter(left.keys));
			children.erase(children.begin() + index + 1);
		}
		
		
		// Performs modifications to ensure that this node's child at the given index has at least
		// minKeys+1 keys in preparation for a single removal. The child may gain a key and subchild
		// from its sibling, or it may be merged with a sibling, or nothing needs to be done.
		// A reference to the appropriate child is returned, which is helpful if the old child no longer exists.
		public: Node *ensureChildRemove(std::size_t minKeys, std::uint32_t index) {
			// Preliminaries
			assert(!this->isLeaf() && index < this->children.size());
			Node *child = this->children.at(index).get();
			if (child->keys.size() > minKeys)  // Already satisfies the condition
				return child;
			assert(child->keys.size() == minKeys);
			
			// Get siblings
			Node *left = index >= 1 ? this->children.at(index - 1).get() : nullptr;
			Node *right = index < this->keys.size() ? this->children.at(index + 1).get() : nullptr;
			bool internal = !child->isLeaf();
			assert(left != nullptr || right != nullptr);  // At least one sibling exists because degree >= 2
			assert(left  == nullptr || left ->isLeaf() != internal);  // Sibling must be same type (internal/leaf) as child
			assert(right == nullptr || right->isLeaf() != internal);  // Sibling must be same type (internal/leaf) as child
			
			if (left != nullptr && left->keys.size() > minKeys) {  // Steal rightmost item from left sibling
				if (internal) {
					child->children.insert(child->children.begin(), std::move(left->children.back()));
					left->children.pop_back();
				}
				child->keys.insert(child->keys.begin(), std::move(this->keys.at(index - 1)));
				this->keys.at(index - 1) = left->removeKey(left->keys.size() - 1);
				return child;
			} else if (right != nullptr && right->keys.size() > minKeys) {  // Steal leftmost item from right sibling
				if (internal) {
					child->children.push_back(std::move(right->children.front()));
					right->children.erase(right->children.begin());
				}
				child->keys.push_back(std::move(this->keys.at(index)));
				this->keys.at(index) = right->removeKey(0);
				return child;
			} else if (left != nullptr) {  // Merge child into left sibling
				this->mergeChildren(minKeys, index - 1);
				return left;  // This is the only case where the return value is different
			} else if (right != nullptr) {  // Merge right sibling into child
				this->mergeChildren(minKeys, index);
				return child;
			} else
				throw "Impossible condition";
		}
		
		
		// Checks the structure recursively and returns the total number
		// of keys in the subtree rooted at this node. For unit tests.
		public: std::size_t checkStructure(std::size_t minKeys, std::size_t maxKeys, bool isRoot, int leafDepth, const E *min, const E *max) const {
			// Check basic fields
			const std::size_t numKeys = keys.size();
			if (isLeaf() != (leafDepth == 0))
				throw "Incorrect leaf/internal node type";
			if (numKeys > maxKeys)
				throw "Invalid number of keys";
			if (isRoot && !isLeaf() && numKeys == 0)
				throw "Invalid number of keys";
			if (!isRoot && numKeys < minKeys)
				throw "Invalid number of keys";
			
			// Check keys for strict increasing order
			for (std::size_t i = 0; i < numKeys; i++) {
				const E &key = keys.at(i);
				bool fail = i == 0 && min != nullptr && key <= *min;
				fail |= i >= 1 && key <= keys.at(i - 1);
				fail |= i == numKeys - 1 && max != nullptr && key >= *max;
				if (fail)
					throw "Invalid key ordering";
			}
			
			// Check children recursively and count keys in this subtree
			std::size_t count = numKeys;
			if (!isLeaf()) {
				if (children.size() != numKeys + 1)
					throw "Invalid number of children";
				// Check children pointers and recurse
				for (std::size_t i = 0; i < children.size(); i++) {
					std::size_t temp = children.at(i)->checkStructure(
						minKeys, maxKeys, false, leafDepth - 1,
						(i == 0 ? min : &keys.at(i - 1)), (i == numKeys ? max : &keys.at(i)));
					if (SIZE_MAX - temp < count)
						throw "Size overflow";
					count += temp;
				}
			}
			return count;
		}
		
	};
	
};
