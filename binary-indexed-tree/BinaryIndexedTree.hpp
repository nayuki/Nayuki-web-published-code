/* 
 * Binary indexed tree (C++)
 * 
 * Copyright (c) 2021 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/binary-indexed-tree
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
#include <stdexcept>
#include <vector>
#include <utility>


template <typename T>
class BinaryIndexedTree final {
	
	/*---- Fields ----*/
	
	private: std::vector<T> sumTree;
	
	
	
	/*---- Constructors ----*/
	
	public: explicit BinaryIndexedTree(std::size_t len) :
		sumTree(len, T()) {}
	
	
	public: explicit BinaryIndexedTree(const std::vector<T> &vals) :
		BinaryIndexedTree(vals.data(), vals.size()) {}
	
	
	public: explicit BinaryIndexedTree(const T vals[], std::size_t len) :
			sumTree(vals, vals + len) {
		for (std::size_t i = 0; i < sumTree.size(); i++) {
			T val = sumTree.at(i);
			// For each consecutive 1 in the lowest order bits of i
			for (std::size_t j = 1; (i & j) != 0; j <<= 1)
				val += sumTree.at(i ^ j);
			sumTree.at(i) = val;
		}
	}
	
	
	public: explicit BinaryIndexedTree(const BinaryIndexedTree &other) = default;
	
	
	public: BinaryIndexedTree(BinaryIndexedTree &&other) = default;
	
	
	public: BinaryIndexedTree &operator=(BinaryIndexedTree other) {
		std::swap(sumTree, other.sumTree);
		return *this;
	}
	
	
	
	/*---- Methods ----*/
	
	public: std::size_t size() const {
		return sumTree.size();
	}
	
	
	public: T operator[](std::size_t index) const {
		if (!(0 <= index && index < sumTree.size()))
			throw std::out_of_range("Index out of bounds");
		T result = sumTree.at(index);
		// For each consecutive 1 in the lowest order bits of index
		for (std::size_t i = 1; (index & i) != 0; i <<= 1)
			result -= sumTree.at(index ^ i);
		return result;
	}
	
	
	public: void set(std::size_t index, T val) {
		if (!(0 <= index && index < sumTree.size()))
			throw std::out_of_range("Index out of bounds");
		add(index, val - (*this)[index]);
	}
	
	
	public: void add(std::size_t index, T delta) {
		if (!(0 <= index && index < sumTree.size()))
			throw std::out_of_range("Index out of bounds");
		do {
			sumTree.at(index) += delta;
			index |= index + 1;  // Set lowest 0 bit; strictly increasing
		} while (index < sumTree.size());
	}
	
	
	public: T getTotal() const {
		return getPrefixSum(sumTree.size());
	}
	
	
	public: T getPrefixSum(std::size_t end) const {
		if (!(0 <= end && end <= sumTree.size()))
			throw std::out_of_range("Index out of bounds");
		T result = T();
		while (end > 0) {
			result += sumTree.at(end - 1);
			end &= end - 1;  // Clear lowest 1 bit; strictly decreasing
		}
		return result;
	}
	
	
	public: T getRangeSum(std::size_t start, std::size_t end) const {
		if (!(0 <= start && start <= end && end <= sumTree.size()))
			throw std::out_of_range("Index out of bounds");
		return getPrefixSum(end) - getPrefixSum(start);
	}
	
};
