/*
 * AVL tree list (compiled from TypeScript)
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
/*---- Data structure main class (public) ----*/
class AvlTreeList {
    // Constructs a new AVL tree list. If called with no arguments, this creates a blank list.
    // Otherwise with one argument, this creates a list representing the same elements as the given array.
    // For example:
    //   let a = new AvlTreeList<boolean>();  // Blank, zero-length list
    //   let b = new AvlTreeList<number>([2,7,1,8]);  // Has the four elements 2,7,1,8
    constructor(arr) {
        this.root = new AvlTreeListEmptyNode();
        if (arguments.length == 1 && arr !== undefined) {
            for (const val of arr)
                this.push(val);
        }
        else if (arguments.length != 0)
            throw new RangeError("Illegal argument");
    }
    // The property 'length' returns the length of this list. It is a property with a
    // getter function, so that parentheses are not used to get the value. For example:
    //   let list = new AvlTreeList<number>([3,1,4]);
    //   let n = list.length;  // 3
    get length() {
        return this.root.size;
    }
    // Returns the element at the given index in this list, where 0 <= index < length.
    // For example: [a,b,c] -> get(2) returns c.
    get(index) {
        if (index < 0 || index >= this.length)
            throw new RangeError("Index out of bounds");
        return this.root.getNodeAt(index).value;
    }
    // Sets the element at the given index in this list to the given value, where 0 <= index < length.
    // For example: [a,b,c] -> set(1, f) -> [a,f,c].
    set(index, val) {
        if (index < 0 || index >= this.length)
            throw new RangeError("Index out of bounds");
        this.root.getNodeAt(index).value = val;
    }
    // Appends the given element to the end of this list.
    // For example: [a,b] -> push(c) -> [a,b,c].
    push(val) {
        this.root = this.root.insertAt(this.length, val);
    }
    // Inserts the given element to the given index in this list, where 0 <= index <= length.
    // For example: [a,b,c] -> insert(0, e) -> [e,a,b,c] -> insert(4, d) -> [e,a,b,c,d].
    insert(index, val) {
        if (index < 0 || index > this.length) // Different constraint than the other methods
            throw new RangeError("Index out of bounds");
        this.root = this.root.insertAt(index, val);
    }
    // Removes the element at the given index in this list, shifting all later elements forward by one index.
    // For example: [a,b,c,d] -> remove(1) -> [a,c,d].
    remove(index) {
        if (index < 0 || index >= this.length)
            throw new RangeError("Index out of bounds");
        this.root = this.root.removeAt(index);
    }
    // Removes and returns the first element of this list.
    // For example: [a,b,c] -> shift() returns a -> [b,c].
    shift() {
        if (this.length == 0)
            throw new Error("List is empty");
        const result = this.get(0);
        this.remove(0);
        return result;
    }
    // Removes and returns the last element of this list.
    // For example: [a,b,c] -> pop() returns c -> [a,b].
    pop() {
        const len = this.length;
        if (len == 0)
            throw new Error("List is empty");
        const result = this.get(len - 1);
        this.remove(len - 1);
        return result;
    }
    // Removes all elements from this list, resetting the length to zero.
    // For example: [a,b,c] -> clear() -> [].
    clear() {
        this.root = new AvlTreeListEmptyNode();
    }
    // Returns a shallow copy of the given subrange of this list. Both arguments are optional - a missing end
    // means the end of the list, and a missing start means the beginning of the list. The returned list has its
    // own unique data structure and node objects, but the underlying values being stored are still the same objects.
    // Note for convenience that lst.slice() returns a clone of the entire list.
    slice(start, end) {
        if (arguments.length < 2)
            end = this.length;
        end = end;
        if (arguments.length < 1)
            start = 0;
        start = start;
        if (start < 0)
            start += this.length;
        if (end < 0)
            end += this.length;
        let result = new AvlTreeList();
        for (let i = start; i < end; i++)
            result.push(this.get(i));
        return result;
    }
    // Removes 'count' elements starting at index 'start', then inserts the rest of the arguments
    // at index 'start', and finally returns an AvlTreeList of the removed elements.
    splice(start, count, ...vals) {
        // Clamp start index and count
        if (start > this.length)
            start = this.length;
        else if (start < 0) {
            start += this.length;
            if (start < 0)
                start = 0;
        }
        count = Math.min(this.length - start, count);
        let result = new AvlTreeList();
        for (let i = 0; i < count; i++) {
            const val = this.get(start);
            result.push(val);
            this.remove(start);
        }
        vals.forEach((val, i) => this.insert(start + i, val));
        return result;
    }
    // Calls func(val, index) on each element of this list in sequential order.
    // The optional 'thisArg' sets the value of 'this' when calling the given function.
    forEach(func, thisArg) {
        for (let iter = this.iterator(), i = 0; iter.hasNext(); i++)
            func.call(thisArg, iter.next(), i);
    }
    // Returns an iterator object to traverse the entire list from beginning to end. The iterator has two methods
    // (modelled after java.util.Iterator): hasNext() returning a boolean, and next() returning an element value.
    // When processing the whole list, using an iterator is more efficient since it uses O(n) total time
    // (so O(1) amortized but O(log n) worst-case time per element), whereas looping over all indexes
    // and calling get() on each one takes O(n log n) total time. For example:
    //   let list = (...);  // AvlTreeList object
    //   let iter = list.iterator();
    //   while (iter.hasNext()) {
    //     let val = iter.next();
    //     (... do something with val ...)
    //   }
    iterator() {
        return new AvlTreeListIterator(this.root);
    }
    // Returns the contents of this list as a JavaScript array.
    // For example:
    //   let list = new AvlTreeList<string>();
    //   list.push("x");
    //   list.insert(0, "a");
    //   list.push("c");
    //   list.set(1, "b");
    //   let a = list.toArray();  // ["a","b","c"]
    toArray() {
        let result = [];
        for (let iter = this.iterator(); iter.hasNext();)
            result.push(iter.next());
        return result;
    }
    // For unit tests. Returns nothing or throws an exception.
    checkStructure() {
        this.root.checkStructure();
    }
}
class AvlTreeListEmptyNode {
    constructor() {
        this.height = 0;
        this.size = 0;
    }
    insertAt(index, obj) {
        if (index == 0)
            return new AvlTreeListInternalNode(obj, this);
        else
            throw new RangeError("Index out of bounds");
    }
    checkStructure() { }
}
class AvlTreeListInternalNode {
    constructor(
    // The object stored at this node. Can be any JavaScript type.
    // Public for the sake of AvlTreeList.
    value, empty) {
        this.value = value;
        // This node has height equal to max(left.height, right.height) + 1.
        this.height = 1;
        // This node has size equal to left.size + right.size + 1.
        // Public for the sake of AvlTreeList.
        this.size = 1;
        this.left = empty;
        this.right = empty;
    }
    get leftNode() {
        if (this.left.size == 0)
            throw new Error("Assertion error");
        return this.left;
    }
    get rightNode() {
        if (this.right.size == 0)
            throw new Error("Assertion error");
        return this.right;
    }
    getNodeAt(index) {
        if (index < 0 || index >= this.size)
            throw new Error("Assertion error");
        const leftSize = this.left.size;
        if (index < leftSize)
            return this.leftNode.getNodeAt(index);
        else if (index > leftSize)
            return this.rightNode.getNodeAt(index - leftSize - 1);
        else
            return this;
    }
    insertAt(index, obj) {
        if (index < 0 || index > this.size)
            throw new Error("Assertion error");
        const leftSize = this.left.size;
        if (index <= leftSize)
            this.left = this.left.insertAt(index, obj);
        else
            this.right = this.right.insertAt(index - leftSize - 1, obj);
        this.recalculate();
        return this.balance();
    }
    removeAt(index) {
        if (index < 0 || index >= this.size)
            throw new Error("Assertion error");
        const leftSize = this.left.size;
        if (index < leftSize)
            this.left = this.leftNode.removeAt(index);
        else if (index > leftSize)
            this.right = this.rightNode.removeAt(index - leftSize - 1);
        else if (this.left.size == 0 && this.right.size == 0)
            return this.left; // Empty
        else if (this.left.size != 0 && this.right.size == 0)
            return this.left;
        else if (this.left.size == 0 && this.right.size != 0)
            return this.right;
        else {
            // Find successor node. (Using the predecessor is valid too.)
            let temp = this.rightNode;
            while (temp.left.size != 0)
                temp = temp.leftNode;
            this.value = temp.value; // Replace value by successor
            this.right = this.rightNode.removeAt(0); // Remove successor node
        }
        this.recalculate();
        return this.balance();
    }
    // Balances the subtree rooted at this node and returns the new root.
    balance() {
        const bal = this.getBalance();
        if (Math.abs(bal) > 2)
            throw new Error("Assertion error");
        let result = this;
        if (bal == -2) {
            let left = this.leftNode;
            if (Math.abs(left.getBalance()) > 1)
                throw new Error("Assertion error");
            if (left.getBalance() == +1)
                this.left = left.rotateLeft();
            result = this.rotateRight();
        }
        else if (bal == +2) {
            let right = this.rightNode;
            if (Math.abs(right.getBalance()) > 1)
                throw new Error("Assertion error");
            if (right.getBalance() == -1)
                this.right = right.rotateRight();
            result = this.rotateLeft();
        }
        if (Math.abs(result.getBalance()) > 1)
            throw new Error("Assertion error");
        return result;
    }
    /*
     *   A            B
     *  / \          / \
     * 0   B   ->   A   2
     *    / \      / \
     *   1   2    0   1
     */
    rotateLeft() {
        if (this.right.size == 0)
            throw new Error("Assertion error");
        let root = this.rightNode;
        this.right = root.left;
        root.left = this;
        this.recalculate();
        root.recalculate();
        return root;
    }
    /*
     *     B          A
     *    / \        / \
     *   A   2  ->  0   B
     *  / \            / \
     * 0   1          1   2
     */
    rotateRight() {
        if (this.left.size == 0)
            throw new Error("Assertion error");
        let root = this.leftNode;
        this.left = root.right;
        root.right = this;
        this.recalculate();
        root.recalculate();
        return root;
    }
    // Needs to be called every time the left or right subtree is changed.
    // Assumes the left and right subtrees have the correct values computed already.
    recalculate() {
        if (this.size == 0)
            throw new Error("Assertion error");
        if (this.left.height < 0 || this.right.height < 0)
            throw new Error("Assertion error");
        if (this.left.size < 0 || this.right.size < 0)
            throw new Error("Assertion error");
        this.height = Math.max(this.left.height, this.right.height) + 1;
        this.size = this.left.size + this.right.size + 1;
        if (this.height < 0 || this.size < 0)
            throw new Error("Assertion error");
    }
    getBalance() {
        return this.right.height - this.left.height;
    }
    // For unit tests, invokable by the main class.
    checkStructure() {
        this.left.checkStructure();
        this.right.checkStructure();
        if (this.height != Math.max(this.left.height, this.right.height) + 1)
            throw new Error("AVL tree structure violated: Incorrect cached height");
        if (this.size != this.left.size + this.right.size + 1)
            throw new Error("AVL tree structure violated: Incorrect cached size");
        if (Math.abs(this.getBalance()) > 1)
            throw new Error("AVL tree structure violated: Height imbalance");
    }
}
/*---- Iterator helper class (private) ----*/
// Note: An iterator is not fail-fast on concurrent modification.
class AvlTreeListIterator {
    constructor(root) {
        this.stack = [];
        let maybeNode = root;
        while (maybeNode.size != 0) {
            const node = maybeNode;
            this.stack.push(node);
            maybeNode = node.left;
        }
    }
    hasNext() {
        return this.stack.length > 0;
    }
    next() {
        if (!this.hasNext())
            throw new Error("No next element");
        let node = this.stack.pop(); // Never undefined
        const result = node.value;
        let maybeNode = node.right;
        while (maybeNode.size != 0) {
            const node = maybeNode;
            this.stack.push(node);
            maybeNode = node.left;
        }
        return result;
    }
}
