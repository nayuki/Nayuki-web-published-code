/*
 * Disjoint-set data structure - Test suite (compiled from TypeScript)
 *
 * Copyright (c) 2021 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/disjoint-set-data-structure
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
/*---- Test suite ----*/
var TEST_SUITE_FUNCS = [
    function testNew() {
        var ds = new DisjointSet(10);
        assertEquals(10, ds.getNumSets());
        assertEquals(1, ds.getSizeOfSet(0));
        assertEquals(1, ds.getSizeOfSet(2));
        assertEquals(1, ds.getSizeOfSet(9));
        assertTrue(ds.areInSameSet(0, 0));
        assertFalse(ds.areInSameSet(0, 1));
        assertFalse(ds.areInSameSet(9, 3));
        ds.checkStructure();
    },
    function testMerge() {
        var ds = new DisjointSet(10);
        assertTrue(ds.mergeSets(0, 1));
        ds.checkStructure();
        assertEquals(9, ds.getNumSets());
        assertTrue(ds.areInSameSet(0, 1));
        assertTrue(ds.mergeSets(2, 3));
        ds.checkStructure();
        assertEquals(8, ds.getNumSets());
        assertTrue(ds.areInSameSet(2, 3));
        assertFalse(ds.mergeSets(2, 3));
        ds.checkStructure();
        assertEquals(8, ds.getNumSets());
        assertFalse(ds.areInSameSet(0, 2));
        assertTrue(ds.mergeSets(0, 3));
        ds.checkStructure();
        assertEquals(7, ds.getNumSets());
        assertTrue(ds.areInSameSet(0, 2));
        assertTrue(ds.areInSameSet(3, 0));
        assertTrue(ds.areInSameSet(1, 3));
    },
    function testBigMerge() {
        var maxRank = 20;
        var trials = 10000;
        var numElems = 1 << maxRank; // Grows exponentially
        var ds = new DisjointSet(numElems);
        for (var level = 0; level < maxRank; level++) {
            var mergeStep = 1 << level;
            var incrStep = mergeStep * 2;
            for (var i = 0; i < numElems; i += incrStep) {
                assertFalse(ds.areInSameSet(i, i + mergeStep));
                assertTrue(ds.mergeSets(i, i + mergeStep));
            }
            // Now we have a bunch of sets of size 2^(level+1)
            // Do random tests
            var mask = -incrStep; // 0b11...100...00
            for (var i = 0; i < trials; i++) {
                var j = Math.floor(Math.random() * numElems);
                var k = Math.floor(Math.random() * numElems);
                var expect = (j & mask) == (k & mask);
                assertTrue(expect == ds.areInSameSet(j, k));
            }
        }
    },
    function testAgainstNaiveRandomly() {
        var trials = 100;
        var iterations = 1000;
        var numElems = 100;
        for (var i = 0; i < trials; i++) {
            var nds = new NaiveDisjointSet(numElems);
            var ds = new DisjointSet(numElems);
            for (var j = 0; j < iterations; j++) {
                var k = Math.floor(Math.random() * numElems);
                var l = Math.floor(Math.random() * numElems);
                assertEquals(nds.getSizeOfSet(k), ds.getSizeOfSet(k));
                assertTrue(nds.areInSameSet(k, l) == ds.areInSameSet(k, l));
                if (Math.random() < 0.1)
                    assertTrue(nds.mergeSets(k, l) == ds.mergeSets(k, l));
                assertEquals(nds.getNumSets(), ds.getNumSets());
                if (Math.random() < 0.001)
                    ds.checkStructure();
            }
            ds.checkStructure();
        }
    },
];
/*---- Helper definitions ----*/
var NaiveDisjointSet = /** @class */ (function () {
    function NaiveDisjointSet(numElems) {
        this.representatives = [];
        for (var i = 0; i < numElems; i++)
            this.representatives.push(i);
    }
    NaiveDisjointSet.prototype.getNumSets = function () {
        var result = 0;
        this.representatives.forEach(function (repr, i) {
            if (repr == i)
                result++;
        });
        return result;
    };
    NaiveDisjointSet.prototype.getSizeOfSet = function (elemIndex) {
        var repr = this.representatives[elemIndex];
        var result = 0;
        for (var _i = 0, _a = this.representatives; _i < _a.length; _i++) {
            var r = _a[_i];
            if (r == repr)
                result++;
        }
        return result;
    };
    NaiveDisjointSet.prototype.areInSameSet = function (elemIndex0, elemIndex1) {
        return this.representatives[elemIndex0] == this.representatives[elemIndex1];
    };
    NaiveDisjointSet.prototype.mergeSets = function (elemIndex0, elemIndex1) {
        var _this = this;
        var repr0 = this.representatives[elemIndex0];
        var repr1 = this.representatives[elemIndex1];
        this.representatives.forEach(function (r, i) {
            if (r == repr1)
                _this.representatives[i] = repr0;
        });
        return repr0 != repr1;
    };
    return NaiveDisjointSet;
}());
function assertTrue(cond) {
    if (cond !== true)
        throw "Assertion error";
}
function assertFalse(cond) {
    assertTrue(cond === false);
}
function assertEquals(expect, actual) {
    assertTrue(actual === expect);
}
/*---- Main runner ----*/
(function () {
    var i = 0;
    function iterate() {
        var msg;
        if (i >= TEST_SUITE_FUNCS.length)
            msg = "Finished";
        else {
            msg = TEST_SUITE_FUNCS[i].name + "(): ";
            try {
                TEST_SUITE_FUNCS[i]();
                msg += "Pass";
            }
            catch (e) {
                msg += "Fail - " + e;
            }
            i++;
            setTimeout(iterate);
        }
        var li = document.createElement("li");
        li.textContent = msg;
        document.getElementById("results").appendChild(li);
    }
    iterate();
})();
