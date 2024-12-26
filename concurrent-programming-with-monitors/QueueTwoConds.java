/* 
 * Concurrent programming with monitors (Java)
 * by Project Nayuki, 2024. Public domain.
 * https://www.nayuki.io/page/concurrent-programming-with-monitors
 */

import java.util.LinkedList;
import java.util.Random;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;


public final class QueueTwoConds {
	
	// Customizable parameters
	private static final int NUM_THREADS = 4;
	private static final int MAX_DELAY_MS = 10_000;
	
	
	// State variables
	private static final long startTime = System.currentTimeMillis();
	private static Queue<Integer> queue = new Queue<>(3);
	
	
	public static void main(String[] args) {
		for (int i = 0; i < NUM_THREADS; i++)
			new Thread(QueueTwoConds::worker, "worker" + i).start();
	}
	
	
	private static void timestampedPrintf(String format, Object... args) {
		long time = System.currentTimeMillis() - startTime;
		var newArgs = new Object[args.length + 2];
		newArgs[0] = time;
		newArgs[1] = Thread.currentThread().getName();
		System.arraycopy(args, 0, newArgs, 2, args.length);
		synchronized(QueueTwoConds.class) {
			System.out.printf("[%5d ms] %s | " + format, newArgs);
		}
	}
	
	
	private static void worker() {
		try {
			while (true) {
				int duration = rand.nextInt(MAX_DELAY_MS);
				timestampedPrintf("Sleep %d ms%n", duration);
				Thread.sleep(duration);
				
				if (rand.nextDouble() < 0.5) {
					int val = rand.nextInt(10000);
					queue.add(val);
				} else {
					queue.remove();
				}
			}
		} catch (InterruptedException e) {
			throw new RuntimeException(e);
		}
	}
	
	
	private static Random rand = new Random();
	
	
	
	private static final class Queue<E> {
		
		private final int limit;
		private Lock lock = new ReentrantLock();
		private Condition canAdd = lock.newCondition();
		private Condition canRemove = lock.newCondition();
		private LinkedList<E> data = new LinkedList<>();
		
		
		public Queue(int limit) {
			if (limit < 1)
				throw new IllegalArgumentException();
			this.limit = limit;
		}
		
		
		public void add(E val) throws InterruptedException {
			timestampedPrintf("val=%d -> add() -> begin%n", val);
			lock.lock();
			try {
				while (data.size() == limit) {
					timestampedPrintf("add() -> length=%d -> wait%n", data.size());
					canAdd.await();
				}
				data.add(val);
				canRemove.signal();
				timestampedPrintf("add() -> length=%d -> length=%d -> end%n", data.size() - 1, data.size());
			} finally {
				lock.unlock();
			}
		}
		
		
		public E remove() throws InterruptedException {
			timestampedPrintf("remove() -> begin%n");
			lock.lock();
			try {
				while (data.isEmpty()) {
					timestampedPrintf("remove() -> length=%d -> wait%n", data.size());
					canRemove.await();
				}
				E result = data.remove();
				canAdd.signal();
				timestampedPrintf("remove() -> val=%d -> length=%d -> length=%d -> end%n", result, data.size() + 1, data.size());
				return result;
			} finally {
				lock.unlock();
			}
		}
		
	}
	
}
