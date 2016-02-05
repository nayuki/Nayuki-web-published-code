/* 
 * Discrete Fourier transform
 * by Project Nayuki, 2015. Public domain.
 * https://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
 */

#include <cmath>
#include <vector>


/* 
 * Computes the discrete Fourier transform (DFT) of the given vector.
 * All the array arguments must have the same length.
 */
void computeDft(const std::vector<double> &inreal, const std::vector<double> &inimag,
		std::vector<double> &outreal, std::vector<double> &outimag) {
	
	unsigned int n = inreal.size();
	for (unsigned int k = 0; k < n; k++) {  /* For each output element */
		double sumreal = 0;
		double sumimag = 0;
		for (unsigned int t = 0; t < n; t++) {  /* For each input element */
			double angle = 2 * M_PI * t * k / n;
			sumreal +=  inreal[t] * cos(angle) + inimag[t] * sin(angle);
			sumimag += -inreal[t] * sin(angle) + inimag[t] * cos(angle);
		}
		outreal[k] = sumreal;
		outimag[k] = sumimag;
	}
}
