/* 
 * Test of variants of the sieve of Eratosthenes (C#)
 * by Project Nayuki, 2017. Public domain.
 * https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
 */

using System;


public sealed class EratosthenesSievesTest {
	
	/*---- Test suite ----*/
	
	public static void Main(string[] args) {
		testValues();
		testPrefixConsistency();
		Console.WriteLine("Test passed");
	}
	
	
	private static void testValues() {
		assertArrayEquals(new bool[]{false, false, true, true, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false, false, false, false, false, true, false}, EratosthenesSieves.SievePrimeness(30));
		assertArrayEquals(new int[]{0, 1, 2, 3, 2, 5, 2, 7, 2, 3, 2, 11, 2, 13, 2, 3, 2, 17, 2, 19, 2, 3, 2, 23, 2, 5, 2, 3, 2, 29, 2}, EratosthenesSieves.SieveSmallestPrimeFactor(30));
		assertArrayEquals(new int[]{0, 1, 1, 2, 2, 4, 2, 6, 4, 6, 4, 10, 4, 12, 6, 8, 8, 16, 6, 18, 8, 12, 10, 22, 8, 20, 12, 18, 12, 28, 8}, EratosthenesSieves.SieveTotient(30));
		assertArrayEquals(new int[]{0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2, 1, 3}, EratosthenesSieves.SieveOmega(30));
		assertArrayEquals(new int[]{0, 1, 2, 3, 2, 5, 6, 7, 2, 3, 10, 11, 6, 13, 14, 15, 2, 17, 6, 19, 10, 21, 22, 23, 6, 5, 26, 3, 14, 29, 30}, EratosthenesSieves.SieveRadical(30));
	}
	
	
	private static void testPrefixConsistency() {
		const int N = 10000;
		{
			bool[] prev = {};
			for (int i = 0; i < N; i++) {
				bool[] cur = EratosthenesSieves.SievePrimeness(i);
				assertEquals(prev.Length + 1, cur.Length);
				for (int j = 0; j < prev.Length; j++)
					assertEquals(cur[j], prev[j]);
				prev = cur;
			}
		}
		{
			IntSieve[] FUNCS = {
				EratosthenesSieves.SieveSmallestPrimeFactor,
				EratosthenesSieves.SieveTotient,
				EratosthenesSieves.SieveOmega,
				EratosthenesSieves.SieveRadical,
			};
			foreach (IntSieve func in FUNCS) {
				int[] prev = {};
				for (int i = 0; i < N; i++) {
					int[] cur = func(i);
					assertEquals(prev.Length + 1, cur.Length);
					for (int j = 0; j < prev.Length; j++)
						assertEquals(prev[j], cur[j]);
					prev = cur;
				}
			}
		}
	}
	
	private delegate int[] IntSieve(int limit);
	
	
	
	/*---- Utility functions ----*/
	
	private static void assertArrayEquals(bool[] expected, bool[] actual) {
		if (expected.Length != actual.Length)
			throw new SystemException("Array lengths unequal");
		for (int i = 0; i < expected.Length; i++)
			assertEquals(expected[i], actual[i]);
	}
	
	private static void assertArrayEquals(int[] expected, int[] actual) {
		if (expected.Length != actual.Length)
			throw new SystemException("Array lengths unequal");
		for (int i = 0; i < expected.Length; i++)
			assertEquals(expected[i], actual[i]);
	}
	
	
	private static void assertEquals(bool expected, bool actual) {
		if (expected != actual)
			throw new SystemException("Values differ");
	}
	
	private static void assertEquals(int expected, int actual) {
		if (expected != actual)
			throw new SystemException("Values differ");
	}
	
}
