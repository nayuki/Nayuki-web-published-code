/* 
 * Fast discrete cosine transform algorithms (Rust)
 * 
 * Copyright (c) 2024 Project Nayuki. (MIT License)
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

use std;


/* 
 * Computes the unscaled DCT type II on the specified array, returning a new array.
 * The array length can be any value, starting from zero. The returned array has the same length.
 * For the formula, see https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-II .
 */
pub fn transform(vector: &[f64]) -> Vec<f64> {
	let mut result = Vec::<f64>::with_capacity(vector.len());
	let factor: f64 = std::f64::consts::PI / (vector.len() as f64);
	for i in 0 .. vector.len() {
		let mut sum = 0.0f64;
		for j in 0 .. vector.len() {
			sum += vector[j] * (((j as f64) + 0.5) * (i as f64) * factor).cos();
		}
		result.push(sum);
	}
	result
}


/* 
 * Computes the unscaled DCT type III on the specified array, returning a new array.
 * The array length can be any value, starting from zero. The returned array has the same length.
 * For the formula, see https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-III .
 */
pub fn inverse_transform(vector: &[f64]) -> Vec<f64> {
	let mut result = Vec::<f64>::with_capacity(vector.len());
	let factor: f64 = std::f64::consts::PI / (vector.len() as f64);
	for i in 0 .. vector.len() {
		let mut sum: f64 = vector[0] / 2.0;
		for j in 1 .. vector.len() {
			sum += vector[j] * ((j as f64) * ((i as f64) + 0.5) * factor).cos();
		}
		result.push(sum);
	}
	result
}
