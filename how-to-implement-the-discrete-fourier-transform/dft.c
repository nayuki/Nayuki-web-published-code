/* 
 * Discrete Fourier transform (C)
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
 */


/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector.
 * All the array arguments must be non-NULL and have a length equal to n.
 */
#include <complex.h>
#include <math.h>
void compute_dft_complex(const double complex input[], double complex output[], int n) {
	for (int k = 0; k < n; k++) {  // For each output element
		complex double sum = 0.0;
		for (int t = 0; t < n; t++) {  // For each input element
			double angle = 2 * M_PI * t * k / n;
			sum += input[t] * cexp(-angle * I);
		}
		output[k] = sum;
	}
}


/* 
 * (Alternate implementation using only real numbers.)
 * Computes the discrete Fourier transform (DFT) of the given complex vector.
 * All the array arguments must be non-NULL and have a length equal to n.
 */
#include <math.h>
void compute_dft_real_pair(const double inreal[], const double inimag[],
		double outreal[], double outimag[], int n) {
	
	for (int k = 0; k < n; k++) {  // For each output element
		double sumreal = 0;
		double sumimag = 0;
		for (int t = 0; t < n; t++) {  // For each input element
			double angle = 2 * M_PI * t * k / n;
			sumreal +=  inreal[t] * cos(angle) + inimag[t] * sin(angle);
			sumimag += -inreal[t] * sin(angle) + inimag[t] * cos(angle);
		}
		outreal[k] = sumreal;
		outimag[k] = sumimag;
	}
}
