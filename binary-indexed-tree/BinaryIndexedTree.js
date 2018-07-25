/* 
 * Binary indexed tree (JavaScript)
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

"use strict";


function BinaryIndexedTree(arg) {
	
	/*---- Field ----*/
	
	var sumTree;
	
	
	
	/*---- Constructor ----*/
	
	if (typeof arg == "number") {
		if (arg < 0 || Math.floor(arg) != arg)
			throw "Illegal argument";
		sumTree = [];
		for (var i = 0; i < arg; i++)
			sumTree.push(0);
		
	} else if (arg instanceof Array) {
		sumTree = arg.slice();
		sumTree.forEach(function(val, i) {
			// For each consecutive 1 in the lowest order bits of i
			for (var j = 1; (i & j) != 0; j <<= 1)
				val += sumTree[i ^ j];
			sumTree[i] = val;
		});
		
	} else
		throw "Illegal argument";
	
	
	
	/*---- Methods ----*/
	
	Object.defineProperty(this, "length",
		{get: function() { return sumTree.length; }, enumerable: true});
	
	
	this.get = function(index) {
		if (!(0 <= index && index < sumTree.length))
			throw "Index out of bounds";
		var result = sumTree[index];
		// For each consecutive 1 in the lowest order bits of index
		for (var i = 1; (index & i) != 0; i <<= 1)
			result -= sumTree[index ^ i];
		return result;
	};
	
	
	this.set = function(index, val) {
		if (!(0 <= index && index < sumTree.length))
			throw "Index out of bounds";
		this.add(index, val - this.get(index));
	};
	
	
	this.add = function(index, delta) {
		if (!(0 <= index && index < sumTree.length))
			throw "Index out of bounds";
		do {
			sumTree[index] += delta;
			index |= index + 1;  // Set lowest 0 bit; strictly increasing
		} while (index < sumTree.length);
	};
	
	
	this.getTotal = function() {
		return this.getPrefixSum(sumTree.length);
	};
	
	
	this.getPrefixSum = function(end) {
		if (!(0 <= end && end <= sumTree.length))
			throw "Index out of bounds";
		var result = 0;
		while (end > 0) {
			result += sumTree[end - 1];
			end &= end - 1;  // Clear lowest 1 bit; strictly decreasing
		}
		return result;
	};
	
	
	this.getRangeSum = function(start, end) {
		if (!(0 <= start && start <= end && end <= sumTree.length))
			throw "Index out of bounds";
		return this.getPrefixSum(end) - this.getPrefixSum(start);
	};
	
}
