/* 
 * Discrete Fourier transform (TypeScript)
 * by Project Nayuki, 2020. Public domain.
 * https://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
 */


/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector.
 * 'inreal' and 'inimag' are each an array of n floating-point numbers.
 * Returns an array of two arrays - outreal and outimag, each of length n.
 */
function computeDft(inreal: Array<number>, inimag: Array<number>): [Array<number>,Array<number>] {
	const n: number = inreal.length;
	let outreal: Array<number> = new Array(n);
	let outimag: Array<number> = new Array(n);
	for (let k = 0; k < n; k++) {  // For each output element
		let sumreal: number = 0;
		let sumimag: number = 0;
		for (let t = 0; t < n; t++) {  // For each input element
			const angle: number = 2 * Math.PI * t * k / n;
			sumreal +=  inreal[t] * Math.cos(angle) + inimag[t] * Math.sin(angle);
			sumimag += -inreal[t] * Math.sin(angle) + inimag[t] * Math.cos(angle);
		}
		outreal[k] = sumreal;
		outimag[k] = sumimag;
	}
	return [outreal, outimag];
}
