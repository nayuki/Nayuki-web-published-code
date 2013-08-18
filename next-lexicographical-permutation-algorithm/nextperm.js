/* 
 * Next lexicographical permutation algorithm (JavaScript)
 * By Nayuki Minase, 2013. Public domain.
 * http://nayuki.eigenstate.org/page/next-lexicographical-permutation-algorithm
 */


/* 
 * Computes the next lexicographical permutation of the specified array of numbers in place,
 * returning whether a next permutation existed. (Returns false when the argument
 * is already the last possible permutation.)
 */
function nextPermutation(array) {
	// Find non-increasing suffix
	var i = array.length - 1;
	while (i > 0 && array[i - 1] >= array[i])
		i--;
	if (i <= 0)
		return false;
	
	// Find successor to pivot
	var j = array.length - 1;
	while (array[j] <= array[i - 1])
		j--;
	var temp = array[i - 1];
	array[i - 1] = array[j];
	array[j] = temp;
	
	// Reverse suffix
	j = array.length - 1;
	while (i < j) {
		temp = array[i];
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
