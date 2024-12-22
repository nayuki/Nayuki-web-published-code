/* 
 * Concurrent programming with monitors (Java)
 * by Project Nayuki, 2024. Public domain.
 * https://www.nayuki.io/page/concurrent-programming-with-monitors
 */

import java.util.Random;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;


public final class FlagDelay {
	
	// Customizable parameters
	private static final int NUM_WAITERS = 4;
	private static final int MAX_CHECK_DELAY_MS = 1_000;
	private static final int MAX_SET_DELAY_MS = 10_000;
	
	
	// State variables
	private static final long startTime = System.currentTimeMillis();
	private static Lock lock = new ReentrantLock();
	private static boolean flag = false;
	
	
	public static void main(String[] args) throws InterruptedException {
		for (int i = 0; i < NUM_WAITERS; i++)
			new Thread(FlagDelay::worker, "worker" + i).start();
		
		int duration = rand.nextInt(MAX_SET_DELAY_MS);
		timestampedPrintf("Sleep %d ms%n", duration);
		Thread.sleep(duration);
		
		lock.lock();
		try {
			timestampedPrintf("Set true%n");
			flag = true;
		} finally {
			lock.unlock();
		}
	}
	
	
	private static void worker() {
		try {
			while (true) {
				lock.lock();
				try {
					if (flag)
						break;
				} finally {
					lock.unlock();
				}
				
				int duration = rand.nextInt(MAX_CHECK_DELAY_MS);
				timestampedPrintf("Get false; sleep %d ms%n", duration);
				Thread.sleep(duration);
			}
		} catch (InterruptedException e) {
			throw new RuntimeException(e);
		}
		timestampedPrintf("Get true%n");
	}
	
	
	private static void timestampedPrintf(String format, Object... args) {
		long time = System.currentTimeMillis() - startTime;
		var newArgs = new Object[args.length + 2];
		newArgs[0] = time;
		newArgs[1] = Thread.currentThread().getName();
		System.arraycopy(args, 0, newArgs, 2, args.length);
		synchronized(FlagDelay.class) {
			System.out.printf("[%5d ms] %s | " + format, newArgs);
		}
	}
	
	
	private static Random rand = new Random();
	
}
