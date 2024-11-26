/* 
 * Concurrent programming with monitors (Java)
 * by Project Nayuki, 2024. Public domain.
 * https://www.nayuki.io/
 */

import java.util.Random;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;


public final class FlagCondition {
	
	// Customizable parameters
	private static final int NUM_WAITERS = 4;
	private static final int MAX_SET_DELAY_MS = 3_000;
	
	
	// State variables
	private static final long startTime = System.currentTimeMillis();
	private static Lock lock = new ReentrantLock();
	private static Condition cond = lock.newCondition();
	private static boolean flag = false;
	
	
	public static void main(String[] args) throws InterruptedException {
		for (int i = 0; i < NUM_WAITERS; i++)
			new Worker(i).start();
		
		int duration = rand.nextInt(MAX_SET_DELAY_MS);
		timestampedPrintf("Main | Sleep %d ms%n", duration);
		Thread.sleep(duration);
		
		timestampedPrintf("Main | Set true%n");
		lock.lock();
		try {
			flag = true;
			cond.signalAll();
		} finally {
			lock.unlock();
		}
	}
	
	
	private static void timestampedPrintf(String format, Object... args) {
		long time = System.currentTimeMillis() - startTime;
		var newArgs = new Object[args.length + 1];
		newArgs[0] = time;
		System.arraycopy(args, 0, newArgs, 1, args.length);
		synchronized(FlagCondition.class) {
			System.out.printf("[%5d ms] " + format, newArgs);
		}
	}
	
	
	private static Random rand = new Random();
	
	
	
	private static final class Worker extends Thread {
		
		private final int id;
		
		
		public Worker(int id) {
			this.id = id;
		}
		
		
		@Override public void run() {
			lock.lock();
			try {
				while (!flag) {
					printf("Get false; wait%n");
					cond.await();
				}
			} catch (InterruptedException e) {
				throw new RuntimeException(e);
			} finally {
				lock.unlock();
			}
			printf("Get true%n");
		}
		
		
		private void printf(String format, Object... args) {
			var newArgs = new Object[args.length + 1];
			newArgs[0] = id;
			System.arraycopy(args, 0, newArgs, 1, args.length);
			timestampedPrintf("Worker %d | " + format, newArgs);
		}
		
	}
	
}
