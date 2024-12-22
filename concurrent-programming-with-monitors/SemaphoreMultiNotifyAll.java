/* 
 * Concurrent programming with monitors (Java)
 * by Project Nayuki, 2024. Public domain.
 * https://www.nayuki.io/page/concurrent-programming-with-monitors
 */

import java.util.Random;


public final class SemaphoreMultiNotifyAll {
	
	// Customizable parameters
	private static final int NUM_THREADS = 5;
	private static final int MAX_DELAY_MS = 10_000;
	
	
	// State variables
	private static final long startTime = System.currentTimeMillis();
	private static Semaphore semaphore = new Semaphore(0);
	
	
	public static void main(String[] args) throws InterruptedException {
		for (int i = 0; i < NUM_THREADS; i++)
			new Thread(SemaphoreMultiNotifyAll::worker, "worker" + i).start();
		
		int duration = rand.nextInt(MAX_DELAY_MS);
		timestampedPrintf("Sleep %d ms%n", duration);
		Thread.sleep(duration);
		int cnt = semaphore.increment(NUM_THREADS);
		timestampedPrintf("Increment (-> %d)%n", cnt);
	}
	
	
	private static void worker() {
		try {
			int duration = rand.nextInt(MAX_DELAY_MS);
			timestampedPrintf("Sleep %d ms%n", duration);
			Thread.sleep(duration);
			timestampedPrintf("Decrement enter%n");
			int cnt = semaphore.decrement(1);
			timestampedPrintf("Decrement exit (-> %d)%n", cnt);
		} catch (InterruptedException e) {
			throw new RuntimeException(e);
		}
	}
	
	
	private static void timestampedPrintf(String format, Object... args) {
		long time = System.currentTimeMillis() - startTime;
		var newArgs = new Object[args.length + 2];
		newArgs[0] = time;
		newArgs[1] = Thread.currentThread().getName();
		System.arraycopy(args, 0, newArgs, 2, args.length);
		synchronized(SemaphoreMultiNotifyAll.class) {
			System.out.printf("[%5d ms] %s | " + format, newArgs);
		}
	}
	
	
	private static Random rand = new Random();
	
	
	
	private static final class Semaphore {
		
		private int count;
		
		
		public Semaphore(int init) {
			count = init;
		}
		
		
		public synchronized int increment(int amount) {
			if (amount < 0)
				throw new IllegalArgumentException();
			count = Math.addExact(count, amount);
			notifyAll();
			return count;
		}
		
		
		public synchronized int decrement(int amount) throws InterruptedException {
			if (amount < 0)
				throw new IllegalArgumentException();
			if (count < 0)
				throw new AssertionError();
			while (count < amount)
				wait();
			count -= amount;
			return count;
		}
		
	}
	
}
