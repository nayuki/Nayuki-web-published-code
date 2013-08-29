/* 
 * Next lexicographical permutation algorithm (Java)
 * By Nayuki Minase, 2013. Public domain.
 * http://nayuki.eigenstate.org/page/next-lexicographical-permutation-algorithm
 */

import java.util.Comparator;
import java.util.List;


public final class nextperm {
	
	/* Basic integer array version */
	/**
	 * Computes the next lexicographical permutation of the specified array of integers in place,
	 * returning whether a next permutation existed. (Returns {@code false} when the argument 
	 * is already the last possible permutation.)
	 * @param array the array of integers to permute
	 * @return whether the array was permuted to the next permutation
	 */
	public static boolean nextPermutation(int[] array) {
		// Find non-increasing suffix
		int i = array.length - 1;
		while (i > 0 && array[i - 1] >= array[i])
			i--;
		if (i <= 0)
			return false;
		
		// Find successor to pivot
		int j = array.length - 1;
		while (array[j] <= array[i - 1])
			j--;
		int temp = array[i - 1];
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
	
	
	/* Generic array version */
	public static <T extends Comparable<? super T>> boolean nextPermutation(T[] array) {
		// Find non-increasing suffix
		int i = array.length - 1;
		while (i > 0 && array[i - 1].compareTo(array[i]) >= 0)
			i--;
		if (i <= 0)
			return false;
		
		// Find successor to pivot
		int j = array.length - 1;
		while (array[j].compareTo(array[i - 1]) <= 0)
			j--;
		T temp = array[i - 1];
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
	
	
	/* Generic list version */
	public static <T extends Comparable<? super T>> boolean nextPermutation(List<T> array) {
		// Find non-increasing suffix
		int i = array.size() - 1;
		while (i > 0 && array.get(i - 1).compareTo(array.get(i)) >= 0)
			i--;
		if (i <= 0)
			return false;
		
		// Find successor to pivot
		int j = array.size() - 1;
		while (array.get(j).compareTo(array.get(i - 1)) <= 0)
			j--;
		T temp = array.get(i - 1);
		array.set(i - 1, array.get(j));
		array.set(j, temp);
		
		// Reverse suffix
		j = array.size() - 1;
		while (i < j) {
			temp = array.get(i);
			array.set(i, array.get(j));
			array.set(j, temp);
			i++;
			j--;
		}
		return true;
	}
	
	
	/* Generic list version with comparator */
	public static <T> boolean nextPermutation(List<T> array, Comparator<T> comp) {
		// Find non-increasing suffix
		int i = array.size() - 1;
		while (i > 0 && comp.compare(array.get(i - 1), array.get(i)) >= 0)
			i--;
		if (i <= 0)
			return false;
		
		// Find successor to pivot
		int j = array.size() - 1;
		while (comp.compare(array.get(j), array.get(i - 1)) <= 0)
			j--;
		T temp = array.get(i - 1);
		array.set(i - 1, array.get(j));
		array.set(j, temp);
		
		// Reverse suffix
		j = array.size() - 1;
		while (i < j) {
			temp = array.get(i);
			array.set(i, array.get(j));
			array.set(j, temp);
			i++;
			j--;
		}
		return true;
	}
	
}
