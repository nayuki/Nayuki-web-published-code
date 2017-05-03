/* 
 * Next lexicographical permutation algorithm (C++)
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/next-lexicographical-permutation-algorithm
 */

#include <algorithm>
#include <cstddef>
#include <vector>


/* Basic integer array version */
/* 
 * Computes the next lexicographical permutation of the specified array of integers in place,
 * returning whether a next permutation existed. (Returns false when the argument
 * is already the last possible permutation.)
 */
bool next_permutation(int array[], size_t length) {
	// Find non-increasing suffix
	if (length == 0)
		return false;
	size_t i = length - 1;
	while (i > 0 && array[i - 1] >= array[i])
		i--;
	if (i == 0)
		return false;
	
	// Find successor to pivot
	size_t j = length - 1;
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


/* Template array version */
template <typename T>
bool next_permutation(T array[], size_t length) {
	// Find non-increasing suffix
	if (length == 0)
		return false;
	size_t i = length - 1;
	while (i > 0 && array[i - 1] >= array[i])
		i--;
	if (i == 0)
		return false;
	
	// Find successor to pivot
	size_t j = length - 1;
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


/* Template vector version */
template <typename T>
bool next_permutation(std::vector<T> &array) {
	// Find non-increasing suffix
	if (array.size() == 0)
		return false;
	typename std::vector<T>::iterator i = array.end() - 1;
	while (i > array.begin() && *(i - 1) >= *i)
		--i;
	if (i == array.begin())
		return false;
	
	// Find successor to pivot
	typename std::vector<T>::iterator j = array.end() - 1;
	while (*j <= *(i - 1))
		--j;
	std::iter_swap(i - 1, j);
	
	// Reverse suffix
	std::reverse(i, array.end());
	return true;
}
