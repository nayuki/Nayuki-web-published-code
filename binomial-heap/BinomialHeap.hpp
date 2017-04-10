/* 
 * Binomial heap (C++)
 * 
 * Copyright (c) 2017 Project Nayuki
 * https://www.nayuki.io/page/binomial-heap
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

#include <cassert>
#include <cstdlib>
#include <utility>


template <typename E>
class BinomialHeap final {
	
	private: class Node;  // Forward declaration
	private: Node head;   // The head node is an immovable dummy node
	
	
	public: BinomialHeap()
		: head() {}  // Dummy node
	
	
	public: size_t size() const {
		size_t result = 0;
		for (Node *node = head.next; node != nullptr; node = node->next) {
			size_t temp = safeLeftShift(1, node->rank);
			if (temp == 0)
				throw "Size overflow";  // The result cannot be returned, however the data structure is still valid
			result |= temp;
		}
		return result;
	}
	
	
	public: void clear() {
		delete head.next;
		head.next = nullptr;
	}
	
	
	public: void push(const E &val) {
		merge(new Node(val));
	}
	
	
	public: void push(E &&val) {
		merge(new Node(std::move(val)));
	}
	
	
	public: const E &top() const {
		if (head.next == nullptr)
			throw "Empty heap";
		E *result = nullptr;
		for (Node *node = head.next; node != nullptr; node = node->next) {
			if (result == nullptr || node->value < *result)
				result = &node->value;
		}
		return *result;
	}
	
	
	public: E pop() {
		if (head.next == nullptr)
			throw "Empty heap";
		E *min = nullptr;
		Node *nodeBeforeMin = nullptr;
		for (Node *node = head.next, *prevNode = &head; node != nullptr; prevNode = node, node = node->next) {
			if (min == nullptr || node->value < *min) {
				min = &node->value;
				nodeBeforeMin = prevNode;
			}
		}
		assert(min != nullptr && nodeBeforeMin != nullptr);
		
		Node *minNode = nodeBeforeMin->next;
		assert(min == &minNode->value);
		nodeBeforeMin->next = minNode->next;
		minNode->next = nullptr;
		merge(minNode->removeRoot());
		E result(std::move(*min));
		delete minNode;
		return result;
	}
	
	
	// Moves all the values in the given heap into this heap
	public: void merge(BinomialHeap<E> &other) {
		if (&other == this)
			throw "Merging with self";
		merge(other.head.next);
		other.head.next = nullptr;
	}
	
	
	// 'other' must not start with a dummy node
	private: void merge(Node *other) {
		assert(head.rank == -1);
		Node *self = head.next;
		head.next = nullptr;
		Node *prevTail = nullptr;
		Node *tail = &head;
		
		while (self != nullptr || other != nullptr) {
			Node *node;
			if (other == nullptr || (self != nullptr && self->rank <= other->rank)) {
				node = self;
				self = self->next;
			} else {
				node = other;
				other = other->next;
			}
			node->next = nullptr;
			
			assert(tail->next == nullptr);
			if (tail->rank < node->rank) {
				prevTail = tail;
				tail->next = node;
				tail = node;
			} else if (tail->rank == node->rank + 1) {
				assert(prevTail != nullptr);
				node->next = tail;
				prevTail->next = node;
				prevTail = node;
			} else if (tail->rank == node->rank) {
				// Merge nodes
				if (tail->value <= node->value) {
					node->next = tail->down;
					tail->down = node;
					tail->rank++;
				} else {
					assert(prevTail != nullptr);
					tail->next = node->down;
					node->down = tail;
					node->rank++;
					tail = node;
					prevTail->next = node;
				}
			} else
				throw "Assertion error";
		}
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
			throw "Assertion error";
		if (head.next != nullptr) {
			if (head.next->rank <= head.rank)
				throw "Assertion error";
			head.next->checkStructure(true);
		}
	}
	
	
	
	private: class Node final {
		
		public: E value;
		public: int rank;
		
		public: Node *down;
		public: Node *next;
		
		
		
		// Dummy sentinel node at head of list
		public: Node() :
			value(),  // Type E needs to have a default constructor
			rank(-1),
			down(nullptr),
			next(nullptr) {}
		
		
		// Regular node
		public: Node(const E &val) :
			value(val),  // Copy constructor
			rank(0),
			down(nullptr),
			next(nullptr) {}
		
		
		// Regular node
		public: Node(E &&val) :
			value(std::move(val)),  // Move constructor
			rank(0),
			down(nullptr),
			next(nullptr) {}
		
		
		public: ~Node() {
			delete down;
			delete next;
		}
		
		
		
		public: Node *removeRoot() {
			assert(next == nullptr);
			Node *node = down;
			down = nullptr;
			Node *result = nullptr;
			while (node != nullptr) {  // Reverse the order of nodes from descending rank to ascending rank
				Node *next = node->next;
				node->next = result;
				result = node;
				node = next;
			}
			return result;
		}
		
		
		// For unit tests
		public: void checkStructure(bool isMain) const {
			if (rank < 0)
				throw "Assertion error";
			if (rank >= 1) {
				if (down == nullptr || down->rank != rank - 1)
					throw "Assertion error";
				down->checkStructure(false);
				if (!isMain) {
					if (next == nullptr || next->rank != rank - 1)
						throw "Assertion error";
					next->checkStructure(false);
				}
			}
			if (isMain && next != nullptr) {
				if (next->rank <= rank)
					throw "Assertion error";
				next->checkStructure(true);
			}
		}
		
	};
	
};
