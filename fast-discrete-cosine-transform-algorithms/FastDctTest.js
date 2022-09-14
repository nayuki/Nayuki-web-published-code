/* 
 * Fast discrete cosine transform algorithms (JavaScript)
 * 
 * Copyright (c) 2022 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-discrete-cosine-transform-algorithms
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
	
	function testFastDctLeeVsNaive() {
		for (let len = 1; len <= (1 << 11); len *= 2) {
			const vector = randomVector(len);
			
			let expect = naiveDct.transform(vector);
			let actual = vector.slice();
			fastDctLee.transform(actual);
			assertArrayEquals(expect, actual, EPSILON);
			
			expect = naiveDct.inverseTransform(vector);
			actual = vector.slice();
			fastDctLee.inverseTransform(actual);
			assertArrayEquals(expect, actual, EPSILON);
		}
	},
	
	
	function testFastDctLeeInvertibility() {
		for (let len = 1; len <= (1 << 17); len *= 2) {
			const vector = randomVector(len);
			let temp = vector.slice();
			fastDctLee.transform(temp);
			fastDctLee.inverseTransform(temp);
			for (let i = 0; i < temp.length; i++)
				temp[i] /= len / 2.0;
			assertArrayEquals(vector, temp, EPSILON);
		}
	},
	
	
	function testFastDct8VsNaive() {
		const vector = randomVector(8);
		
		let expect = naiveDct.transform(vector);
		for (let i = 0; i < expect.length; i++)
			expect[i] /= i == 0 ? Math.sqrt(8) : 2;
		let actual = vector.slice();
		fastDct8.transform(actual);
		assertArrayEquals(expect, actual, EPSILON);
		
		expect = vector.slice();
		for (let i = 0; i < expect.length; i++)
			expect[i] /= i == 0 ? Math.sqrt(2) : 2;
		expect = naiveDct.inverseTransform(expect);
		actual = vector.slice();
		fastDct8.inverseTransform(actual);
		assertArrayEquals(expect, actual, EPSILON);
	},
	
	
	function testFastDctFftVsNaive() {
		for (let i = 0, prev = 0; i <= 100; i++) {
			const len = Math.round(Math.pow(1000, i / 100.0));
			if (len <= prev)
				continue;
			prev = len;
			const vector = randomVector(len);
			
			let expect = naiveDct.transform(vector);
			let actual = vector.slice();
			fastDctFft.transform(actual);
			assertArrayEquals(expect, actual, EPSILON);
			
			expect = naiveDct.inverseTransform(vector);
			actual = vector.slice();
			fastDctFft.inverseTransform(actual);
			assertArrayEquals(expect, actual, EPSILON);
		}
	},
	
	
	function testFastDctFftInvertibility() {
		for (let i = 0, prev = 0; i <= 30; i++) {
			const len = Math.round(Math.pow(30000, i / 30.0));
			if (len <= prev)
				continue;
			prev = len;
			const vector = randomVector(len);
			let temp = vector.slice();
			fastDctFft.transform(temp);
			fastDctFft.inverseTransform(temp);
			for (let j = 0; j < temp.length; j++)
				temp[j] /= len / 2.0;
			assertArrayEquals(vector, temp, EPSILON);
		}
	},
	
];



/*---- Helper definitions ----*/

const EPSILON = 1e-9;


function assertArrayEquals(expect, actual, epsilon) {
	if (expect.length != actual.length)
		throw new Error("Length mismatch");
	for (let i = 0; i < expect.length; i++) {
		if (Math.abs(expect[i] - actual[i]) > epsilon)
			throw new Error("Value mismatch");
	}
}


function randomVector(len) {
	let result = [];
	for (let i = 0; i < len; i++)
		result.push(Math.random() * 2 - 1);
	return result;
}



const naiveDct = new function() {
	
	// DCT type II, unscaled.
	this.transform = function(vector) {
		let result = [];
		const factor = Math.PI / vector.length;
		for (let i = 0; i < vector.length; i++) {
			let sum = 0;
			for (let j = 0; j < vector.length; j++)
				sum += vector[j] * Math.cos((j + 0.5) * i * factor);
			result.push(sum);
		}
		return result;
	};
	
	
	// DCT type III, unscaled.
	this.inverseTransform = function(vector) {
		let result = [];
		const factor = Math.PI / vector.length;
		for (let i = 0; i < vector.length; i++) {
			let sum = vector[0] / 2;
			for (let j = 1; j < vector.length; j++)
				sum += vector[j] * Math.cos(j * (i + 0.5) * factor);
			result.push(sum);
		}
		return result;
	};
	
};



(function() {
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
			} catch (e) {
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
