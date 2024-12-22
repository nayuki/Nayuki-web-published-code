/* 
 * Concurrent programming with monitors (Java)
 * by Project Nayuki, 2024. Public domain.
 * https://www.nayuki.io/page/concurrent-programming-with-monitors
 */

import java.util.Random;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;


public final class BarrierExtrinsic {
	
	// Customizable parameters
	private static final int NUM_THREADS = 10;
	private static final int MAX_DELAY_MS = 10_000;
	
	
	// State variables
	private static final long startTime = System.currentTimeMillis();
	private static Barrier barrier = new Barrier(NUM_THREADS);
	
	
	public static void main(String[] args) {
		for (int i = 0; i < NUM_THREADS; i++)
			new Thread(BarrierExtrinsic::worker, "worker" + i).start();
	}
	
	
	private static void worker() {
		try {
			int duration = rand.nextInt(MAX_DELAY_MS);
			timestampedPrintf("Sleep %d ms%n", duration);
			Thread.sleep(duration);
			timestampedPrintf("Enter barrier%n");
			barrier.join();
			timestampedPrintf("Exit barrier%n");
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
		synchronized(BarrierExtrinsic.class) {
			System.out.printf("[%5d ms] %s | " + format, newArgs);
		}
	}
	
	
	private static Random rand = new Random();
	
	
	
	private static final class Barrier {
		
		private Lock lock = new ReentrantLock();
		private Condition cond = lock.newCondition();
		private int count;
		
		
		public Barrier(int initCount) {
			if (initCount < 0)
				throw new IllegalArgumentException("Negative count");
			count = initCount;
		}
		
		
		public void join() throws InterruptedException {
			lock.lock();
			try {
				if (count == 0)
					throw new IllegalStateException("Barrier already reached zero");
				if (count < 0)
					throw new AssertionError();
				count--;
				if (count == 0) {
					cond.signalAll();
					return;
				}
				while (count > 0)
					cond.await();
			} finally {
				lock.unlock();
			}
		}
		
	}
	
}
