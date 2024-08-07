/* 
 * Free FFT and convolution (Rust)
 * 
 * Copyright (c) 2024 Project Nayuki. (MIT License)
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

use std;


/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This is a wrapper function.
 */
pub fn transform(real: &mut [f64], imag: &mut [f64]) {
	let n: usize = real.len();
	assert_eq!(imag.len(), n);
	if n == 0 {
		return;
	} else if n.is_power_of_two() {
		transform_radix2(real, imag);
	} else {  // More complicated algorithm for arbitrary sizes
		transform_bluestein(real, imag);
	}
}


/* 
 * Computes the inverse discrete Fourier transform (IDFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This is a wrapper function. This transform does not perform scaling, so the inverse is not a true inverse.
 */
pub fn inverse_transform(real: &mut [f64], imag: &mut [f64]) {
	transform(imag, real);
}


/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector's length must be a power of 2. Uses the Cooley-Tukey decimation-in-time radix-2 algorithm.
 */
pub fn transform_radix2(real: &mut [f64], imag: &mut [f64]) {
	// Length variables
	let n: usize = real.len();
	assert_eq!(imag.len(), n, "Mismatched lengths");
	assert!(n.is_power_of_two(), "Length is not a power of 2");
	if n == 1 {
		return;
	}
	
	// Trigonometric tables
	let mut costable = Vec::<f64>::with_capacity(n / 2);
	let mut sintable = Vec::<f64>::with_capacity(n / 2);
	for i in 0 .. n / 2 {
		let angle: f64 = 2.0 * std::f64::consts::PI * (i as f64) / (n as f64);
		costable.push(angle.cos());
		sintable.push(angle.sin());
	}
	
	// Bit-reversed addressing permutation
	let shift: u32 = n.leading_zeros() + 1;
	for i in 0 .. n {
		let j: usize = i.reverse_bits() >> shift;
		if j > i {
			real.swap(i, j);
			imag.swap(i, j);
		}
	}
	
	// Cooley-Tukey decimation-in-time radix-2 FFT
	let mut size: usize = 2;
	while size <= n {
		let halfsize: usize = size / 2;
		let tablestep: usize = n / size;
		let mut i: usize = 0;
		while i < n {
			let mut k: usize = 0;
			for j in i .. i + halfsize {
				let l: usize = j + halfsize;
				let tpre: f64 =  real[l] * costable[k] + imag[l] * sintable[k];
				let tpim: f64 = -real[l] * sintable[k] + imag[l] * costable[k];
				real[l] = real[j] - tpre;
				imag[l] = imag[j] - tpim;
				real[j] += tpre;
				imag[j] += tpim;
				k += tablestep;
			}
			i += size;
		}
		if size == n {  // Prevent overflow in 'size *= 2'
			break;
		}
		size *= 2;
	}
}


/* 
 * Computes the discrete Fourier transform (DFT) of the given complex vector, storing the result back into the vector.
 * The vector can have any length. This requires the convolution function, which in turn requires the radix-2 FFT function.
 * Uses Bluestein's chirp z-transform algorithm.
 */
pub fn transform_bluestein(real: &mut [f64], imag: &mut [f64]) {
	// Find a power-of-2 convolution length m such that m >= n * 2 + 1
	let n: usize = real.len();
	assert_eq!(imag.len(), n, "Mismatched lengths");
	let m: usize = Some(n)
		.and_then(|x| x.checked_mul(2))
		.and_then(|x| x.checked_add(1))
		.and_then(|x| x.checked_next_power_of_two())
		.expect("Array too large");
	
	// Trigonometric tables
	let mut costable = Vec::<f64>::with_capacity(n);
	let mut sintable = Vec::<f64>::with_capacity(n);
	for i in 0 .. n {
		let j: u64 = (i as u64) * (i as u64) % ((n as u64) * 2);  // This is more accurate than j = i * i
		let angle: f64 = std::f64::consts::PI * (j as f64) / (n as f64);
		costable.push(angle.cos());
		sintable.push(angle.sin());
	}
	
	// Temporary vectors and preprocessing
	let mut areal = vec![0.0f64; m];
	let mut aimag = vec![0.0f64; m];
	for i in 0 .. n {
		areal[i] =  real[i] * costable[i] + imag[i] * sintable[i];
		aimag[i] = -real[i] * sintable[i] + imag[i] * costable[i];
	}
	let mut breal = vec![0.0f64; m];
	let mut bimag = vec![0.0f64; m];
	breal[0] = costable[0];
	bimag[0] = sintable[0];
	for i in 1 .. n {
		breal[i] = costable[i];
		breal[m - i] = costable[i];
		bimag[i] = sintable[i];
		bimag[m - i] = sintable[i];
	}
	
	// Convolution
	let (creal, cimag) = convolve_complex(areal, aimag, breal, bimag);
	
	// Postprocessing
	for i in 0 .. n {
		real[i] =  creal[i] * costable[i] + cimag[i] * sintable[i];
		imag[i] = -creal[i] * sintable[i] + cimag[i] * costable[i];
	}
}


/* 
 * Computes the circular convolution of the given real vectors. Each vector's length must be the same.
 */
pub fn convolve_real(xvec: Vec<f64>, yvec: Vec<f64>) -> Vec<f64> {
	let n: usize = xvec.len();
	convolve_complex(xvec, vec![0.0; n], yvec, vec![0.0; n]).0
}


/* 
 * Computes the circular convolution of the given complex vectors. Each vector's length must be the same.
 */
pub fn convolve_complex(
		mut xreal: Vec<f64>, mut ximag: Vec<f64>,
		mut yreal: Vec<f64>, mut yimag: Vec<f64>,
		) -> (Vec<f64>,Vec<f64>) {
	
	let n: usize = xreal.len();
	assert_eq!(ximag.len(), n);
	assert_eq!(yreal.len(), n);
	assert_eq!(yimag.len(), n);
	
	transform(&mut xreal, &mut ximag);
	transform(&mut yreal, &mut yimag);
	
	for i in 0 .. n {
		let temp: f64 = xreal[i] * yreal[i] - ximag[i] * yimag[i];
		ximag[i] = ximag[i] * yreal[i] + xreal[i] * yimag[i];
		xreal[i] = temp;
	}
	inverse_transform(&mut xreal, &mut ximag);
	
	// Scaling (because this FFT implementation omits it)
	for x in xreal.iter_mut() {
		*x /= n as f64;
	}
	for x in ximag.iter_mut() {
		*x /= n as f64;
	}
	
	(xreal, ximag)
}
