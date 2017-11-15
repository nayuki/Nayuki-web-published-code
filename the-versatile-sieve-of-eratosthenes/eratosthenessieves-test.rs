/* 
 * Test of variants of the sieve of Eratosthenes (Rust)
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
 */

mod eratosthenessieves;


fn main() {
	test_values();
	test_prefix_consistency(eratosthenessieves::sieve_primeness);
	test_prefix_consistency(eratosthenessieves::sieve_smallest_prime_factor);
	test_prefix_consistency(eratosthenessieves::sieve_totient);
	test_prefix_consistency(eratosthenessieves::sieve_omega);
	test_prefix_consistency(eratosthenessieves::sieve_radical);
	println!("Test passed");
}


fn test_values() {
	let expect = vec![false, false, true, true, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false, false, false, false, false, true, false];
	let actual = eratosthenessieves::sieve_primeness((expect.len() - 1) as u32);
	assert_equals(&expect, &actual);
	
	let expect = vec![0u32, 1, 2, 3, 2, 5, 2, 7, 2, 3, 2, 11, 2, 13, 2, 3, 2, 17, 2, 19, 2, 3, 2, 23, 2, 5, 2, 3, 2, 29, 2];
	let actual = eratosthenessieves::sieve_smallest_prime_factor((expect.len() - 1) as u32);
	assert_equals(&expect, &actual);
	
	let expect = vec![0u32, 1, 1, 2, 2, 4, 2, 6, 4, 6, 4, 10, 4, 12, 6, 8, 8, 16, 6, 18, 8, 12, 10, 22, 8, 20, 12, 18, 12, 28, 8];
	let actual = eratosthenessieves::sieve_totient((expect.len() - 1) as u32);
	assert_equals(&expect, &actual);
	
	let expect = vec![0u32, 0, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2, 1, 3];
	let actual = eratosthenessieves::sieve_omega((expect.len() - 1) as u32);
	assert_equals(&expect, &actual);
	
	let expect = vec![0u32, 1, 2, 3, 2, 5, 6, 7, 2, 3, 10, 11, 6, 13, 14, 15, 2, 17, 6, 19, 10, 21, 22, 23, 6, 5, 26, 3, 14, 29, 30];
	let actual = eratosthenessieves::sieve_radical((expect.len() - 1) as u32);
	assert_equals(&expect, &actual);
}


fn test_prefix_consistency<T: std::cmp::PartialEq>(func: fn(u32) -> Vec<T>) {
	let n: u32 = 10000;
	let mut prev = Vec::<T>::new();
	for i in 0 .. n {
		let cur: Vec<T> = func(i);
		for j in 0 .. i {
			assert_equals(&prev[j as usize], &cur[j as usize]);
		}
		prev = cur;
	}
}


fn assert_equals<T: std::cmp::PartialEq>(expect: &T, actual: &T) {
	if actual != expect {
		panic!("Mismatch");
	}
}
