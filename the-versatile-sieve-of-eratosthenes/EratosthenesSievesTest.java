/* 
 * Test of variants of the sieve of Eratosthenes (Java)
 * by Project Nayuki, 2016. Public domain.
 * https://www.nayuki.io/page/the-versatile-sieve-of-eratosthenes
 */

import org.junit.Test;
import org.junit.Assert;


public final class EratosthenesSievesTest {
	
	@Test public void testValues() {
		Assert.assertArrayEquals(new boolean[]{false, false, true, true, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false, true, false, false, false, true, false, false, false, false, false, true, false}, EratosthenesSieves.sievePrimeness(30));
		Assert.assertArrayEquals(new int[]{0, 1, 2, 3, 2, 5, 2, 7, 2, 3, 2, 11, 2, 13, 2, 3, 2, 17, 2, 19, 2, 3, 2, 23, 2, 5, 2, 3, 2, 29, 2}, EratosthenesSieves.sieveSmallestPrimeFactor(30));
		Assert.assertArrayEquals(new int[]{0, 1, 1, 2, 2, 4, 2, 6, 4, 6, 4, 10, 4, 12, 6, 8, 8, 16, 6, 18, 8, 12, 10, 22, 8, 20, 12, 18, 12, 28, 8}, EratosthenesSieves.sieveTotient(30));
		Assert.assertArrayEquals(new int[]{0, 0, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 2, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2, 1, 3}, EratosthenesSieves.sieveOmega(30));
		Assert.assertArrayEquals(new int[]{0, 1, 2, 3, 2, 5, 6, 7, 2, 3, 10, 11, 6, 13, 14, 15, 2, 17, 6, 19, 10, 21, 22, 23, 6, 5, 26, 3, 14, 29, 30}, EratosthenesSieves.sieveRadical(30));
	}
	
	
	@Test public void testPrefixConsistency() {
		final int N = 10000;
		{
			boolean[] prev = {};
			for (int i = 0; i < N; i++) {
				boolean[] cur = EratosthenesSieves.sievePrimeness(i);
				Assert.assertEquals(prev.length + 1, cur.length);
				for (int j = 0; j < prev.length; j++)
					Assert.assertTrue(cur[j] == prev[j]);
				prev = cur;
			}
		}
		{
			IntSieve[] FUNCS = {
				EratosthenesSieves::sieveSmallestPrimeFactor,
				EratosthenesSieves::sieveTotient,
				EratosthenesSieves::sieveOmega,
				EratosthenesSieves::sieveRadical,
			};
			for (IntSieve func : FUNCS) {
				int[] prev = {};
				for (int i = 0; i < N; i++) {
					int[] cur = func.sieve(i);
					Assert.assertEquals(prev.length + 1, cur.length);
					for (int j = 0; j < prev.length; j++)
						Assert.assertEquals(prev[j], cur[j]);
					prev = cur;
				}
			}
		}
	}
	
	
	
	private interface IntSieve {
		public int[] sieve(int limit);
	}
	
}
