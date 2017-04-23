/* 
 * Disjoint-set data structure - Test suite (JavaScript)
 * 
 * Copyright (c) 2016 Project Nayuki. (MIT License)
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

function testNew() {
	var ds = new DisjointSet(10);
	assertEquals(10, ds.getNumberOfSets());
	assertEquals(1, ds.getSizeOfSet(0));
	assertEquals(1, ds.getSizeOfSet(2));
	assertEquals(1, ds.getSizeOfSet(9));
	assertEquals(true, ds.areInSameSet(0, 0));
	assertEquals(false, ds.areInSameSet(0, 1));
	assertEquals(false, ds.areInSameSet(9, 3));
	ds.checkStructure();
}


function testMerge() {
	var ds = new DisjointSet(10);
	assertEquals(true, ds.mergeSets(0, 1));
	ds.checkStructure();
	assertEquals(9, ds.getNumberOfSets());
	assertEquals(true, ds.areInSameSet(0, 1));
	
	assertEquals(true, ds.mergeSets(2, 3));
	ds.checkStructure();
	assertEquals(8, ds.getNumberOfSets());
	assertEquals(true, ds.areInSameSet(2, 3));
	
	assertEquals(false, ds.mergeSets(2, 3));
	ds.checkStructure();
	assertEquals(8, ds.getNumberOfSets());
	assertEquals(false, ds.areInSameSet(0, 2));
	
	assertEquals(true, ds.mergeSets(0, 3));
	ds.checkStructure();
	assertEquals(7, ds.getNumberOfSets());
	assertEquals(true, ds.areInSameSet(0, 2));
	assertEquals(true, ds.areInSameSet(3, 0));
	assertEquals(true, ds.areInSameSet(1, 3));
}


function testBigMerge() {
	var maxRank = 20;
	var trials = 10000;
	
	var numElems = 1 << maxRank;  // Grows exponentially
	var ds = new DisjointSet(numElems);
	for (var level = 0; level < maxRank; level++) {
		var mergeStep = 1 << level;
		var incrStep = mergeStep * 2;
		for (var i = 0; i < numElems; i += incrStep) {
			assertEquals(false, ds.areInSameSet(i, i + mergeStep));
			assertEquals(true, ds.mergeSets(i, i + mergeStep));
		}
		// Now we have a bunch of sets of size 2^(level+1)
		
		// Do random tests
		var mask = -incrStep;  // 0b11...100...00
		for (var i = 0; i < trials; i++) {
			var j = Math.floor(Math.random() * numElems);
			var k = Math.floor(Math.random() * numElems);
			var expect = (j & mask) == (k & mask);
			assertEquals(true, ds.areInSameSet(j, k) == expect);
		}
	}
}


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
			assertEquals(true, ds.getSizeOfSet(k) == nds.getSizeOfSet(k));
			assertEquals(true, ds.areInSameSet(k, l) == nds.areInSameSet(k, l));
			if (Math.random() < 0.1)
				assertEquals(true, ds.mergeSets(k, l) == nds.mergeSets(k, l));
			assertEquals(nds.getNumberOfSets(), ds.getNumberOfSets());
			if (Math.random() < 0.001)
				ds.checkStructure();
		}
		ds.checkStructure();
	}
}


var TEST_SUITE_FUNCTIONS = [
	testNew,
	testMerge,
	testBigMerge,
	testAgainstNaiveRandomly,
];


/*---- Helper definitions ----*/

function NaiveDisjointSet(numElems) {
	var representatives = [];
	for (var i = 0; i < numElems; i++)
		representatives.push(i);
	
	this.getNumberOfSets = function() {
		var result = 0;
		for (var i = 0; i < representatives.length; i++) {
			if (representatives[i] == i)
				result++;
		}
		return result;
	};
	
	this.getSizeOfSet = function(elemIndex) {
		var repr = representatives[elemIndex];
		var result = 0;
		for (var i = 0; i < representatives.length; i++) {
			if (representatives[i] == repr)
				result++;
		}
		return result;
	};
	
	this.areInSameSet = function(elemIndex0, elemIndex1) {
		return representatives[elemIndex0] == representatives[elemIndex1];
	};
	
	this.mergeSets = function(elemIndex0, elemIndex1) {
		var repr0 = representatives[elemIndex0];
		var repr1 = representatives[elemIndex1];
		for (var i = 0; i < representatives.length; i++) {
			if (representatives[i] == repr1)
				representatives[i] = repr0;
		}
		return repr0 != repr1;
	};
	
}


function assertEquals(expected, actual) {
	if (expected !== actual)
		throw "Assertion error";
}
