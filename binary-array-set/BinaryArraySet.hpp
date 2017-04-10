/* 
 * Binary array set (C++)
 * 
 * Copyright (c) 2017 Project Nayuki
 * https://www.nayuki.io/page/binary-array-set
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
#include <utility>
#include <vector>


template <typename E>
class BinaryArraySet final {
	
	/*---- Fields ----*/
	
	private: std::vector<E*> values;  // Element i is either nullptr or a malloc()'d array of length (1 << i) ascending elements of E
	private: size_t length;
	
	
	
	/*---- Constructors, etc. ----*/
	
	// Runs in O(1) time
	public: BinaryArraySet() :
		values(),
		length(0) {}
	
	
	// Copy constructor, runs in O(n) time
	public: BinaryArraySet(const BinaryArraySet &other) :
			BinaryArraySet() {
		*this = other;
	}
	
	
	// Move constructor, runs in O(1) time
	public: BinaryArraySet(BinaryArraySet &&other) :
			values(std::move(other.values)),
			length(other.length) {}
	
	
	// Copy assignment, runs in O(n) time
	public: BinaryArraySet &operator=(const BinaryArraySet &other) {
		clear();
		for (size_t i = 0; i < other.values.size(); i++) {
			E *oldVals = values.at(i);
			if (oldVals == nullptr)
				continue;
			size_t len = (size_t)1 << i;
			E *newVals = static_cast<E*>(malloc(len * sizeof(E)));
			for (size_t j = 0; j < len; j++)
				new (&newVals[j]) E(oldVals[j]);  // Placement move constructor
			values.push_back(newVals);
		}
		length = other.length;
		return *this;
	}
	
	
	// Move assignment, runs in O(1) time
	public: BinaryArraySet &operator=(BinaryArraySet &&other) {
		values = std::move(other.values);
		length = other.length;
		return *this;
	}
	
	
	// Runs in O(log n) time for simple types (e.g. E = int),
	// otherwise O(n) time due to element destructors
	public: ~BinaryArraySet() {
		clear();
	}
	
	
	
	/*---- Methods ----*/
	
	public: bool empty() const {
		return length == 0;
	}
	
	
	// Runs in O(1) time
	public: size_t size() const {
		return length;
	}
	
	
	// Runs in O(n) time due to destructors
	public: void clear() {
		for (size_t i = 0; i < values.size(); i++) {
			E *vals = values.at(i);
			if (vals != nullptr) {
				size_t len = (size_t)1 << i;
				for (size_t j = 0; j < len; j++)
					vals[j].~E();
			}
			free(vals);
		}
		values.clear();
		length = 0;
	}
	
	
	// Runs in O((log n)^2) time
	public: bool contains(const E &val) const {
		for (size_t i = 0; i < values.size(); i++) {
			const E *vals = values.at(i);
			if (vals != nullptr) {
				// Binary search
				size_t start = 0;
				size_t end = (size_t)1 << i;
				while (start < end) {
					size_t mid = start + (end - start) / 2;
					const E &midval = vals[mid];
					if (val < midval)
						end = mid;
					else if (val > midval)
						start = mid + 1;
					else  // val == midval
						return true;
				}
			}
		}
		return false;
	}
	
	
	// Runs in average-case O((log n)^2) time, worst-case O(n) time
	public: void insert(const E &val) {
		// Checking for duplicates is expensive, taking O((log n)^2) time
		if (contains(val))
			return;
		
		E *toPut = static_cast<E*>(malloc(sizeof(E)));  // To avoid constructing blank elements of type E, we don't use the 'new' operator
		new (toPut) E(val);  // Placement copy constructor of input argument value
		insertHelper(toPut);
	}
	
	
	// Move version
	public: void insert(E &&val) {
		if (contains(val))
			return;
		E *toPut = static_cast<E*>(malloc(sizeof(E)));  // To avoid constructing blank elements of type E, we don't use the 'new' operator
		new (toPut) E(std::move(val));  // Placement move constructor of input argument value
		insertHelper(toPut);
	}
	
	
	// This pure insert method runs in amortized O(1) time
	private: void insertHelper(E *toPut) {
		for (size_t i = 0; i < values.size(); i++) {
			E *vals = values.at(i);
			if (vals == nullptr) {
				values.at(i) = toPut;
				toPut = nullptr;
				break;
			} else {
				// Merge two sorted arrays
				size_t len = (size_t)1 << i;
				if (SIZE_MAX / len / 2 / sizeof(E) < 1)
					throw "Maximum size reached";
				E *next = static_cast<E*>(malloc(len * 2 * sizeof(E)));
				size_t j = 0;
				size_t k = 0;
				size_t l = 0;
				for (; j < len && k < len; l++) {
					if (vals[j] < toPut[k]) {
						new (&next[l]) E(std::move(vals[j]));  // Placement move constructor
						j++;
					} else {
						new (&next[l]) E(std::move(toPut[k]));
						k++;
					}
				}
				for (; j < len; j++, l++)
					new (&next[l]) E(std::move(vals[j]));
				for (; k < len; k++, l++)
					new (&next[l]) E(std::move(toPut[k]));
				for (j = 0; j < len; j++) {
					vals [j].~E();
					toPut[j].~E();
				}
				free(vals);
				free(toPut);
				values.at(i) = nullptr;
				toPut = next;
			}
		}
		if (toPut != nullptr)
			values.push_back(toPut);
		length++;
	}
	
	
	// For unit tests
	public: void checkStructure() const {
		size_t sum = 0;
		for (size_t i = 0; i < values.size(); i++) {
			const E *vals = values.at(i);
			if (vals != nullptr) {
				size_t len = (size_t)1 << i;
				sum += len;
				for (size_t j = 1; j < len; j++) {
					if (vals[j - 1] >= vals[j])
						throw "Invalid ordering of elements in array";
				}
			}
		}
		if (sum != length)
			throw "Size mismatch between counter and arrays";
	}
	
};
