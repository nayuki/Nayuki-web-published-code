/* 
 * Concurrent programming with monitors (Java)
 * by Project Nayuki, 2024. Public domain.
 * https://www.nayuki.io/page/concurrent-programming-with-monitors
 */

import java.util.Random;


public final class SemaphoreSingle {
	
	// Customizable parameters
	private static final int NUM_THREADS = 4;
	private static final int MAX_DELAY_MS = 10_000;
	private static final int MAX_RUN_TIME_MS = 100_000;
	
	
	// State variables
	private static final long startTime = System.currentTimeMillis();
	private static Semaphore semaphore = new Semaphore(1);
	
	
	public static void main(String[] args) throws InterruptedException {
		for (int i = 0; i < NUM_THREADS; i++)
			new Thread(SemaphoreSingle::worker, "worker" + i).start();
	}
	
	
	private static void worker() {
		try {
			while (System.currentTimeMillis() - startTime < MAX_RUN_TIME_MS) {
				int duration = rand.nextInt(MAX_DELAY_MS);
				timestampedPrintf("Sleep %d ms%n", duration);
				Thread.sleep(duration);
				timestampedPrintf("Decrement enter%n");
				int cnt = semaphore.decrement();
				timestampedPrintf("Decrement exit (-> %d)%n", cnt);
				
				duration = rand.nextInt(MAX_DELAY_MS);
				timestampedPrintf("Sleep %d ms%n", duration);
				Thread.sleep(duration);
				cnt = semaphore.increment();
				timestampedPrintf("Increment (-> %d)%n", cnt);
			}
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
		synchronized(SemaphoreSingle.class) {
			System.out.printf("[%5d ms] %s | " + format, newArgs);
		}
	}
	
	
	private static Random rand = new Random();
	
	
	
	private static final class Semaphore {
		
		private int count;
		
		
		public Semaphore(int init) {
			if (init < 0)
				throw new IllegalArgumentException();
			count = init;
		}
		
		
		public synchronized int increment() {
			count = Math.addExact(count, 1);
			notify();
			return count;
		}
		
		
		public synchronized int decrement() throws InterruptedException {
			if (count < 0)
				throw new AssertionError();
			while (count == 0)
				wait();
			count--;
			return count;
		}
		
	}
	
}
