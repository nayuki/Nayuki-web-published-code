/* 
 * Binomial heap (C++)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/binomial-heap
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

#include <cassert>
#include <cstddef>
#include <memory>
#include <utility>

using std::size_t;
using std::unique_ptr;


template <typename E>
class BinomialHeap final {
	
	private: class Node;  // Forward declaration
	
	
	/*---- Fields ----*/
	
	private: Node head;   // The head node is an immovable dummy node
	
	
	
	/*---- Constructors ----*/
	
	public: BinomialHeap() {}
	
	
	
	/*---- Methods ----*/
	
	public: bool empty() const {
		return isNull(head.next);
	}
	
	
	public: size_t size() const {
		size_t result = 0;
		for (const Node *node = head.next.get(); node != nullptr; node = node->next.get()) {
			size_t temp = safeLeftShift(1, node->rank);
			if (temp == 0) {
				// The result cannot be returned, however the data structure is still valid
				throw "Size overflow";
			}
			result |= temp;
		}
		return result;
	}
	
	
	public: void clear() {
		head.next.reset();
	}
	
	
	public: void push(const E &val) {
		mergeNodes(std::make_unique<Node>(val));
	}
	
	
	public: void push(E &&val) {
		mergeNodes(std::make_unique<Node>(std::move(val)));
	}
	
	
	public: const E &top() const {
		if (empty())
			throw "Empty heap";
		const E *result = nullptr;
		for (const Node *node = head.next.get(); node != nullptr; node = node->next.get()) {
			if (result == nullptr || node->value < *result)
				result = &node->value;
		}
		assert(result != nullptr);
		return *result;
	}
	
	
	public: E pop() {
		if (empty())
			throw "Empty heap";
		const E *min = nullptr;
		Node *nodeBeforeMin = nullptr;
		for (Node *prevNode = &head; ; ) {
			Node *node = prevNode->next.get();
			if (node == nullptr)
				break;
			if (min == nullptr || node->value < *min) {
				min = &node->value;
				nodeBeforeMin = prevNode;
			}
			prevNode = node;
		}
		assert(min != nullptr && nodeBeforeMin != nullptr);
		
		unique_ptr<Node> minNode = std::move(nodeBeforeMin->next);
		assert(min == &minNode->value);
		nodeBeforeMin->next.swap(minNode->next);
		mergeNodes(minNode->removeRoot());
		return std::move(*min);
	}
	
	
	// Moves all the values in the given heap into this heap
	public: void merge(BinomialHeap<E> &other) {
		if (&other == this)
			throw "Merging with self";
		mergeNodes(std::move(other.head.next));
	}
	
	
	private: void mergeNodes(unique_ptr<Node> other) {
		assert(head.rank == -1);
		assert(other.get() == nullptr || other->rank >= 0);
		unique_ptr<Node> self = std::move(head.next);
		Node *prevTail = nullptr;
		Node *tail = &head;
		
		while (!isNull(self) || !isNull(other)) {
			unique_ptr<Node> node;
			if (isNull(other) || (!isNull(self) && self->rank <= other->rank)) {
				node = std::move(self);
				self.swap(node->next);
			} else {
				node = std::move(other);
				other.swap(node->next);
			}
			assert(!isNull(node));
			assert(isNull(node->next));
			
			assert(isNull(tail->next));
			if (tail->rank < node->rank) {
				prevTail = tail;
				tail->next = std::move(node);
				tail = tail->next.get();
			} else if (tail->rank == node->rank + 1) {
				assert(prevTail != nullptr);
				node->next = std::move(prevTail->next);
				prevTail->next = std::move(node);
				prevTail = prevTail->next.get();
			} else if (tail->rank == node->rank) {
				// Merge nodes
				if (node->value < tail->value) {
					std::swap(node->value, tail->value);
					std::swap(node->down, tail->down);
				}
				node->next = std::move(tail->down);
				tail->down = std::move(node);
				tail->rank++;
			} else
				throw "Assertion error";
			assert(isNull(node));
		}
	}
	
	
	private: static bool isNull(const unique_ptr<Node> &p) {
		return p.get() == nullptr;
	}
	
	
	private: static size_t safeLeftShift(size_t val, int shift) {  // Avoids undefined behavior, e.g. 1 << 999
		if (shift < 0)
			throw "Negative shift";
		for (int i = 0; i < shift && val != 0; i++)
			val <<= 1;
		return val;
	}
	
	
	// For unit tests
	public: void checkStructure() const {
		if (head.rank != -1)
			throw "Assertion error: Head must be dummy node";
		// Check chain of nodes and their children
		head.checkStructure(true, nullptr);
	}
	
	
	
	/*---- Helper class: Binomial heap node ----*/
	
	private: class Node final {
		
		/*-- Fields --*/
		
		public: E value;
		public: signed char rank;
		
		public: unique_ptr<Node> down;
		public: unique_ptr<Node> next;
		
		
		/*-- Constructors --*/
		
		// Dummy sentinel node at head of list
		public: Node() :
			value(),  // Type E needs to have a default constructor
			rank(-1) {}
		
		
		// Regular node
		public: Node(const E &val) :
			value(val),  // Copy constructor
			rank(0) {}
		
		
		// Regular node
		public: Node(E &&val) :
			value(std::move(val)),  // Move constructor
			rank(0) {}
		
		
		/*-- Methods --*/
		
		public: unique_ptr<Node> removeRoot() {
			assert(isNull(next));
			unique_ptr<Node> node = std::move(down);
			unique_ptr<Node> result;
			while (!isNull(node)) {  // Reverse the order of nodes from descending rank to ascending rank
				node->next.swap(result);
				node.swap(result);
			}
			return result;
		}
		
		
		// For unit tests
		public: void checkStructure(bool isMain, const E *lowerBound) const {
			// Basic checks
			if (isMain ^ (lowerBound == nullptr))
				throw "Assertion error: Invalid arguments";
			if (!isMain && value < *lowerBound)
				throw "Assertion error: Min-heap property violated";
			
			// Check children and non-main chain
			if (rank > 0) {
				if (isNull(down) || down->rank != rank - 1)
					throw "Assertion error: Down node absent or has invalid rank";
				down->checkStructure(false, &value);
				if (!isMain) {
					if (isNull(next) || next->rank != rank - 1)
						throw "Assertion error: Next node absent or has invalid rank";
					next->checkStructure(false, lowerBound);
				}
			} else if (!isNull(down))
				throw "Assertion error: Down node must be absent";
			
			// Check main chain
			if (isMain && !isNull(next)) {
				if (next->rank <= rank)
					throw "Assertion error: Next node has invalid rank";
				next->checkStructure(true, nullptr);
			}
		}
		
	};
	
};
