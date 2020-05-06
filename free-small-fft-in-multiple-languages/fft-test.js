/* 
 * FFT and convolution test (JavaScript)
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
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


/*---- Main and test functions ----*/

function main() {
	// Test power-of-2 size FFTs
	for (var i = 0; i <= 12; i++)
		testFft(1 << i);
	
	// Test small size FFTs
	for (var i = 0; i < 30; i++)
		testFft(i);
	
	// Test diverse size FFTs
	for (var i = 0, prev = 0; i <= 100; i++) {
		var n = Math.round(Math.pow(1500, i / 100.0));
		if (n > prev) {
			testFft(n);
			prev = n;
		}
	}
	
	// Test power-of-2 size convolutions
	for (var i = 0; i <= 12; i++)
		testConvolution(1 << i);
	
	// Test diverse size convolutions
	for (var i = 0, prev = 0; i <= 100; i++) {
		var n = Math.round(Math.pow(1500, i / 100.0));
		if (n > prev) {
			testConvolution(n);
			prev = n;
		}
	}
	
	document.write("\nMax log err = " + maxLogError.toFixed(1));
	document.write("\nTest " + (maxLogError < -10 ? "passed" : "failed"));
}


function testFft(size) {
	var inputreal = randomReals(size);
	var inputimag = randomReals(size);
	
	var expectreal = new Array(size);
	var expectimag = new Array(size);
	naiveDft(inputreal, inputimag, expectreal, expectimag, false);
	
	var actualreal = inputreal.slice();
	var actualimag = inputimag.slice();
	transform(actualreal, actualimag);
	var err = log10RmsErr(expectreal, expectimag, actualreal, actualimag);
	
	for (var i = 0; i < size; i++) {
		actualreal[i] /= size;
		actualimag[i] /= size;
	}
	inverseTransform(actualreal, actualimag);
	err = Math.max(log10RmsErr(inputreal, inputimag, actualreal, actualimag), err);
	document.write("fftsize=" + size + "  logerr=" + err.toFixed(1) + "\n");
}


function testConvolution(size) {
	var input0real = randomReals(size);
	var input0imag = randomReals(size);
	
	var input1real = randomReals(size);
	var input1imag = randomReals(size);
	
	var expectreal = new Array(size);
	var expectimag = new Array(size);
	naiveConvolve(input0real, input0imag, input1real, input1imag, expectreal, expectimag);
	
	var actualreal = new Array(size);
	var actualimag = new Array(size);
	convolveComplex(input0real, input0imag, input1real, input1imag, actualreal, actualimag);
	
	document.write("convsize=" + size + "  logerr=" +
		log10RmsErr(expectreal, expectimag, actualreal, actualimag).toFixed(1) + "\n");
}


/*---- Naive reference computation functions ----*/

function naiveDft(inreal, inimag, outreal, outimag, inverse) {
	var n = inreal.length;
	if (n != inimag.length || n != outreal.length || n != outimag.length)
		throw "Mismatched lengths";
	
	var coef = (inverse ? 2 : -2) * Math.PI;
	for (var k = 0; k < n; k++) {  // For each output element
		var sumreal = 0;
		var sumimag = 0;
		for (var t = 0; t < n; t++) {  // For each input element
			var angle = coef * (t * k % n) / n;  // This is more accurate than t * k
			sumreal += inreal[t] * Math.cos(angle) - inimag[t] * Math.sin(angle);
			sumimag += inreal[t] * Math.sin(angle) + inimag[t] * Math.cos(angle);
		}
		outreal[k] = sumreal;
		outimag[k] = sumimag;
	}
}


function naiveConvolve(xreal, ximag, yreal, yimag, outreal, outimag) {
	var n = xreal.length;
	if (n != ximag.length || n != yreal.length || n != yimag.length
			|| n != outreal.length || n != outimag.length)
		throw "Mismatched lengths";
	
	for (var i = 0; i < n; i++) {
		outreal[i] = 0;
		outimag[i] = 0;
	}
	for (var i = 0; i < n; i++) {
		for (var j = 0; j < n; j++) {
			var k = (i + j) % n;
			outreal[k] += xreal[i] * yreal[j] - ximag[i] * yimag[j];
			outimag[k] += xreal[i] * yimag[j] + ximag[i] * yreal[j];
		}
	}
}


/*---- Utility functions ----*/

var maxLogError = Number.NEGATIVE_INFINITY;

function log10RmsErr(xreal, ximag, yreal, yimag) {
	var n = xreal.length;
	if (n != ximag.length || n != yreal.length || n != yimag.length)
		throw "Mismatched lengths";
	
	var err = Math.pow(10, -99 * 2);
	for (var i = 0; i < n; i++)
		err += (xreal[i] - yreal[i]) * (xreal[i] - yreal[i]) + (ximag[i] - yimag[i]) * (ximag[i] - yimag[i]);
	err = Math.sqrt(err / Math.max(n, 1));  // Now this is a root mean square (RMS) error
	err = Math.log(err) / Math.log(10);
	maxLogError = Math.max(err, maxLogError);
	return err;
}


function randomReals(size) {
	var result = new Array(size);
	for (var i = 0; i < result.length; i++)
		result[i] = Math.random() * 2 - 1;
	return result;
}


main();
