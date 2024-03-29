/*
 * Binary indexed tree (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki. (MIT License)
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
class BinaryIndexedTree {
    /*---- Constructor ----*/
    constructor(arg) {
        if (typeof arg == "number") {
            if (arg < 0 || Math.floor(arg) != arg)
                throw new RangeError("Illegal argument");
            this.sumTree = [];
            for (let i = 0; i < arg; i++)
                this.sumTree.push(0);
        }
        else if (arg instanceof Array) {
            this.sumTree = arg.slice();
            this.sumTree.forEach((val, i) => {
                // For each consecutive 1 in the lowest order bits of i
                for (let j = 1; (i & j) != 0; j <<= 1)
                    val += this.sumTree[i ^ j];
                this.sumTree[i] = val;
            });
        }
        else
            throw new RangeError("Illegal argument");
    }
    /*---- Methods ----*/
    get length() {
        return this.sumTree.length;
    }
    get(index) {
        if (!(0 <= index && index < this.length))
            throw new RangeError("Index out of bounds");
        let result = this.sumTree[index];
        // For each consecutive 1 in the lowest order bits of index
        for (let i = 1; (index & i) != 0; i <<= 1)
            result -= this.sumTree[index ^ i];
        return result;
    }
    set(index, val) {
        if (!(0 <= index && index < this.length))
            throw new RangeError("Index out of bounds");
        this.add(index, val - this.get(index));
    }
    add(index, delta) {
        if (!(0 <= index && index < this.length))
            throw new RangeError("Index out of bounds");
        do {
            this.sumTree[index] += delta;
            index |= index + 1; // Set lowest 0 bit; strictly increasing
        } while (index < this.length);
    }
    getTotal() {
        return this.getPrefixSum(this.length);
    }
    getPrefixSum(end) {
        if (!(0 <= end && end <= this.length))
            throw new RangeError("Index out of bounds");
        let result = 0;
        while (end > 0) {
            result += this.sumTree[end - 1];
            end &= end - 1; // Clear lowest 1 bit; strictly decreasing
        }
        return result;
    }
    getRangeSum(start, end) {
        if (!(0 <= start && start <= end && end <= this.length))
            throw new RangeError("Index out of bounds");
        return this.getPrefixSum(end) - this.getPrefixSum(start);
    }
}
