/* 
 * Binary array set (C++)
 * 
 * Copyright (c) 2024 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/binary-array-set
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

#include <cstddef>
#include <cstdint>
#include <limits>
#include <stdexcept>
#include <utility>
#include <vector>


template <typename E>
class BinaryArraySet final {
	
	/*---- Fields ----*/
	
	// At each index i, the vector has length either 0 or 2^i, and contains elements in ascending order
	private: std::vector<std::vector<E> > values;
	
	// Sum of all the sub-vector sizes
	private: std::size_t length;
	
	
	
	/*---- Constructors ----*/
	
	// Runs in O(1) time
	public: explicit BinaryArraySet() :
		values(),
		length(0) {}
	
	
	public: explicit BinaryArraySet(const BinaryArraySet &other) = default;
	
	
	public: BinaryArraySet(BinaryArraySet &&other) = default;
	
	
	public: BinaryArraySet &operator=(BinaryArraySet other) {
		std::swap(values, other.values);
		std::swap(length, other.length);
		return *this;
	}
	
	
	
	/*---- Methods ----*/
	
	public: bool empty() const {
		return length == 0;
	}
	
	
	// Runs in O(1) time
	public: std::size_t size() const {
		return length;
	}
	
	
	// Runs in O(n) time due to destructors
	public: void clear() {
		values.clear();
		length = 0;
	}
	
	
	// Runs in O((log n)^2) time
	public: bool contains(const E &val) const {
		for (const std::vector<E> &vals : values) {
			// Binary search
			for (std::size_t start = 0, end = vals.size(); start < end; ) {
				std::size_t mid = start + (end - start) / 2;
				const E &midval = vals[mid];
				if (val < midval)
					end = mid;
				else if (val > midval)
					start = mid + 1;
				else  // val == midval
					return true;
			}
		}
		return false;
	}
	
	
	// Runs in average-case O((log n)^2) time, worst-case O(n) time
	public: void insert(E val) {
		if (!contains(val))
			insertUnique(std::move(val));
	}
	
	
	// Runs in amortized O(log n) time, worst-case O(n) time
	public: void insertUnique(E val) {
		std::vector<E> toPut{std::move(val)};
		insertHelper(std::move(toPut));
	}
	
	
	private: void insertHelper(std::vector<E> toPut) {
		if (length == SIZE_MAX)
			throw std::length_error("Maximum size reached");
		for (std::size_t i = 0; ; i++) {
			if (i >= values.size()) {
				values.push_back(std::move(toPut));
				break;
			}
			std::vector<E> &vals = values.at(i);
			if (vals.empty()) {
				vals = std::move(toPut);
				break;
			}
			
			// Merge two sorted arrays
			if (vals.size() != toPut.size() || vals.size() > SIZE_MAX / 2)
				throw std::logic_error("Assertion error");
			std::vector<E> next;
			next.reserve(vals.size() * 2);
			std::size_t j = 0;
			std::size_t k = 0;
			for (; j < vals.size() && k < toPut.size(); ) {
				if (vals[j] < toPut[k]) {
					next.push_back(std::move(vals[j]));
					j++;
				} else {
					next.push_back(std::move(toPut[k]));
					k++;
				}
			}
			for (; j < vals.size(); j++)
				next.push_back(std::move(vals[j]));
			for (; k < toPut.size(); k++)
				next.push_back(std::move(toPut[k]));
			vals.clear();
			vals.shrink_to_fit();
			toPut = std::move(next);
		}
		length++;
	}
	
	
	// For unit tests
	public: void checkStructure() const {
		std::size_t sum = 0;
		for (std::size_t i = 0; i < values.size(); i++) {
			if (i >= std::numeric_limits<std::size_t>::digits)
				throw std::logic_error("Vector too long");
			const std::vector<E> &vals = values.at(i);
			std::size_t len = vals.size();
			if (len != 0 && len != static_cast<std::size_t>(1) << i)
				throw std::logic_error("Invalid sub-vector length");
			for (std::size_t j = 1; j < len; j++) {
				if (vals[j - 1] >= vals[j])
					throw std::logic_error("Invalid ordering of elements in array");
			}
			sum += len;
		}
		if (sum != length)
			throw std::logic_error("Size mismatch between counter and sub-vectors");
	}
	
};
