/* 
 * AVL tree list (JavaScript)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
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

// Constructs a new AVL tree list. If called with no arguments, this creates a blank list.
// Otherwise with one argument, this creates a list representing the same elements as the given array.
// For example:
//   var a = new AvlTreeList();  // Blank, zero-length list
//   var b = new AvlTreeList([2,7,1,8]);  // Has the four elements 2,7,1,8
function AvlTreeList() {
	// 'root' is a private variable, and should not be read or written by code outside of this class.
	// Invariant: The value is always an AvlTreeListNode object, never null.
	this.root = AvlTreeListNode.EMPTY_LEAF;
	
	if (arguments.length == 1) {
		var arr = arguments[0];
		for (var i = 0; i < arr.length; i++)
			this.push(arr[i]);
	} else if (arguments.length != 0)
		throw "Illegal argument";
}


// The property 'length' returns the length of this list. It is a property with a
// getter function, so that parentheses are not used to get the value. For example:
//   var list = new AvlTreeList([3,1,4]);
//   var n = list.length;  // 3
// Types: result is integer.
Object.defineProperty(AvlTreeList.prototype, "length",
	{get: function() { return this.root.size; }, enumerable: true});


// Returns the element at the given index in this list, where 0 <= index < length.
// For example: [a,b,c] -> get(2) returns c.
// Types: index is integer, result is any JavaScript type.
AvlTreeList.prototype.get = function(index) {
	if (index < 0 || index >= this.length)
		throw "Index out of bounds";
	return this.root.getNodeAt(index).value;
};


// Sets the element at the given index in this list to the given value, where 0 <= index < length.
// For example: [a,b,c] -> set(1, f) -> [a,f,c].
// Types: index is integer, value is any JavaScript type, result is void.
AvlTreeList.prototype.set = function(index, val) {
	if (index < 0 || index >= this.length)
		throw "Index out of bounds";
	this.root.getNodeAt(index).value = val;
};


// Appends the given element to the end of this list.
// For example: [a,b] -> push(c) -> [a,b,c].
// Types: val is any JavaScript type, result is void.
AvlTreeList.prototype.push = function(val) {
	this.root = this.root.insertAt(this.length, val);
};


// Inserts the given element to the given index in this list, where 0 <= index <= length.
// For example: [a,b,c] -> insert(0, e) -> [e,a,b,c] -> insert(4, d) -> [e,a,b,c,d].
// Types: index is integer, val is any JavaScript type, result is void.
AvlTreeList.prototype.insert = function(index, val) {
	if (index < 0 || index > this.length)  // Different constraint than the other methods
		throw "Index out of bounds";
	this.root = this.root.insertAt(index, val);
};


// Removes the element at the given index in this list, shifting all later elements forward by one index.
// For example: [a,b,c,d] -> remove(1) -> [a,c,d].
// Types: index is integer, result is void.
AvlTreeList.prototype.remove = function(index) {
	if (index < 0 || index >= this.length)
		throw "Index out of bounds";
	this.root = this.root.removeAt(index);
};


// Removes and returns the first element of this list.
// For example: [a,b,c] -> shift() returns a -> [b,c].
// Types: result is any JavaScript type.
AvlTreeList.prototype.shift = function() {
	if (this.length == 0)
		throw "List is empty";
	var result = this.get(0);
	this.remove(0);
	return result;
};


// Removes and returns the last element of this list.
// For example: [a,b,c] -> pop() returns c -> [a,b].
// Types: result is any JavaScript type.
AvlTreeList.prototype.pop = function() {
	var len = this.length;
	if (len == 0)
		throw "List is empty";
	var result = this.get(len - 1);
	this.remove(len - 1);
	return result;
};


// Removes all elements from this list, resetting the length to zero.
// For example: [a,b,c] -> clear() -> [].
// Types: result is void.
AvlTreeList.prototype.clear = function() {
	this.root = AvlTreeListNode.EMPTY_LEAF;
};


// Returns a shallow copy of the given subrange of this list. Both arguments are optional - a missing end
// means the end of the list, and a missing start means the beginning of the list. The returned list has its
// own unique data structure and node objects, but the underlying values being stored are still the same objects.
// Note for convenience that lst.slice() returns a clone of the entire list.
// Types: start is integer / missing, end is integer / missing, result is AvlTreeList.
AvlTreeList.prototype.slice = function(start, end) {
	if (arguments.length < 2)
		end = this.length;
	if (arguments.length < 1)
		start = 0;
	if (start < 0)
		start += this.length;
	if (end < 0)
		end += this.length;
	var result = new AvlTreeList();
	for (var i = start; i < end; i++)
		result.push(this.get(i));
	return result;
};


// Removes 'count' elements starting at index 'start', then inserts the rest of the arguments
// at index 'start', and finally returns an AvlTreeList of the removed elements.
// Types: start is integer, count is integer, remaining arguments are any JavaScript type, result is AvlTreeList.
AvlTreeList.prototype.splice = function(start, count) {
	if (arguments.length < 2)
		throw "Illegal arguments";
	// Clamp start index and count
	if (start > this.length)
		start = this.length;
	else if (start < 0) {
		start += this.length;
		if (start < 0)
			start = 0;
	}
	count = Math.min(this.length - start, count);
	
	var result = new AvlTreeList();
	for (var i = 0; i < count; i++) {
		var val = this.get(start);
		result.push(val);
		this.remove(start);
	}
	for (var i = 2; i < arguments.length; i++)
		this.insert(start + i - 2, arguments[i]);
	return result;
};


// Calls func(val, index) on each element of this list in sequential order.
// The optional 'thisArg' sets the value of 'this' when calling the given function.
// Types: func is function(any,integer)->any, thisArg is any JavaScript type / missing, result is void.
AvlTreeList.prototype.forEach = function(func, thisArg) {
	for (var iter = this.iterator(), i = 0; iter.hasNext(); i++)
		func.call(thisArg, iter.next(), i);
};


// Returns an iterator object to traverse the entire list from beginning to end. The iterator has two methods
// (modelled after java.util.Iterator): hasNext() returning a boolean, and next() returning an element value.
// When processing the whole list, using an iterator is more efficient since it uses O(n) total time
// (so O(1) amortized but O(log n) worst-case time per element), whereas looping over all indexes
// and calling get() on each one takes O(n log n) total time. For example:
//   var list = (...);  // AvlTreeList object
//   var iter = list.iterator();
//   while (iter.hasNext()) {
//     var val = iter.next();
//     (... do something with val ...)
//   }
// Types: result is AvlTreeListIterator.
AvlTreeList.prototype.iterator = function() {
	return new AvlTreeListIterator(this.root);
};


// Returns the contents of this list as a JavaScript array.
// For example:
//   var list = new AvlTreeList();
//   list.push("x");
//   list.insert(0, "a");
//   list.push("c");
//   list.set(1, "b");
//   var a = list.toArray();  // ["a","b","c"]
// Types: result is array.
AvlTreeList.prototype.toArray = function() {
	var result = [];
	for (var iter = this.iterator(); iter.hasNext(); )
		result.push(iter.next());
	return result;
};


// For unit tests. Returns nothing or throws an exception.
AvlTreeList.prototype.checkStructure = function() {
	this.root.checkStructure();
};


/*---- Node helper class (private) ----*/

function AvlTreeListNode() {
	/* 
	 * Fields per instance:
	 * - value : The object stored at this node. Can be any JavaScript type.
	 * - height: The height of the tree rooted at this node. Empty nodes have height 0.
	 *           This node has height equal to max(left.height, right.height) + 1.
	 * - size  : The number of non-empty nodes in the tree rooted at this node, including this node.
	 *           Empty nodes have size 0. This node has size equal to left.size + right.size + 1.
	 * - left  : The root node of the left subtree.
	 * - right : The root node of the right subtree.
	 */
	if (arguments.length == 0) {
		// For the singleton empty leaf node
		this.value = null;
		this.height = 0;
		this.size   = 0;
		this.left  = null;
		this.right = null;
	} else if (arguments.length == 1) {
		// Normal non-leaf nodes
		this.value = arguments[0];
		this.height = 1;
		this.size   = 1;
		this.left  = AvlTreeListNode.EMPTY_LEAF;
		this.right = AvlTreeListNode.EMPTY_LEAF;
	} else
		throw "Assertion error";
}


// (Static constant) A bit of a hack, but more elegant than using null values as leaf nodes.
AvlTreeListNode.EMPTY_LEAF = new AvlTreeListNode();


AvlTreeListNode.prototype.getNodeAt = function(index) {
	if (index < 0 || index >= this.size)
		throw "Assertion error";
	if (this === AvlTreeListNode.EMPTY_LEAF)
		throw "Illegal argument";
	
	var leftSize = this.left.size;
	if (index < leftSize)
		return this.left.getNodeAt(index);
	else if (index > leftSize)
		return this.right.getNodeAt(index - leftSize - 1);
	else
		return this;
};


AvlTreeListNode.prototype.insertAt = function(index, obj) {
	if (index < 0 || index > this.size)
		throw "Assertion error";
	if (this === AvlTreeListNode.EMPTY_LEAF) {
		if (index == 0)
			return new AvlTreeListNode(obj);
		else
			throw "Index out of bounds";
	}
	
	var leftSize = this.left.size;
	if (index <= leftSize)
		this.left = this.left.insertAt(index, obj);
	else
		this.right = this.right.insertAt(index - leftSize - 1, obj);
	this.recalculate();
	return this.balance();
};


AvlTreeListNode.prototype.removeAt = function(index) {
	if (index < 0 || index >= this.size)
		throw "Assertion error";
	var empty = AvlTreeListNode.EMPTY_LEAF;
	if (this === empty)
		throw "Illegal argument";
	
	var leftSize = this.left.size;
	if (index < leftSize)
		this.left = this.left.removeAt(index);
	else if (index > leftSize)
		this.right = this.right.removeAt(index - leftSize - 1);
	else if (this.left === empty && this.right === empty)
		return empty;
	else if (this.left !== empty && this.right === empty)
		return this.left;
	else if (this.left === empty && this.right !== empty)
		return this.right;
	else {
		// We can remove the successor or the predecessor
		this.value = this.getSuccessor();
		this.right = this.right.removeAt(0);
	}
	this.recalculate();
	return this.balance();
};


AvlTreeListNode.prototype.getSuccessor = function() {
	if (this === AvlTreeListNode.EMPTY_LEAF || this.right === AvlTreeListNode.EMPTY_LEAF)
		throw "Illegal state";
	var node = this.right;
	while (node.left != AvlTreeListNode.EMPTY_LEAF)
		node = node.left;
	return node.value;
};


// Balances the subtree rooted at this node and returns the new root.
AvlTreeListNode.prototype.balance = function() {
	var bal = this.getBalance();
	if (Math.abs(bal) > 2)
		throw "Assertion error";
	var result = this;
	if (bal == -2) {
		if (Math.abs(this.left.getBalance()) > 1)
			throw "Assertion error";
		if (this.left.getBalance() == +1)
			this.left = this.left.rotateLeft();
		result = this.rotateRight();
	} else if (bal == +2) {
		if (Math.abs(this.right.getBalance()) > 1)
			throw "Assertion error";
		if (this.right.getBalance() == -1)
			this.right = this.right.rotateRight();
		result = this.rotateLeft();
	}
	if (Math.abs(result.getBalance()) > 1)
		throw "Assertion error";
	return result;
};


/* 
 *   A            B
 *  / \          / \
 * 0   B   ->   A   2
 *    / \      / \
 *   1   2    0   1
 */
AvlTreeListNode.prototype.rotateLeft = function() {
	if (this.right === AvlTreeListNode.EMPTY_LEAF)
		throw "Illegal state";
	var root = this.right;
	this.right = root.left;
	root.left = this;
	this.recalculate();
	root.recalculate();
	return root;
};


/* 
 *     B          A
 *    / \        / \
 *   A   2  ->  0   B
 *  / \            / \
 * 0   1          1   2
 */
AvlTreeListNode.prototype.rotateRight = function() {
	if (this.left === AvlTreeListNode.EMPTY_LEAF)
		throw "Illegal state";
	var root = this.left;
	this.left = root.right;
	root.right = this;
	this.recalculate();
	root.recalculate();
	return root;
};


// Needs to be called every time the left or right subtree is changed.
// Assumes the left and right subtrees have the correct values computed already.
AvlTreeListNode.prototype.recalculate = function() {
	if (this === AvlTreeListNode.EMPTY_LEAF)
		throw "Assertion error";
	if (this.left.height < 0 || this.right.height < 0)
		throw "Assertion error";
	if (this.left.size < 0 || this.right.size < 0)
		throw "Assertion error";
	this.height = Math.max(this.left.height, this.right.height) + 1;
	this.size = this.left.size + this.right.size + 1;
	if (this.height < 0 || this.size < 0)
		throw "Assertion error";
};


AvlTreeListNode.prototype.getBalance = function() {
	return this.right.height - this.left.height;
};


// For unit tests, invokable by the main class.
AvlTreeListNode.prototype.checkStructure = function() {
	if (this === AvlTreeListNode.EMPTY_LEAF)
		return;
	this.left .checkStructure();
	this.right.checkStructure();
	
	if (this.height != Math.max(this.left.height, this.right.height) + 1)
		throw "AVL tree structure violated: Incorrect cached height";
	if (this.size != this.left.size + this.right.size + 1)
		throw "AVL tree structure violated: Incorrect cached size";
	if (Math.abs(this.getBalance()) > 1)
		throw "AVL tree structure violated: Height imbalance";
};


/*---- Iterator helper class (private) ----*/

// Note: An iterator is not fail-fast on concurrent modification.
function AvlTreeListIterator(root) {
	this.stack = [];
	var node = root;
	while (node != AvlTreeListNode.EMPTY_LEAF) {
		this.stack.push(node);
		node = node.left;
	}
}


AvlTreeListIterator.prototype.hasNext = function() {
	return this.stack.length > 0;
}


AvlTreeListIterator.prototype.next = function() {
	if (!this.hasNext())
		throw "No next element";
	
	var node = this.stack.pop();
	var result = node.value;
	node = node.right;
	while (node != AvlTreeListNode.EMPTY_LEAF) {
		this.stack.push(node);
		node = node.left;
	}
	return result;
}
