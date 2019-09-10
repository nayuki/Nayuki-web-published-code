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

extern crate rand;
use rand::distributions::IndependentSample;
mod fast_dct8;
mod fast_dct_fft;
mod fast_dct_lee;
mod fft;
mod naive_dct;


fn main() {
	test_fast_dct_lee_vs_naive();
	test_fast_dct_lee_invertibility();
	test_fast_dct8_vs_naive();
	test_fast_dct_fft_vs_naive();
	test_fast_dct_fft_invertibility();
	println!("Test passed");
}


/*---- Test suite ----*/

fn test_fast_dct_lee_vs_naive() {
	let mut len = 1;
	while len <= (1 << 13) {
		let vector = random_vector(len);
		
		let expect = naive_dct::transform(&vector);
		let mut actual = vector.clone();
		fast_dct_lee::transform(&mut actual);
		assert_array_equals(&expect, &actual, EPSILON);
		
		let expect = naive_dct::inverse_transform(&vector);
		let mut actual = vector.clone();
		fast_dct_lee::inverse_transform(&mut actual);
		assert_array_equals(&expect, &actual, EPSILON);
		len *= 2;
	}
}


fn test_fast_dct_lee_invertibility() {
	let mut len = 1;
	while len <= (1 << 22) {
		let vector = random_vector(len);
		let mut temp = vector.clone();
		fast_dct_lee::transform(&mut temp);
		fast_dct_lee::inverse_transform(&mut temp);
		for x in temp.iter_mut() {
			*x /= (len as f64) / 2.0;
		}
		assert_array_equals(&vector, &temp, EPSILON);
		len *= 2;
	}
}


fn test_fast_dct8_vs_naive() {
	let vector = random_vector(8);
	
	let mut expect = naive_dct::transform(&vector);
	for (i, x) in expect.iter_mut().enumerate() {
		*x /= if i == 0 { (8.0f64).sqrt() } else { 2.0 };
	}
	let mut actual = vector.clone();
	fast_dct8::transform(&mut actual);
	assert_array_equals(&expect, &actual, EPSILON);
	
	let mut expect = vector.clone();
	for (i, x) in expect.iter_mut().enumerate() {
		*x /= if i == 0 { (2.0f64).sqrt() } else { 2.0 };
	}
	let expect = naive_dct::inverse_transform(&expect);
	let mut actual = vector.clone();
	fast_dct8::inverse_transform(&mut actual);
	assert_array_equals(&expect, &actual, EPSILON);
}


fn test_fast_dct_fft_vs_naive() {
	let mut prev: usize = 0;
	for i in 0i32 .. 101 {
		let len = (3000.0f64).powf(f64::from(i) / 100.0).round() as usize;
		if len <= prev {
			continue;
		}
		prev = len;
		let vector = random_vector(len);
		
		let expect = naive_dct::transform(&vector);
		let mut actual = vector.clone();
		fast_dct_fft::transform(&mut actual);
		assert_array_equals(&expect, &actual, EPSILON);
		
		let expect = naive_dct::inverse_transform(&vector);
		let mut actual = vector.clone();
		fast_dct_fft::inverse_transform(&mut actual);
		assert_array_equals(&expect, &actual, EPSILON);
	}
}


fn test_fast_dct_fft_invertibility() {
	let mut prev: usize = 0;
	for i in 0 .. 31 {
		let len = (1000000.0f64).powf(f64::from(i) / 30.0).round() as usize;
		if len <= prev {
			continue;
		}
		prev = len;
		let vector = random_vector(len);
		let mut temp = vector.clone();
		fast_dct_fft::transform(&mut temp);
		fast_dct_fft::inverse_transform(&mut temp);
		for x in temp.iter_mut() {
			*x /= (len as f64) / 2.0;
		}
		assert_array_equals(&vector, &temp, EPSILON);
	}
}



/*---- Utilities ----*/

fn random_vector(len: usize) -> Vec<f64> {
	let rng = &mut rand::thread_rng();
	let uniform = rand::distributions::range::Range::new(-1.0, 1.0);
	(0 .. len).map(|_| uniform.ind_sample(rng)).collect()
}


fn assert_array_equals(expect: &[f64], actual: &[f64], epsilon: f64) {
	assert_eq!(actual.len(), expect.len(), "Length mismatch");
	for (x, y) in actual.iter().zip(expect) {
		assert!((x - y).abs() < epsilon, "Value mismatch");
	}
}


const EPSILON: f64 = 1e-9;
