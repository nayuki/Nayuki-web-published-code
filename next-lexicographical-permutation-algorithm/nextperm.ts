/* 
 * Next lexicographical permutation algorithm (TypeScript)
 * by Project Nayuki, 2018. Public domain.
 * https://www.nayuki.io/page/next-lexicographical-permutation-algorithm
 */


/* Basic version */
/* 
 * Computes the next lexicographical permutation of the specified array of numbers in place,
 * returning whether a next permutation existed. (Returns false when the argument
 * is already the last possible permutation.)
 */
function nextPermutation(array: Array<number>): boolean {
	// Find non-increasing suffix
	let i: number = array.length - 1;
	while (i > 0 && array[i - 1] >= array[i])
		i--;
	if (i <= 0)
		return false;
	
	// Find successor to pivot
	let j: number = array.length - 1;
	while (array[j] <= array[i - 1])
		j--;
	let temp: number = array[i - 1];
	array[i - 1] = array[j];
	array[j] = temp;
	
	// Reverse suffix
	j = array.length - 1;
	while (i < j) {
		let temp: number = array[i];
		array[i] = array[j];
		array[j] = temp;
		i++;
		j--;
	}
	return true;
}

// Example:
//   arr = [0, 1, 0];
//   nextPermutation(arr);  (returns true)
//   arr has been modified to be [1, 0, 0]


/* Comparator version */
/* 
 * Computes the next lexicographical permutation of the specified array in place,
 * returning whether a next permutation existed. (Returns false when the argument
 * is already the last possible permutation.)
 * comp is a compare function - comp(x, y) returns a negative number if x is considered to be less than y,
 * a positive number if x is considered to be greater than y, or 0 if x is considered to be equal to y.
 */
function nextPermutationComparator<E>(array: Array<E>, comp: (x: E, y: E) => number): boolean {
	// Find non-increasing suffix
	let i: number = array.length - 1;
	while (i > 0 && comp(array[i - 1], array[i]) >= 0)
		i--;
	if (i <= 0)
		return false;
	
	// Find successor to pivot
	let j: number = array.length - 1;
	while (comp(array[j], array[i - 1]) <= 0)
		j--;
	let temp: E = array[i - 1];
	array[i - 1] = array[j];
	array[j] = temp;
	
	// Reverse suffix
	j = array.length - 1;
	while (i < j) {
		let temp: E = array[i];
		array[i] = array[j];
		array[j] = temp;
		i++;
		j--;
	}
	return true;
}
