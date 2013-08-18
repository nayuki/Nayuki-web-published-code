/* 
 * Next lexicographical permutation algorithm (C)
 * By Nayuki Minase, 2013. Public domain.
 * http://nayuki.eigenstate.org/page/next-lexicographical-permutation-algorithm
 */


/* Basic integer array version */
/* 
 * Computes the next lexicographical permutation of the specified array of integers in place,
 * returning a Boolean to indicate whether a next permutation existed.
 * (Returns false when the argument is already the last possible permutation.)
 */
int next_permutation(int *array, int length) {
	int i, j;
	int temp;
	
	// Find non-increasing suffix
	i = length - 1;
	while (i > 0 && array[i - 1] >= array[i])
		i--;
	if (i <= 0)
		return 0;
	
	// Find successor to pivot
	j = length - 1;
	while (array[j] <= array[i - 1])
		j--;
	temp = array[i - 1];
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
	return 1;
}


/* Large integer array version */
int next_permutation(int *array, unsigned int length) {
	unsigned int i, j;
	int temp;
	
	// Find non-increasing suffix
	if (length == 0)
		return 0;
	i = length - 1;
	while (i > 0 && array[i - 1] >= array[i])
		i--;
	if (i == 0)
		return 0;
	
	// Find successor to pivot
	j = length - 1;
	while (array[j] <= array[i - 1])
		j--;
	temp = array[i - 1];
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
	return 1;
}
