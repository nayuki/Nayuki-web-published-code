/* 
 * Next lexicographical permutation algorithm (C#)
 * by Project Nayuki, 2016. Public domain.
 * https://www.nayuki.io/page/next-lexicographical-permutation-algorithm
 */


public sealed class nextperm {
	
	// Computes the next lexicographical permutation of the given array
	// of integers in place, returning whether a next permutation existed.
	// (Returns false when the argument is already the last possible permutation.)
	public static bool NextPermutation(int[] array) {
		// Find non-increasing suffix
		int i = array.Length - 1;
		while (i > 0 && array[i - 1] >= array[i])
			i--;
		if (i <= 0)
			return false;
		
		// Find successor to pivot
		int j = array.Length - 1;
		while (array[j] <= array[i - 1])
			j--;
		int temp = array[i - 1];
		array[i - 1] = array[j];
		array[j] = temp;
		
		// Reverse suffix
		j = array.Length - 1;
		while (i < j) {
			temp = array[i];
			array[i] = array[j];
			array[j] = temp;
			i++;
			j--;
		}
		return true;
	}
	
}
