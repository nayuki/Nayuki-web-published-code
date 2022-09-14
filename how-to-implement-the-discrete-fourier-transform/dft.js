/* 
 * Discrete Fourier transform (JavaScript)
 * by Project Nayuki, 2022. Public domain.
 * https://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
 */

"use strict";


/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector.
 * 'inreal' and 'inimag' are each an array of n floating-point numbers.
 * Returns an array of two arrays - outreal and outimag, each of length n.
 */
function computeDft(inreal, inimag) {
	const n = inreal.length;
	let outreal = new Array(n);
	let outimag = new Array(n);
	for (let k = 0; k < n; k++) {  // For each output element
		let sumreal = 0;
		let sumimag = 0;
		for (let t = 0; t < n; t++) {  // For each input element
			const angle = 2 * Math.PI * t * k / n;
			sumreal +=  inreal[t] * Math.cos(angle) + inimag[t] * Math.sin(angle);
			sumimag += -inreal[t] * Math.sin(angle) + inimag[t] * Math.cos(angle);
		}
		outreal[k] = sumreal;
		outimag[k] = sumimag;
	}
	return [outreal, outimag];
}
