/* 
 * Discrete Fourier transform (C++)
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/how-to-implement-the-discrete-fourier-transform
 */

// Shared definitions
#include <cmath>
#include <vector>
using std::size_t;
using std::vector;


/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector.
 * All the array arguments must have the same length.
 */
#include <complex>
using std::complex;
using std::exp;
vector<complex<double> > computeDft(const vector<complex<double> > &input) {
	vector<complex<double> > output;
	size_t n = input.size();
	for (size_t k = 0; k < n; k++) {  // For each output element
		complex<double> sum(0.0, 0.0);
		for (size_t t = 0; t < n; t++) {  // For each input element
			double angle = 2 * M_PI * t * k / n;
			sum += input[t] * exp(-angle);
		}
		output.push_back(sum);
	}
	return output;
}


/* 
 * (Alternate implementation using only real numbers.)
 * Computes the discrete Fourier transform (DFT) of the given complex vector.
 * All the array arguments must have the same length.
 */
using std::cos;
using std::sin;
void computeDft(const vector<double> &inreal, const vector<double> &inimag,
		vector<double> &outreal, vector<double> &outimag) {
	
	size_t n = inreal.size();
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
