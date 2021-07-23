/* 
 * Discrete Fourier transform (C)
 * by Project Nayuki, 2021. Public domain.
 * https://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
 */


/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector.
 * All the array arguments must be non-NULL and have a length equal to n.
 */
#include <complex.h>
#include <math.h>
#include <stddef.h>
void compute_dft_complex(const double complex input[restrict], double complex output[restrict], size_t n) {
	for (size_t k = 0; k < n; k++) {  // For each output element
		double complex sum = 0.0;
		for (size_t t = 0; t < n; t++) {  // For each input element
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
#include <stddef.h>
void compute_dft_real_pair(const double inreal[restrict], const double inimag[restrict],
		double outreal[restrict], double outimag[restrict], size_t n) {
	
	for (size_t k = 0; k < n; k++) {  // For each output element
		double sumreal = 0;
		double sumimag = 0;
		for (size_t t = 0; t < n; t++) {  // For each input element
			double angle = 2 * M_PI * t * k / n;
			sumreal +=  inreal[t] * cos(angle) + inimag[t] * sin(angle);
			sumimag += -inreal[t] * sin(angle) + inimag[t] * cos(angle);
		}
		outreal[k] = sumreal;
		outimag[k] = sumimag;
	}
}
