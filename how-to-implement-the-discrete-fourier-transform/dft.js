/* 
 * Discrete Fourier transform
 * by Project Nayuki, 2014. Public domain.
 * https://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
 */


/* 
 * Computes the discrete Fourier transform (DFT) of the given input vector.
 * 'inreal' and 'inimag' are each an array of n floating-point numbers.
 * Returns an array of two arrays - outreal and outimag, each of length n.
 */
function computeDft(inreal, inimag) {
    var n = inreal.length;
    var outreal = new Array(n);
    var outimag = new Array(n);
    for (var k = 0; k < n; k++) {  // For each output element
        var sumreal = 0;
        var sumimag = 0;
        for (var t = 0; t < n; t++) {  // For each input element
            var angle = 2 * Math.PI * t * k / n;
            sumreal +=  inreal[t] * Math.cos(angle) + inimag[t] * Math.sin(angle);
            sumimag += -inreal[t] * Math.sin(angle) + inimag[t] * Math.cos(angle);
        }
        outreal[k] = sumreal;
        outimag[k] = sumimag;
    }
    return [outreal, outimag];
}
