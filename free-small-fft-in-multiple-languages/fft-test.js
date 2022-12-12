/* 
 * FFT and convolution test (JavaScript)
 * 
 * Copyright (c) 2022 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/free-small-fft-in-multiple-languages
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

importScripts("fft.js");


/*---- Main and test functions ----*/

function main() {
	// Test power-of-2 size FFTs
	for (let i = 0; i <= 12; i++)
		testFft(1 << i);
	
	// Test small size FFTs
	for (let i = 0; i < 30; i++)
		testFft(i);
	
	// Test diverse size FFTs
	for (let i = 0, prev = 0; i <= 100; i++) {
		const n = Math.round(Math.pow(1500, i / 100.0));
		if (n > prev) {
			testFft(n);
			prev = n;
		}
	}
	
	// Test power-of-2 size convolutions
	for (let i = 0; i <= 12; i++)
		testConvolution(1 << i);
	
	// Test diverse size convolutions
	for (let i = 0, prev = 0; i <= 100; i++) {
		const n = Math.round(Math.pow(1500, i / 100.0));
		if (n > prev) {
			testConvolution(n);
			prev = n;
		}
	}
	
	postMessage("\nMax log err = " + maxLogError.toFixed(1));
	postMessage("\nTest " + (maxLogError < -10 ? "passed" : "failed"));
}


function testFft(size) {
	const inputreal = randomReals(size);
	const inputimag = randomReals(size);
	
	let expectreal = new Array(size);
	let expectimag = new Array(size);
	naiveDft(inputreal, inputimag, expectreal, expectimag, false);
	
	let actualreal = inputreal.slice();
	let actualimag = inputimag.slice();
	transform(actualreal, actualimag);
	let err = log10RmsErr(expectreal, expectimag, actualreal, actualimag);
	
	for (let i = 0; i < size; i++) {
		actualreal[i] /= size;
		actualimag[i] /= size;
	}
	inverseTransform(actualreal, actualimag);
	err = Math.max(log10RmsErr(inputreal, inputimag, actualreal, actualimag), err);
	postMessage("fftsize=" + size + "  logerr=" + err.toFixed(1) + "\n");
}


function testConvolution(size) {
	const input0real = randomReals(size);
	const input0imag = randomReals(size);
	
	const input1real = randomReals(size);
	const input1imag = randomReals(size);
	
	let expectreal = new Array(size);
	let expectimag = new Array(size);
	naiveConvolve(input0real, input0imag, input1real, input1imag, expectreal, expectimag);
	
	let actualreal = new Array(size);
	let actualimag = new Array(size);
	convolveComplex(input0real, input0imag, input1real, input1imag, actualreal, actualimag);
	
	postMessage("convsize=" + size + "  logerr=" +
		log10RmsErr(expectreal, expectimag, actualreal, actualimag).toFixed(1) + "\n");
}


/*---- Naive reference computation functions ----*/

function naiveDft(inreal, inimag, outreal, outimag, inverse) {
	const n = inreal.length;
	if (n != inimag.length || n != outreal.length || n != outimag.length)
		throw new RangeError("Mismatched lengths");
	
	const coef = (inverse ? 2 : -2) * Math.PI;
	for (let k = 0; k < n; k++) {  // For each output element
		let sumreal = 0;
		let sumimag = 0;
		for (let t = 0; t < n; t++) {  // For each input element
			const angle = coef * (t * k % n) / n;  // This is more accurate than t * k
			sumreal += inreal[t] * Math.cos(angle) - inimag[t] * Math.sin(angle);
			sumimag += inreal[t] * Math.sin(angle) + inimag[t] * Math.cos(angle);
		}
		outreal[k] = sumreal;
		outimag[k] = sumimag;
	}
}


function naiveConvolve(xreal, ximag, yreal, yimag, outreal, outimag) {
	const n = xreal.length;
	if (n != ximag.length || n != yreal.length || n != yimag.length
			|| n != outreal.length || n != outimag.length)
		throw new RangeError("Mismatched lengths");
	
	for (let i = 0; i < n; i++) {
		outreal[i] = 0;
		outimag[i] = 0;
	}
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			const k = (i + j) % n;
			outreal[k] += xreal[i] * yreal[j] - ximag[i] * yimag[j];
			outimag[k] += xreal[i] * yimag[j] + ximag[i] * yreal[j];
		}
	}
}


/*---- Utility functions ----*/

let maxLogError = Number.NEGATIVE_INFINITY;

function log10RmsErr(xreal, ximag, yreal, yimag) {
	const n = xreal.length;
	if (n != ximag.length || n != yreal.length || n != yimag.length)
		throw new RangeError("Mismatched lengths");
	
	let err = Math.pow(10, -99 * 2);
	for (let i = 0; i < n; i++)
		err += (xreal[i] - yreal[i]) * (xreal[i] - yreal[i]) + (ximag[i] - yimag[i]) * (ximag[i] - yimag[i]);
	err = Math.sqrt(err / Math.max(n, 1));  // Now this is a root mean square (RMS) error
	err = Math.log(err) / Math.log(10);
	maxLogError = Math.max(err, maxLogError);
	return err;
}


function randomReals(size) {
	let result = new Array(size);
	for (let i = 0; i < result.length; i++)
		result[i] = Math.random() * 2 - 1;
	return result;
}


main();
