/* 
 * Binomial heap (C++)
 * 
 * Copyright (c) 2014 Nayuki Minase
 * http://nayuki.eigenstate.org/page/binomial-heap
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

#include <cstdlib>


template <typename E>
class BinomialHeap {
	
private:
	class Node;
	Node head;
	
	
public:
	
	BinomialHeap()
		: head()  // Dummy node
	{}
	
	
	~BinomialHeap() {}
	
	
	size_t size() const {
		size_t result = 0;
		for (Node *node = head.next; node != NULL; node = node->next) {
			size_t temp = safeLeftShift(1, node->rank);
			if (temp == 0)
				throw "Size overflow";  // The result cannot be returned, however the data structure is still valid
			result |= temp;
		}
		return result;
	}
	
	
	void clear() {
		head.next = NULL;
	}
	
	
	void enqueue(const E &val) {
		merge(new Node(val));
	}
	
	
	const E &peek() const {
		if (head.next == NULL)
			throw "Empty heap";
		E *result = NULL;
		for (Node *node = head.next; node != NULL; node = node->next) {
			if (result == NULL || node->value < *result)
				result = &node->value;
		}
		return *result;
	}
	
	
	E dequeue() {
		if (head.next == NULL)
			throw "Empty heap";
		E *min = NULL;
		Node *nodeBeforeMin = NULL;
		for (Node *node = head.next, *prevNode = &head; node != NULL; prevNode = node, node = node->next) {
			if (min == NULL || node->value < *min) {
				min = &node->value;
				nodeBeforeMin = prevNode;
			}
		}
		
		Node *temp = nodeBeforeMin->next;
		nodeBeforeMin->next = nodeBeforeMin->next->next;
		temp->next = NULL;
		merge(Node::removeRoot(temp));
		E result = std::move(*min);
		delete temp;
		return result;
	}
	
	
	// Moves all the values in the given heap into this heap
	void merge(BinomialHeap<E> &other) {
		if (&other == this)
			throw "Merging with self";
		merge(other.head.next);
		other.head.next = NULL;
	}
	
	
private:
	
	// 'other' must not start with a dummy node
	void merge(Node *other) {
		if (head.rank != -1)
			throw "Assertion error";
		Node *self = head.next;
		head.next = NULL;
		Node *prevTail = NULL;
		Node *tail = &head;
		
		while (self != NULL || other != NULL) {
			Node *node;
			if (other == NULL || (self != NULL && self->rank <= other->rank)) {
				node = self;
				self = self->next;
			} else {
				node = other;
				other = other->next;
			}
			node->next = NULL;
			
			if (tail->next != NULL)
				throw "Assertion error";
			if (tail->rank < node->rank) {
				prevTail = tail;
				tail->next = node;
				tail = tail->next;
			} else if (tail->rank == node->rank + 1) {
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
					tail->next = node->down;
					node->down = tail;
					node->rank++;
					tail = node;
					prevTail->next = tail;
				}
			} else
				throw "Assertion error";
		}
	}
	
	
	static size_t safeLeftShift(size_t val, int shift) {  // Avoids undefined behavior, e.g. 1 << 999
		if (shift < 0)
			throw "Negative shift";
		for (int i = 0; i < shift && val != 0; i++)
			val <<= 1;
		return val;
	}
	
	
public:
	// For unit tests
	void checkStructure() {
		if (head.rank != -1)
			throw "Assertion error";
		if (head.next != NULL) {
			if (head.next->rank <= head.rank)
				throw "Assertion error";
			head.next->checkStructure(true);
		}
	}
	
	
	
private:
	class Node {
		
	public:
		E value;
		int rank;
		
		Node *down;
		Node *next;
		
		
		
		// Dummy sentinel node at head of list
		Node() :
			value(),  // Default constructor for type E
			rank(-1),
			down(NULL),
			next(NULL)
		{}
		
		
		// Regular node
		Node(const E &val) :
			value(val),  // Copy constructor
			rank(0),
			down(NULL),
			next(NULL)
		{}
		
		
		~Node() {
			if (down != NULL)
				delete down;
			if (next != NULL)
				delete next;
		}
		
		
		
		static Node *removeRoot(Node *node) {
			if (node->next != NULL)
				throw "Assertion error";
			Node *temp = node->down;
			node->down = NULL;
			Node *result = NULL;
			node = temp;
			while (node != NULL) {  // Reverse the order of nodes from descending rank to ascending rank
				Node *next = node->next;
				node->next = result;
				result = node;
				node = next;
			}
			return result;
		}
		
		
		// For unit tests
		void checkStructure(bool isMain) {
			if (rank < 0)
				throw "Assertion error";
			if (rank >= 1) {
				if (down == NULL || down->rank != rank - 1)
					throw "Assertion error";
				down->checkStructure(false);
				if (!isMain) {
					if (next == NULL || next->rank != rank - 1)
						throw "Assertion error";
					next->checkStructure(false);
				}
			}
			if (isMain && next != NULL) {
				if (next->rank <= rank)
					throw "Assertion error";
				next->checkStructure(true);
			}
		}
		
	};
	
};
