/* 
 * Concurrent programming with monitors (Java)
 * by Project Nayuki, 2024. Public domain.
 * https://www.nayuki.io/page/concurrent-programming-with-monitors
 */

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;


public final class CounterAtomic {
	
	// Customizable parameters
	private static final int NUM_THREADS = 2;
	private static final int ITERS_PER_THREAD = 1_000_000;
	
	
	// State variables
	private static AtomicInteger count = new AtomicInteger(0);
	
	
	public static void main(String[] args) throws InterruptedException {
		// Launch threads
		Set<Thread> threads = new HashSet<>();
		for (int i = 0; i < NUM_THREADS; i++)
			threads.add(new Thread(CounterAtomic::worker));
		long elapsedTime = -System.nanoTime();
		for (Thread th : threads)
			th.start();
		
		// Wait for threads to finish
		for (Thread th : threads)
			th.join();
		elapsedTime += System.nanoTime();
		System.out.printf("Actual count: %d%n", count.get());
		System.out.printf("Expected count: %d%n", NUM_THREADS * ITERS_PER_THREAD);
		System.out.printf("Elapsed time: %d ms%n", elapsedTime / 1_000_000);
	}
	
	
	private static void worker() {
		for (int i = 0; i < ITERS_PER_THREAD; i++)
			count.incrementAndGet();
	}
	
}
