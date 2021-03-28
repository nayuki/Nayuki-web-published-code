/* 
 * Binomial heap (C++)
 * 
 * Copyright (c) 2021 Project Nayuki. (MIT License)
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
#include <stdexcept>
#include <utility>


template <typename E>
class BinomialHeap final {
	
	private: class Node;  // Forward declaration
	
	
	/*---- Fields ----*/
	
	private: std::unique_ptr<Node> head;
	
	
	
	/*---- Constructors ----*/
	
	public: explicit BinomialHeap() {}
	
	
	public: explicit BinomialHeap(const BinomialHeap &other) {
		if (other.head.get() != nullptr)
			head.reset(new Node(*other.head.get()));
	}
	
	
	public: BinomialHeap(BinomialHeap &&other) {
		head.swap(other.head);
	}
	
	
	
	/*---- Methods ----*/
	
	public: BinomialHeap &operator=(const BinomialHeap &other) {
		BinomialHeap temp(other);
		head.swap(temp.head);
		return *this;
	}
	
	
	public: BinomialHeap &operator=(BinomialHeap &&other) {
		head.swap(other.head);
		return *this;
	}
	
	
	public: bool empty() const {
		return isNull(head);
	}
	
	
	public: std::size_t size() const {
		std::size_t result = 0;
		for (const Node *node = head.get(); node != nullptr; node = node->next.get()) {
			std::size_t temp = safeLeftShift(1, node->rank);
			if (temp == 0) {
				// The result cannot be returned, however the data structure is still valid
				throw std::overflow_error("Size overflow");
			}
			result |= temp;
		}
		return result;
	}
	
	
	public: void clear() {
		head.reset();
	}
	
	
	public: void push(E val) {
		mergeNodes(std::make_unique<Node>(std::move(val)));
	}
	
	
	public: const E &top() const {
		if (empty())
			throw std::logic_error("Empty heap");
		const E *result = nullptr;
		for (const Node *node = head.get(); node != nullptr; node = node->next.get()) {
			if (result == nullptr || node->value < *result)
				result = &node->value;
		}
		assert(result != nullptr);
		return *result;
	}
	
	
	public: E pop() {
		if (empty())
			throw std::logic_error("Empty heap");
		const E *min = nullptr;
		std::unique_ptr<Node> *linkToMin = nullptr;
		for (std::unique_ptr<Node> *link = &head; ; ) {
			Node *node = link->get();
			if (node == nullptr)
				break;
			if (min == nullptr || node->value < *min) {
				min = &node->value;
				linkToMin = link;
			}
			link = &node->next;
		}
		assert(min != nullptr && linkToMin != nullptr);
		
		std::unique_ptr<Node> minNode = std::move(*linkToMin);
		assert(min == &minNode->value);
		linkToMin->swap(minNode->next);
		mergeNodes(minNode->removeRoot());
		return std::move(*min);
	}
	
	
	// Moves all the values in the given heap into this heap.
	// Using std::move() is strongly recommended to avoid copying the entire argument heap.
	public: void merge(BinomialHeap other) {
		mergeNodes(std::move(other.head));
	}
	
	
	private: void mergeNodes(std::unique_ptr<Node> other) {
		std::unique_ptr<Node> self = std::move(head);
		std::unique_ptr<Node> *linkToTail = nullptr;
		Node *tail = nullptr;
		
		while (!isNull(self) || !isNull(other)) {
			std::unique_ptr<Node> node;
			if (isNull(other) || (!isNull(self) && self->rank <= other->rank)) {
				node = std::move(self);
				self.swap(node->next);
			} else {
				node = std::move(other);
				other.swap(node->next);
			}
			assert(!isNull(node));
			assert(isNull(node->next));
			
			assert(tail == nullptr || isNull(tail->next));
			if (tail == nullptr) {
				head = std::move(node);
				linkToTail = &head;
				tail = head.get();
			} else if (tail->rank < node->rank) {
				linkToTail = &tail->next;
				tail->next = std::move(node);
				tail = tail->next.get();
			} else if (tail->rank == node->rank + 1) {
				assert(linkToTail != nullptr);
				node->next = std::move(*linkToTail);
				*linkToTail = std::move(node);
				linkToTail = &(*linkToTail)->next;
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
				throw std::logic_error("Assertion error");
			assert(isNull(node));
		}
	}
	
	
	private: static bool isNull(const std::unique_ptr<Node> &p) {
		return p.get() == nullptr;
	}
	
	
	private: static std::size_t safeLeftShift(std::size_t val, int shift) {  // Avoids undefined behavior, e.g. 1 << 999
		if (shift < 0)
			throw std::domain_error("Negative shift");
		for (int i = 0; i < shift && val != 0; i++)
			val <<= 1;
		return val;
	}
	
	
	// For unit tests
	public: void checkStructure() const {
		// Check chain of nodes and their children
		if (!isNull(head))
			head->checkStructure(true, nullptr);
	}
	
	
	
	/*---- Helper class: Binomial heap node ----*/
	
	private: class Node final {
		
		/*-- Fields --*/
		
		public: E value;
		public: signed char rank;
		
		public: std::unique_ptr<Node> down;
		public: std::unique_ptr<Node> next;
		
		
		/*-- Constructors --*/
		
		// Regular node
		public: Node(E val) :
			value(std::move(val)),
			rank(0) {}
		
		
		public: Node(const Node &other) :
				value(other.value),
				rank(other.rank) {
			if (other.down.get() != nullptr)
				down.reset(new Node(*other.down.get()));
			if (other.next.get() != nullptr)
				next.reset(new Node(*other.next.get()));
		}
		
		
		/*-- Methods --*/
		
		public: std::unique_ptr<Node> removeRoot() {
			assert(isNull(next));
			std::unique_ptr<Node> node = std::move(down);
			std::unique_ptr<Node> result;
			while (!isNull(node)) {  // Reverse the order of nodes from descending rank to ascending rank
				node->next.swap(result);
				node.swap(result);
			}
			return result;
		}
		
		
		// For unit tests
		public: void checkStructure(bool isMain, const E *lowerBound) const {
			// Basic checks
			if (isMain != (lowerBound == nullptr))
				throw std::logic_error("Assertion error: Invalid arguments");
			if (!isMain && value < *lowerBound)
				throw std::logic_error("Assertion error: Min-heap property violated");
			
			// Check children and non-main chain
			if (rank > 0) {
				if (isNull(down) || down->rank != rank - 1)
					throw std::logic_error("Assertion error: Down node absent or has invalid rank");
				down->checkStructure(false, &value);
				if (!isMain) {
					if (isNull(next) || next->rank != rank - 1)
						throw std::logic_error("Assertion error: Next node absent or has invalid rank");
					next->checkStructure(false, lowerBound);
				}
			} else if (!isNull(down))
				throw std::logic_error("Assertion error: Down node must be absent");
			
			// Check main chain
			if (isMain && !isNull(next)) {
				if (next->rank <= rank)
					throw std::logic_error("Assertion error: Next node has invalid rank");
				next->checkStructure(true, nullptr);
			}
		}
		
	};
	
};
