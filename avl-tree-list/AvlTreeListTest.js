/*
 * AVL tree list test (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/avl-tree-list
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
const TEST_SUITE_FUNCS = [
    function testPush() {
        let list = new AvlTreeList();
        list.push("January");
        list.push("February");
        list.push("March");
        list.push("April");
        list.push("May");
        list.push("June");
        list.checkStructure();
        assertEquals(6, list.length);
        assertEquals("January", list.get(0));
        assertEquals("February", list.get(1));
        assertEquals("March", list.get(2));
        assertEquals("April", list.get(3));
        assertEquals("May", list.get(4));
        assertEquals("June", list.get(5));
    },
    function testSet() {
        let list = new AvlTreeList();
        for (let i = 0; i < 10; i++)
            list.push(null);
        list.set(0, "zero");
        list.set(1, "ten");
        list.set(2, "twenty");
        list.set(3, "thirty");
        list.set(4, "forty");
        list.set(5, "fifty");
        list.set(6, "sixty");
        list.set(7, "seventy");
        list.set(8, "eighty");
        list.set(9, "ninety");
        assertEquals(10, list.length);
        assertEquals("zero", list.get(0));
        assertEquals("ten", list.get(1));
        assertEquals("twenty", list.get(2));
        assertEquals("thirty", list.get(3));
        assertEquals("forty", list.get(4));
        assertEquals("fifty", list.get(5));
        assertEquals("sixty", list.get(6));
        assertEquals("seventy", list.get(7));
        assertEquals("eighty", list.get(8));
        assertEquals("ninety", list.get(9));
    },
    function testInsertAtBeginning() {
        let list = new AvlTreeList();
        list.insert(0, "Sunday");
        list.insert(0, "Monday");
        list.insert(0, "Tuesday");
        assertEquals(3, list.length);
        assertEquals("Tuesday", list.get(0));
        assertEquals("Monday", list.get(1));
        assertEquals("Sunday", list.get(2));
    },
    function testInsertAtEnd() {
        let list = new AvlTreeList();
        list.insert(0, "Saturday");
        list.insert(1, "Friday");
        list.insert(2, "Thursday");
        list.insert(3, "Wednesday");
        assertEquals(4, list.length);
        assertEquals("Saturday", list.get(0));
        assertEquals("Friday", list.get(1));
        assertEquals("Thursday", list.get(2));
        assertEquals("Wednesday", list.get(3));
    },
    function testInsertAtMiddle() {
        let list = new AvlTreeList();
        list.insert(0, "Up");
        list.insert(1, "Down");
        list.insert(1, "Left");
        list.insert(2, "Right");
        list.insert(1, "Front");
        list.insert(2, "Back");
        assertEquals(6, list.length);
        assertEquals("Up", list.get(0));
        assertEquals("Front", list.get(1));
        assertEquals("Back", list.get(2));
        assertEquals("Left", list.get(3));
        assertEquals("Right", list.get(4));
        assertEquals("Down", list.get(5));
    },
    // Stresses the self-balancing mechanism
    function testInsertManyBeginning() {
        let list = new AvlTreeList();
        for (let i = 99999; i >= 0; i--)
            list.insert(0, i);
        let i = 0;
        for (let iter = list.iterator(); iter.hasNext();) {
            assertEquals(i, iter.next());
            assertEquals(i, list.get(i));
            i++;
        }
    },
    // Stresses the self-balancing mechanism
    function testInsertManyEnd() {
        let list = new AvlTreeList();
        for (let i = 0; i < 100000; i++)
            list.push(i);
        let i = 0;
        for (let iter = list.iterator(); iter.hasNext();) {
            assertEquals(i, iter.next());
            assertEquals(i, list.get(i));
            i++;
        }
    },
    // Adds in a weird binary pattern to stress arrays and linked lists
    function testInsertManyEverywhere() {
        const N = 17;
        let list = new AvlTreeList();
        list.push(0);
        for (let i = N - 1; i >= 0; i--) {
            for (let j = 1 << i, k = 1; j < (1 << N); j += 2 << i, k += 2)
                list.insert(k, j);
        }
        let i = 0;
        for (let iter = list.iterator(); iter.hasNext();) {
            assertEquals(i, iter.next());
            assertEquals(i, list.get(i));
            i++;
        }
    },
    function testNewFromArrayShiftPop() {
        let list = new AvlTreeList([3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6, 2, 6, 4, 3, 3, 8, 3]);
        assertEquals(28, list.length);
        assertEquals(3, list.shift());
        assertEquals(3, list.pop());
        assertEquals(8, list.pop());
        assertEquals(1, list.shift());
        assertEquals(4, list.shift());
        assertEquals(3, list.pop());
        assertEquals(1, list.shift());
        assertEquals(3, list.pop());
        assertEquals(4, list.pop());
        assertEquals(6, list.pop());
        assertEquals(5, list.shift());
        assertEquals(9, list.shift());
        assertEquals(2, list.shift());
    },
    function testRemove() {
        let list = new AvlTreeList();
        let str = "the quick brown fox jumped over the lazy dog";
        for (let i = 0; i < str.length; i++)
            list.push(str.charAt(i));
        assertEquals(str.length, list.length);
        assertEquals("e", list.get(2));
        list.remove(2);
        assertEquals("u", list.get(4));
        list.remove(4);
        assertEquals("q", list.get(3));
        list.remove(3);
        assertEquals(" ", list.get(2));
        list.remove(2);
        assertEquals("f", list.get(12));
        list.remove(12);
        assertEquals(" ", list.get(11));
        list.remove(11);
        assertEquals("n", list.get(10));
        list.remove(10);
        assertEquals("w", list.get(9));
        list.remove(9);
        assertEquals(" ", list.get(11));
        list.remove(11);
        assertEquals("j", list.get(11));
        list.remove(11);
        assertEquals("u", list.get(11));
        list.remove(11);
        assertEquals("x", list.get(10));
        list.remove(10);
        assertEquals("p", list.get(11));
        list.remove(11);
        assertEquals("d", list.get(12));
        list.remove(12);
        assertEquals("e", list.get(11));
        list.remove(11);
        assertEquals("v", list.get(13));
        list.remove(13);
        assertEquals("e", list.get(13));
        list.remove(13);
        assertEquals("l", list.get(19));
        list.remove(19);
        assertEquals("z", list.get(20));
        list.remove(20);
        assertEquals("a", list.get(19));
        list.remove(19);
        assertEquals(" ", list.get(18));
        list.remove(18);
        assertEquals("g", list.get(22));
        list.remove(22);
        str = "thick broom or they do";
        assertEquals(str.length, list.length);
        for (let i = 0; i < str.length; i++)
            assertEquals(str.charAt(i), list.get(i));
        assertEquals("t", list.get(0));
        list.remove(0);
        assertEquals("c", list.get(2));
        list.remove(2);
        assertEquals("k", list.get(2));
        list.remove(2);
        assertEquals(" ", list.get(2));
        list.remove(2);
        assertEquals("b", list.get(2));
        list.remove(2);
        assertEquals("r", list.get(2));
        list.remove(2);
        assertEquals("o", list.get(2));
        list.remove(2);
        assertEquals("o", list.get(2));
        list.remove(2);
        assertEquals("o", list.get(4));
        list.remove(4);
        assertEquals("h", list.get(7));
        list.remove(7);
        assertEquals(" ", list.get(5));
        list.remove(5);
        assertEquals("t", list.get(5));
        list.remove(5);
        assertEquals("o", list.get(9));
        list.remove(9);
        assertEquals(" ", list.get(7));
        list.remove(7);
        assertEquals("y", list.get(6));
        list.remove(6);
        str = "him red";
        assertEquals(str.length, list.length);
        for (let i = 0; i < str.length; i++)
            assertEquals(str.charAt(i), list.get(i));
    },
    function testClear() {
        let list = new AvlTreeList();
        for (let i = 0; i < 20; i++)
            list.push(i * i);
        list.clear();
        assertEquals(0, list.length);
        list.push(-1);
        list.push(-8);
        list.push(-27);
        assertEquals(3, list.length);
        assertEquals(-1, list.get(0));
        assertEquals(-8, list.get(1));
        assertEquals(-27, list.get(2));
    },
    function testSlice() {
        let list = new AvlTreeList([2, 7, 1, 8, 2, 8, 1, 8, 2, 8, 4, 5, 9, 0, 4, 5, 2, 3, 5, 3, 6, 0]);
        let temp = list.slice();
        assertEquals(list.length, temp.length);
        for (let i = 0; i < list.length; i++)
            assertEquals(list.get(i), temp.get(i));
        temp.remove(5);
        temp.set(2, 0);
        assertEquals(list.length - 1, temp.length);
        assertEquals(0, temp.get(2));
        assertEquals(1, list.get(2));
        assertArrayEquals([2, 7, 1, 8], list.slice(0, 4).toArray());
        assertArrayEquals([], list.slice(1, 1).toArray());
        assertArrayEquals([3, 6], list.slice(-3, -1).toArray());
    },
    function testSplice() {
        let list = new AvlTreeList([1, 6, 1, 8, 0, 3, 3, 9, 8, 8, 7, 4, 9, 8, 9, 4, 8, 4, 8, 2, 0, 4, 5, 8, 6, 8, 3, 4, 3]);
        let temp = list.splice(0, 0);
        assertEquals(true, temp instanceof AvlTreeList);
        assertEquals(0, temp.length);
        assertEquals(29, list.length);
        temp = list.splice(-3, 5);
        assertEquals(3, temp.length);
        assertArrayEquals([3, 4, 3], temp.toArray());
        assertEquals(26, list.length);
        temp = list.splice(-27, 2, 5);
        assertArrayEquals([1, 6], temp.toArray());
        assertEquals(25, list.length);
        assertEquals(5, list.get(0));
        temp = list.splice(4, 1, 4, 2, 5);
        assertEquals(5, list.get(0));
        assertEquals(1, list.get(1));
        assertEquals(8, list.get(2));
        assertEquals(0, list.get(3));
        assertEquals(4, list.get(4));
        assertEquals(2, list.get(5));
        assertEquals(5, list.get(6));
        assertEquals(3, list.get(7));
        assertEquals(9, list.get(8));
        assertEquals(8, list.get(9));
    },
    function testForEach() {
        let list = new AvlTreeList([1, 4, 1, 4, 2]);
        let arr = [];
        list.forEach((val, i) => {
            arr.push(i);
            arr.push(val);
        });
        assertArrayEquals([0, 1, 1, 4, 2, 1, 3, 4, 4, 2], arr);
        let obj = {};
        list.forEach(function () { assertEquals(obj, this); }, obj);
    },
    function testIterator() {
        let list = new AvlTreeList();
        for (let i = 0; i < 50; i++)
            list.push(i * i);
        let iter = list.iterator();
        for (let i = 0; i < 50; i++) {
            assertEquals(true, iter.hasNext());
            assertEquals(i * i, iter.next());
        }
        assertEquals(false, iter.hasNext());
    },
    // Tests most of the defined methods.
    function testAgainstJavascriptListRandomly() {
        let list0 = [];
        let list1 = new AvlTreeList();
        let size = 0;
        for (let i = 0; i < 10000; i++) {
            const op = Math.random();
            if (op < 0.01) { // To array and clear
                list1.checkStructure();
                assertArrayEquals(list0, list1.toArray());
                list0 = [];
                list1.clear();
                size = 0;
            }
            else if (op < 0.02) { // Set
                if (size > 0) {
                    const index = Math.floor(Math.random() * size);
                    const val = Math.random();
                    list0[index] = val;
                    list1.set(index, val);
                }
            }
            else if (op < 0.30) { // Random insertion
                const n = Math.floor(Math.random() * 100) + 1;
                for (var j = 0; j < n; j++) {
                    const index = Math.floor(Math.random() * (size + 1));
                    const val = Math.random();
                    list0.splice(index, 0, val);
                    list1.insert(index, val);
                }
                size += n;
            }
            else if (op < 0.50) { // Ascending insertion
                const n = Math.floor(Math.random() * 100) + 1;
                let offset = Math.floor(Math.random() * (size + 1));
                for (let j = 0; j < n; j++, offset++) {
                    const val = Math.random();
                    list0.splice(offset, 0, val);
                    list1.insert(offset, val);
                }
                size += n;
            }
            else if (op < 0.70) { // Descending insertion
                const n = Math.floor(Math.random() * 100) + 1;
                const offset = Math.floor(Math.random() * (size + 1));
                for (let j = 0; j < n; j++) {
                    const val = Math.random();
                    list0.splice(offset, 0, val);
                    list1.insert(offset, val);
                }
                size += n;
            }
            else if (op < 0.80) { // Random deletion
                const n = Math.floor(Math.random() * 100) + 1;
                for (let j = 0; j < n && size > 0; j++, size--) {
                    const index = Math.floor(Math.random() * size);
                    assertEquals(list0[index], list1.get(index));
                    list0.splice(index, 1);
                    list1.remove(index);
                }
            }
            else if (op < 0.90) { // Ascending deletion
                const n = Math.floor(Math.random() * 100) + 1;
                if (size > 0) {
                    const offset = Math.floor(Math.random() * size);
                    for (let j = 0; j < n && offset < size; j++, size--) {
                        assertEquals(list0[offset], list1.get(offset));
                        list0.splice(offset, 1);
                        list1.remove(offset);
                    }
                }
            }
            else if (op < 1.00) { // Descending deletion
                const n = Math.floor(Math.random() * 100) + 1;
                if (size > 0) {
                    let offset = Math.floor(Math.random() * size);
                    for (let j = 0; j < n && offset >= 0; j++, offset--, size--) {
                        assertEquals(list0[offset], list1.get(offset));
                        list0.splice(offset, 1);
                        list1.remove(offset);
                    }
                }
            }
            else
                throw new Error("Assertion error");
            assertEquals(size, list0.length);
            assertEquals(size, list1.length);
            if (size > 0) {
                for (let j = 0; j < 10; j++) {
                    const index = Math.floor(Math.random() * size);
                    assertEquals(list0[index], list1.get(index));
                }
            }
        }
    },
];
/*---- Helper definitions ----*/
function assertEquals(expected, actual) {
    if (expected !== actual)
        throw new Error("Values are unequal");
}
function assertArrayEquals(expected, actual) {
    if (!(expected instanceof Array) || !(actual instanceof Array))
        throw new TypeError("Illegal argument");
    if (expected.length != actual.length)
        throw new Error("Array length mismatch");
    for (let i = 0; i < expected.length; i++)
        assertEquals(expected[i], actual[i]);
}
/*---- Main runner ----*/
(function () {
    let i = 0;
    function iterate() {
        let msg;
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
        let li = document.createElement("li");
        li.textContent = msg;
        document.getElementById("results").append(li);
    }
    iterate();
})();
