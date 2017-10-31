/* 
 * Fast discrete cosine transform algorithms (Rust)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-discrete-cosine-transform-algorithms
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

use fft;
use std;


/* 
 * Computes the unscaled DCT type II on the specified array in place.
 * The array length must be a power of 2 or zero.
 * For the formula, see https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-II .
 */
pub fn transform(vector: &mut [f64]) {
	let len: usize = vector.len();
	let halflen: usize = len / 2;
	let mut real = vec![0.0f64; len];
	for i in 0 .. halflen {
		real[i] = vector[i * 2];
		real[len - 1 - i] = vector[i * 2 + 1];
	}
	if len % 2 == 1 {
		real[halflen] = vector[len - 1];
	}
	for i in 0 .. len {
		vector[i] = 0.0;
	}
	fft::transform(&mut real, vector);
	for i in 0 .. len {
		let temp = (i as f64) * std::f64::consts::PI / ((len as f64) * 2.0);
		vector[i] = real[i] * temp.cos() + vector[i] * temp.sin();
	}
}


/* 
 * Computes the unscaled DCT type III on the specified array in place.
 * The array length must be a power of 2 or zero.
 * For the formula, see https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-III .
 */
pub fn inverse_transform(vector: &mut [f64]) {
	let len: usize = vector.len();
	if len > 0 {
		vector[0] /= 2.0;
	}
	let mut real = vec![0.0f64; len];
	for i in 0 .. len {
		let temp = (i as f64) * std::f64::consts::PI / ((len as f64) * 2.0);
		real[i] = vector[i] * temp.cos();
		vector[i] *= -temp.sin();
	}
	fft::transform(&mut real, vector);
	
	let halflen: usize = len / 2;
	for i in 0 .. halflen {
		vector[i * 2 + 0] = real[i];
		vector[i * 2 + 1] = real[len - 1 - i];
	}
	if len % 2 == 1 {
		vector[len - 1] = real[halflen];
	}
}
