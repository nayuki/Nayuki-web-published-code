/* 
 * Binary array set (C++)
 * 
 * Copyright (c) 2014 Nayuki Minase
 * http://nayuki.eigenstate.org/page/binary-array-set
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
class BinaryArraySet {
	
public:
	
	BinaryArraySet() :
		values(),
		length(0) {}
	
	
	~BinaryArraySet() {
		clear();
	}
	
	
	// Runs in O(1) time
	size_t size() {
		return length;
	}
	
	
	// Runs in O(n) time due to destructors
	void clear() {
		for (size_t i = 0; i < values.size(); i++) {
			E *vals = values.at(i);
			if (vals != NULL) {
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
	bool contains(const E &val) {
		for (size_t i = 0; i < values.size(); i++) {
			const E *vals = values.at(i);
			if (vals != NULL) {
				// Binary search
				size_t start = 0;
				size_t end = (size_t)1 << i;
				while (start < end) {
					size_t mid = (start + end) / 2;
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
	bool add(const E &val) {
		// Checking for duplicates is expensive, taking O((log n)^2) time
		if (contains(val))
			return false;
		
		// The pure add portion below runs in amortized O(1) time
		E *toPut = static_cast<E*>(malloc(sizeof(E)));  // To avoid constructing blank elements of type E, we don't use the 'new' operator
		new (toPut) E(val);  // Placement copy constructor of input argument value
		addHelper(toPut);
		return true;
	}
	
	
	// Move version
	bool add(E &&val) {
		if (contains(val))
			return false;
		E *toPut = static_cast<E*>(malloc(sizeof(E)));  // To avoid constructing blank elements of type E, we don't use the 'new' operator
		new (toPut) E(std::move(val));  // Placement move constructor of input argument value
		addHelper(toPut);
		return true;
	}
	
	
private:
	void addHelper(E *toPut) {
		for (size_t i = 0; i < values.size(); i++) {
			E *vals = values.at(i);
			if (vals == NULL) {
				values.at(i) = toPut;
				toPut = NULL;
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
				free(vals);
				free(toPut);
				values.at(i) = NULL;
				toPut = next;
			}
		}
		if (toPut != NULL)
			values.push_back(toPut);
		length++;
	}
	
	
	// For unit tests
public:
	void checkStructure() {
		size_t sum = 0;
		for (size_t i = 0; i < values.size(); i++) {
			const E *vals = values.at(i);
			if (vals != NULL) {
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
	
	
private:
	
	std::vector<E*> values;  // Element i is either NULL or a malloc()'d array of length 1 << i
	size_t length;
	
};
