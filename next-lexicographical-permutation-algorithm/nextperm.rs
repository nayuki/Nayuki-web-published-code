/* 
 * Next lexicographical permutation algorithm (Rust)
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/next-lexicographical-permutation-algorithm
 */


fn next_permutation<T: std::cmp::Ord>(array: &mut [T]) -> bool {
	// Find non-increasing suffix
	if array.is_empty() {
		return false;
	}
	let mut i: usize = array.len() - 1;
	while i > 0 && array[i - 1] >= array[i] {
		i -= 1;
	}
	if i == 0 {
		return false;
	}
	
	// Find successor to pivot
	let mut j: usize = array.len() - 1;
	while array[j] <= array[i - 1] {
		j -= 1;
	}
	array.swap(i - 1, j);
	
	// Reverse suffix
	array[i .. ].reverse();
	true
}
