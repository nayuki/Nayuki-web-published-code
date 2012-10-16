/* 
 * Discrete Fourier transform
 * Copyright (c) 2012 Nayuki Minase
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
			sumreal +=  inreal[t]*cos(2*M_PI * t * k / n) + inimag[t]*sin(2*M_PI * t * k / n);
			sumimag += -inreal[t]*sin(2*M_PI * t * k / n) + inimag[t]*cos(2*M_PI * t * k / n);
		}
		outreal[k] = sumreal;
		outimag[k] = sumimag;
	}
}
