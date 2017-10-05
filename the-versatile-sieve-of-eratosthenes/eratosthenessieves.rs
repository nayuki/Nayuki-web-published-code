/* 
 * Variants of the sieve of Eratosthenes (Rust)
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
 */


pub fn sieve_primeness(limit: u32) -> Vec<bool> {
	check_limit(limit);
	let mut result = vec![true; (limit + 1) as usize];
	result[0] = false;
	if limit > 0 {
		result[1] = false;
	}
	
	let mut i: usize = 2;
	let end: usize = floor_sqrt(limit) as usize;
	while i <= end {
		if result[i] {
			let mut j: usize = i * i;
			let bound: usize = i.wrapping_neg();
			while j <= limit as usize {
				result[j] = false;
				if j >= bound {
					break;
				}
				j += i;
			}
		}
		i += 1;
	}
	result
}


pub fn sieve_smallest_prime_factor(limit: u32) -> Vec<u32> {
	check_limit(limit);
	let mut result = vec![0u32; (limit + 1) as usize];
	if limit > 0 {
		result[1] = 1;
	}
	
	let mut i: usize = 2;
	let sqrt: usize = floor_sqrt(limit) as usize;
	while i <= limit as usize {
		if result[i] == 0 {
			result[i] = i as u32;
			if i <= sqrt {
				let mut j: usize = i * i;
				let bound: usize = i.wrapping_neg();
				while j <= limit as usize {
					if result[j] == 0 {
						result[j] = i as u32;
					}
					if j >= bound {
						break;
					}
				j += i;
				}
			}
		}
		i += 1;
	}
	result
}


pub fn sieve_totient(limit: u32) -> Vec<u32> {
	check_limit(limit);
	let mut result: Vec<u32> = (0 .. (limit + 1)).collect();
	
	for i in 2 .. (limit + 1) as usize {
		if result[i] == i as u32 {
			let mut j: usize = i;
			let bound: usize = i.wrapping_neg();
			while j <= limit as usize {
				result[j] -= result[j] / (i as u32);
				if j >= bound {
					break;
				}
				j += i;
			}
		}
	}
	result
}


pub fn sieve_omega(limit: u32) -> Vec<u32> {
	check_limit(limit);
	let mut result = vec![0u32; (limit + 1) as usize];
	
	for i in 2 .. (limit + 1) as usize {
		if result[i] == 0 {
			let mut j: usize = i;
			let bound: usize = i.wrapping_neg();
			while j <= limit as usize {
				result[j] += 1;
				if j >= bound {
					break;
				}
				j += i;
			}
		}
	}
	result
}


pub fn sieve_radical(limit: u32) -> Vec<u32> {
	check_limit(limit);
	let mut result = vec![1u32; (limit + 1) as usize];
	result[0] = 0;
	
	for i in 2 .. (limit + 1) as usize {
		if result[i] == 1 {
			let mut j: usize = i;
			let bound: usize = i.wrapping_neg();
			while j <= limit as usize {
				result[j] *= i as u32;
				if j >= bound {
					break;
				}
				j += i;
			}
		}
	}
	result
}


// Helper function: y = floor(sqrt(x)).
fn floor_sqrt(x: u32) -> u32 {
	let mut y: u32 = 0;
	let mut i: u32 = 1u32 << 15;
	while i != 0 {
		y |= i;
		if y * y > x {
			y ^= i;
		}
		i >>= 1;
	}
	y
}


// Helper function: Panics iff limit + 1 > min(u32::MAX, usize::MAX).
fn check_limit(limit: u32) {
	let sizenarrower: bool = 0usize.count_zeros() < 0u32.count_zeros();
	let upperbound: u32 = if sizenarrower { std::usize::MAX as u32 } else { std::u32::MAX };
	if limit >= upperbound {
		panic!("Limit too large");
	}
}
