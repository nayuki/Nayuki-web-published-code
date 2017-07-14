/* 
 * Next lexicographical permutation algorithm (C++)
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/next-lexicographical-permutation-algorithm
 */

#include <algorithm>
#include <cstddef>
#include <vector>


/* 
 * (Template array version)
 * Computes the next lexicographical permutation of the specified array
 * of values in place, returning whether a next permutation existed.
 * (Returns false when the argument is already the last possible permutation.)
 */
template <typename T>
bool nextPermutation(T array[], std::size_t length) {
	// Find non-increasing suffix
	if (length == 0)
		return false;
	std::size_t i = length - 1;
	while (i > 0 && array[i - 1] >= array[i])
		i--;
	if (i == 0)
		return false;
	
	// Find successor to pivot
	std::size_t j = length - 1;
	while (array[j] <= array[i - 1])
		j--;
	std::swap(array[i - 1], array[j]);
	
	// Reverse suffix
	std::reverse(&array[i], array + length);
	return true;
}


/* 
 * (Template vector version)
 * Computes the next lexicographical permutation of the specified vector
 * of values in place, returning whether a next permutation existed.
 * (Returns false when the argument is already the last possible permutation.)
 */
template <typename T>
bool nextPermutation(std::vector<T> &vec) {
	// Find non-increasing suffix
	if (vec.size() == 0)
		return false;
	typename std::vector<T>::iterator i = vec.end() - 1;
	while (i > vec.begin() && *(i - 1) >= *i)
		--i;
	if (i == vec.begin())
		return false;
	
	// Find successor to pivot
	typename std::vector<T>::iterator j = vec.end() - 1;
	while (*j <= *(i - 1))
		--j;
	std::iter_swap(i - 1, j);
	
	// Reverse suffix
	std::reverse(i, vec.end());
	return true;
}
