/*
 * Binary indexed tree test (compiled from TypeScript)
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
/*---- Test suite ----*/
var TEST_SUITE_FUNCS = [
    function testSizeConstructor() {
        var SIZELIMIT = 3000;
        var CHECKS = 10;
        for (var len = 0; len < SIZELIMIT; len++) {
            var bt = new BinaryIndexedTree(len);
            assertEquals(len, bt.length);
            assertEquals(0, bt.getTotal());
            for (var i = 0; i < CHECKS; i++) {
                if (len > 0)
                    assertEquals(0, bt.get(randInt(len)));
                assertEquals(0, bt.getPrefixSum(randInt(len + 1)));
                var start = randInt(len + 1);
                var end = randInt(len + 1);
                if (start > end) {
                    var temp = start;
                    start = end;
                    end = temp;
                }
                assertEquals(0, bt.getRangeSum(start, end));
            }
        }
    },
    function testAllOnes() {
        var SIZELIMIT = 3000;
        var CHECKS = 10;
        for (var len = 1; len < SIZELIMIT; len++) {
            var bt = void 0;
            var mode = randInt(4);
            if (mode == 0) {
                var vals = [];
                for (var i = 0; i < len; i++)
                    vals.push(1);
                bt = new BinaryIndexedTree(vals);
            }
            else {
                bt = new BinaryIndexedTree(len);
                var p = void 0;
                if (mode == 1)
                    p = 0;
                else if (mode == 2)
                    p = 1;
                else if (mode == 3)
                    p = Math.random();
                else
                    throw new Error("Assertion error");
                for (var i = 0; i < len; i++) {
                    if (Math.random() < p)
                        bt.add(i, 1);
                    else
                        bt.set(i, 1);
                }
            }
            assertEquals(len, bt.length);
            assertEquals(len, bt.getTotal());
            for (var i = 0; i < CHECKS; i++) {
                assertEquals(1, bt.get(randInt(len)));
                var k = randInt(len + 1);
                assertEquals(k, bt.getPrefixSum(k));
                var start = randInt(len + 1);
                var end = randInt(len + 1);
                if (start > end) {
                    var temp = start;
                    start = end;
                    end = temp;
                }
                assertEquals(end - start, bt.getRangeSum(start, end));
            }
        }
    },
    function testArrayConstructorRandomly() {
        var TRIALS = 3000;
        var SIZELIMIT = 10000;
        var CHECKS = 100;
        for (var i = 0; i < TRIALS; i++) {
            var len = randInt(SIZELIMIT);
            var vals = [];
            var cums = [0];
            for (var j = 0; j < len; j++) {
                vals.push(randInt(2001) - 1000);
                cums.push(cums[j] + vals[j]);
            }
            var bt = new BinaryIndexedTree(vals);
            assertEquals(len, bt.length);
            assertEquals(cums[len], bt.getTotal());
            for (var j = 0; j < CHECKS; j++) {
                if (len > 0) {
                    var k_1 = randInt(len);
                    assertEquals(vals[k_1], bt.get(k_1));
                }
                var k = randInt(len + 1);
                assertEquals(cums[k], bt.getPrefixSum(k));
                var start = randInt(len + 1);
                var end = randInt(len + 1);
                if (start > end) {
                    var temp = start;
                    start = end;
                    end = temp;
                }
                assertEquals(cums[end] - cums[start], bt.getRangeSum(start, end));
            }
        }
    },
    function testAddAndSetRandomly() {
        var TRIALS = 3000;
        var SIZELIMIT = 3000;
        var OPERATIONS = 3000;
        var CHECKS = 100;
        var _loop_1 = function (i) {
            var len = randInt(SIZELIMIT) + 1;
            var vals = [];
            var bt = void 0;
            if (Math.random() < 0.5) {
                for (var j = 0; j < len; j++)
                    vals.push(0);
                bt = new BinaryIndexedTree(len);
            }
            else {
                for (var j = 0; j < len; j++)
                    vals[j] = randInt(2001) - 1000;
                bt = new BinaryIndexedTree(vals);
            }
            for (var j = 0; j < OPERATIONS; j++) {
                var k = randInt(len);
                var x = randInt(2001) - 1000;
                if (Math.random() < 0.5) {
                    vals[k] += x;
                    bt.add(k, x);
                }
                else {
                    vals[k] = x;
                    bt.set(k, x);
                }
            }
            var cums = [0];
            vals.forEach(function (x, j) {
                return cums.push(cums[j] + x);
            });
            for (var j = 0; j < CHECKS; j++) {
                var k = randInt(len);
                assertEquals(vals[k], bt.get(k));
                k = randInt(len + 1);
                assertEquals(cums[k], bt.getPrefixSum(k));
                var start = randInt(len + 1);
                var end = randInt(len + 1);
                if (start > end) {
                    var temp = start;
                    start = end;
                    end = temp;
                }
                assertEquals(cums[end] - cums[start], bt.getRangeSum(start, end));
            }
        };
        for (var i = 0; i < TRIALS; i++) {
            _loop_1(i);
        }
    },
];
/*---- Helper definitions ----*/
function randInt(n) {
    return Math.floor(Math.random() * n);
}
function assertEquals(expect, actual) {
    if (actual !== expect)
        throw new Error("Value mismatch");
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
                msg += "Fail - " + e.message;
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
