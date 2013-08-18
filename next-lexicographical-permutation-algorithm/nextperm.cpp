/* 
 * Next lexicographical permutation algorithm (C++)
 * By Nayuki Minase, 2013. Public domain.
 * http://nayuki.eigenstate.org/page/next-lexicographical-permutation-algorithm
 */


/* Basic integer array version */
/* 
 * Computes the next lexicographical permutation of the specified array of integers in place,
 * returning whether a next permutation existed. (Returns false when the argument
 * is already the last possible permutation.)
 */
bool next_permutation(int *array, int length) {
	// Find non-increasing suffix
	int i = length - 1;
	while (i > 0 && array[i - 1] >= array[i])
		i--;
	if (i <= 0)
		return false;
	
	// Find successor to pivot
	int j = length - 1;
	while (array[j] <= array[i - 1])
		j--;
	int temp = array[i - 1];
	array[i - 1] = array[j];
	array[j] = temp;
	
	// Reverse suffix
	j = length - 1;
	while (i < j) {
		temp = array[i];
		array[i] = array[j];
		array[j] = temp;
		i++;
		j--;
	}
	return true;
}


/* Template version */
template <typename T>
bool next_permutation(T *array, int length) {
	// Find non-increasing suffix
	int i = length - 1;
	while (i > 0 && array[i - 1] >= array[i])
		i--;
	if (i <= 0)
		return false;
	
	// Find successor to pivot
	int j = length - 1;
	while (array[j] <= array[i - 1])
		j--;
	T temp = array[i - 1];
	array[i - 1] = array[j];
	array[j] = temp;
	
	// Reverse suffix
	j = length - 1;
	while (i < j) {
		temp = array[i];
		array[i] = array[j];
		array[j] = temp;
		i++;
		j--;
	}
	return true;
}
