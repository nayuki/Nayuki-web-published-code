/* 
 * Discrete Fourier transform
 * by Project Nayuki, 2014. Public domain.
 * http://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
 */

#include <math.h>


/* 
 * Computes the discrete Fourier transform (DFT) of the given vector.
 * All the array arguments must have the same length.
 */
void compute_dft(double inreal[], double inimag[], double outreal[], double outimag[], int n) {
	int k;
	for (k = 0; k < n; k++) {  /* For each output element */
		double sumreal = 0;
		double sumimag = 0;
		int t;
		for (t = 0; t < n; t++) {  /* For each input element */
			double angle = 2 * M_PI * t * k / n;
			sumreal +=  inreal[t] * cos(angle) + inimag[t] * sin(angle);
			sumimag += -inreal[t] * sin(angle) + inimag[t] * cos(angle);
		}
		outreal[k] = sumreal;
		outimag[k] = sumimag;
	}
}
