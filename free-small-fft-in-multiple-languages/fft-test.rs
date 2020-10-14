/* 
 * FFT and convolution test (Rust)
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
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

extern crate rand;
use rand::distributions::IndependentSample;
mod fft;


/*---- Main and test functions ----*/

fn main() {
	let mut maxlogerr: f64 = std::f64::NEG_INFINITY;
	{
		let mut update_error = |err: f64| maxlogerr = maxlogerr.max(err);
		
		// Test power-of-2 size FFTs
		for i in 0 .. 13 {
			update_error(test_fft(1usize << i));
		}
		
		// Test small size FFTs
		for i in 0 .. 30 {
			update_error(test_fft(i));
		}
		
		// Test diverse size FFTs
		let mut prev: usize = 0;
		for i in 0i32 .. 101 {
			let n: usize = (1500.0f64).powf(f64::from(i) / 100.0).round() as usize;
			if n > prev {
				update_error(test_fft(n));
				prev = n;
			}
		}
		
		// Test power-of-2 size convolutions
		for i in 0 .. 13 {
			update_error(test_convolution(1usize << i));
		}
		
		// Test diverse size convolutions
		let mut prev: usize = 0;
		for i in 0i32 .. 101 {
			let n: usize = (1500.0f64).powf(f64::from(i) / 100.0).round() as usize;
			if n > prev {
				update_error(test_convolution(n));
				prev = n;
			}
		}
	}
	
	println!();
	println!("Max log err = {:.1}", maxlogerr);
	println!("Test {}", if maxlogerr < -10.0 { "passed" } else { "failed" });
}


fn test_fft(size: usize) -> f64 {
	let inputreal: Vec<f64> = random_reals(size);
	let inputimag: Vec<f64> = random_reals(size);
	
	let (expectreal, expectimag): (Vec<f64>,Vec<f64>) =
		naive_dft(&inputreal, &inputimag, false);
	
	let mut actualreal: Vec<f64> = inputreal.clone();
	let mut actualimag: Vec<f64> = inputimag.clone();
	fft::transform(&mut actualreal, &mut actualimag);
	let mut err: f64 = log10_rms_err(&expectreal, &expectimag, &actualreal, &actualimag);
	
	for x in actualreal.iter_mut() {
		*x /= size as f64;
	}
	for x in actualimag.iter_mut() {
		*x /= size as f64;
	}
	fft::inverse_transform(&mut actualreal, &mut actualimag);
	err = log10_rms_err(&inputreal, &inputimag, &actualreal, &actualimag).max(err);
	println!("fftsize={:4}  logerr={:5.1}", size, err);
	err
}


fn test_convolution(size: usize) -> f64 {
	let input0real: Vec<f64> = random_reals(size);
	let input0imag: Vec<f64> = random_reals(size);
	let input1real: Vec<f64> = random_reals(size);
	let input1imag: Vec<f64> = random_reals(size);
	
	let (expectreal, expectimag): (Vec<f64>,Vec<f64>) =
		naive_convolve(&input0real, &input0imag, &input1real, &input1imag);
	
	let (actualreal, actualimag) = fft::convolve_complex(input0real, input0imag, input1real, input1imag);
	
	let err: f64 = log10_rms_err(&expectreal, &expectimag, &actualreal, &actualimag);
	println!("convsize={:4}  logerr={:5.1}", size, err);
	err
}


/*---- Naive reference computation functions ----*/

fn naive_dft(inreal: &[f64], inimag: &[f64], inverse: bool) -> (Vec<f64>,Vec<f64>) {
	let n: usize = inreal.len();
	assert_eq!(inreal.len(), n);
	let mut outreal = vec![0.0f64; n];
	let mut outimag = vec![0.0f64; n];
	
	let coef: f64 = if inverse { 2.0 } else { -2.0 } * std::f64::consts::PI;
	for k in 0 .. n {  // For each output element
		let mut sumreal: f64 = 0.0;
		let mut sumimag: f64 = 0.0;
		for t in 0 .. n {  // For each input element
			let temp: u64 = (t as u64) * (k as u64) % (n as u64);  // This is more accurate than t * k
			let angle: f64 = coef * (temp as f64) / (n as f64);
			sumreal += inreal[t] * angle.cos() - inimag[t] * angle.sin();
			sumimag += inreal[t] * angle.sin() + inimag[t] * angle.cos();
		}
		outreal[k] = sumreal;
		outimag[k] = sumimag;
	}
	(outreal, outimag)
}


fn naive_convolve(
		xreal: &[f64], ximag: &[f64],
		yreal: &[f64], yimag: &[f64])
		-> (Vec<f64>,Vec<f64>) {
	
	let n: usize = xreal.len();
	assert_eq!(ximag.len(), n);
	assert_eq!(yreal.len(), n);
	assert_eq!(yimag.len(), n);
	
	let mut outreal = vec![0.0f64; n];
	let mut outimag = vec![0.0f64; n];
	for i in 0 .. n {
		for j in 0 .. n {
			let k: usize = (i + j) % n;
			outreal[k] += xreal[i] * yreal[j] - ximag[i] * yimag[j];
			outimag[k] += xreal[i] * yimag[j] + ximag[i] * yreal[j];
		}
	}
	(outreal, outimag)
}


/*---- Utility functions ----*/

fn log10_rms_err(
		xreal: &[f64], ximag: &[f64],
		yreal: &[f64], yimag: &[f64]) -> f64 {
	
	let n: usize = xreal.len();
	assert_eq!(ximag.len(), n);
	assert_eq!(yreal.len(), n);
	assert_eq!(yimag.len(), n);
	
	let mut err: f64 = (10.0f64).powf(-99.0 * 2.0);
	for i in 0 .. n {
		let real: f64 = xreal[i] - yreal[i];
		let imag: f64 = ximag[i] - yimag[i];
		err += real * real + imag * imag;
	}
	// Calculate root mean square (RMS) error
	err /= std::cmp::max(n, 1) as f64;
	err.sqrt().log10()
}


fn random_reals(size: usize) -> Vec<f64> {
	let rng = &mut rand::thread_rng();
	let uniform = rand::distributions::range::Range::new(-1.0, 1.0);
	(0 .. size).map(|_| uniform.ind_sample(rng)).collect()
}
