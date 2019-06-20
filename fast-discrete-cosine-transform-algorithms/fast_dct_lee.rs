/* 
 * Fast discrete cosine transform algorithms (Rust)
 * 
 * Copyright (c) 2019 Project Nayuki. (MIT License)
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
 * Computes the unscaled DCT type II on the specified array in place.
 * The array length must be a power of 2.
 * For the formula, see https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-II .
 */
pub fn transform(vector: &mut [f64]) {
	let n: usize = vector.len();
	assert_eq!(n.count_ones(), 1, "Length must be power of 2");
	transform_recursive(vector, &mut vec![0.0f64; n]);
}


fn transform_recursive(vector: &mut [f64], temp: &mut [f64]) {
	// Algorithm by Byeong Gi Lee, 1984. For details, see:
	// See: http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.118.3056&rep=rep1&type=pdf#page=34
	let len: usize = vector.len();
	if len == 1 {
		return;
	}
	let halflen: usize = len / 2;
	for i in 0 .. halflen {
		let x = vector[i];
		let y = vector[len - 1 - i];
		temp[i] = x + y;
		temp[i + halflen] = (x - y) / ((((i as f64) + 0.5) * std::f64::consts::PI / (len as f64)).cos() * 2.0);
	}
	transform_recursive(&mut temp[.. halflen], vector);
	transform_recursive(&mut temp[halflen .. len], vector);
	for i in 0 .. halflen - 1 {
		vector[i * 2 + 0] = temp[i];
		vector[i * 2 + 1] = temp[i + halflen] + temp[i + halflen + 1];
	}
	vector[len - 2] = temp[halflen - 1];
	vector[len - 1] = temp[len - 1];
}


/* 
 * Computes the unscaled DCT type III on the specified array in place.
 * The array length must be a power of 2.
 * For the formula, see https://en.wikipedia.org/wiki/Discrete_cosine_transform#DCT-III .
 */
pub fn inverse_transform(vector: &mut [f64]) {
	let n: usize = vector.len();
	assert_eq!(n.count_ones(), 1, "Length must be power of 2");
	vector[0] /= 2.0;
	inverse_transform_recursive(vector, &mut vec![0.0f64; n]);
}


fn inverse_transform_recursive(vector: &mut [f64], temp: &mut [f64]) {
	// Algorithm by Byeong Gi Lee, 1984. For details, see:
	// https://www.nayuki.io/res/fast-discrete-cosine-transform-algorithms/lee-new-algo-discrete-cosine-transform.pdf
	let len: usize = vector.len();
	if len == 1 {
		return;
	}
	let halflen: usize = len / 2;
	temp[0] = vector[0];
	temp[halflen] = vector[1];
	for i in 1 .. halflen {
		temp[i] = vector[i * 2];
		temp[i + halflen] = vector[i * 2 - 1] + vector[i * 2 + 1];
	}
	inverse_transform_recursive(&mut temp[.. halflen], vector);
	inverse_transform_recursive(&mut temp[halflen .. len], vector);
	for i in 0 .. halflen {
		let x = temp[i];
		let y = temp[i + halflen] / ((((i as f64) + 0.5) * std::f64::consts::PI / (len as f64)).cos() * 2.0);
		vector[i] = x + y;
		vector[len - 1 - i] = x - y;
	}
}
