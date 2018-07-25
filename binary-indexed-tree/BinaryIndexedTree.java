/* 
 * Binary indexed tree (Java)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
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

import java.util.Objects;


public final class BinaryIndexedTree {
	
	/*---- Field ----*/
	
	private long[] sumTree;
	
	
	
	/*---- Constructors ----*/
	
	public BinaryIndexedTree(int len) {
		sumTree = new long[len];
	}
	
	
	public BinaryIndexedTree(long[] vals) {
		Objects.requireNonNull(vals);
		sumTree = vals.clone();
		for (int i = 0; i < sumTree.length; i++) {
			long val = sumTree[i];
			// For each consecutive 1 in the lowest order bits of i
			for (int j = 1; (i & j) != 0; j <<= 1)
				val += sumTree[i ^ j];
			sumTree[i] = val;
		}
	}
	
	
	
	/*---- Methods ----*/
	
	public int getLength() {
		return sumTree.length;
	}
	
	
	public long get(int index) {
		if (!(0 <= index && index < sumTree.length))
			throw new IndexOutOfBoundsException();
		long result = sumTree[index];
		// For each consecutive 1 in the lowest order bits of index
		for (int i = 1; (index & i) != 0; i <<= 1)
			result -= sumTree[index ^ i];
		return result;
	}
	
	
	public void set(int index, long val) {
		if (!(0 <= index && index < sumTree.length))
			throw new IndexOutOfBoundsException();
		add(index, val - get(index));
	}
	
	
	public void add(int index, long delta) {
		if (!(0 <= index && index < sumTree.length))
			throw new IndexOutOfBoundsException();
		do {
			sumTree[index] += delta;
			index |= index + 1;  // Set lowest 0 bit; strictly increasing
			// Equivalently: index |= Integer.lowestOneBit(~index);
		} while (index < sumTree.length);
	}
	
	
	public long getTotal() {
		return getPrefixSum(sumTree.length);
	}
	
	
	public long getPrefixSum(int end) {
		if (!(0 <= end && end <= sumTree.length))
			throw new IndexOutOfBoundsException();
		long result = 0;
		while (end > 0) {
			result += sumTree[end - 1];
			end &= end - 1;  // Clear lowest 1 bit; strictly decreasing
			// Equivalently: end ^= Integer.lowestOneBit(end);
		}
		return result;
	}
	
	
	public long getRangeSum(int start, int end) {
		if (!(0 <= start && start <= end && end <= sumTree.length))
			throw new IndexOutOfBoundsException();
		return getPrefixSum(end) - getPrefixSum(start);
	}
	
}
