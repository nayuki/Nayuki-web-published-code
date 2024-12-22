# 
# Concurrent programming with monitors (Python)
# by Project Nayuki, 2024. Public domain.
# https://www.nayuki.io/page/concurrent-programming-with-monitors
# 

from __future__ import annotations
import random, threading, time


# Customizable parameters
_NUM_THREADS: int = 5
_MAX_DELAY_S: float = 10.0


# State variables
_start_time: float = time.time()
_semaphore: _Semaphore


def main() -> None:
	global _semaphore
	_semaphore = _Semaphore()
	for i in range(_NUM_THREADS):
		threading.Thread(name=f"Worker{i}", target=_worker).start()
	
	duration: float = random.uniform(0.0, _MAX_DELAY_S)
	_timestamped_print(f"Sleep {round(duration * 1000)} ms")
	time.sleep(duration)
	cnt: int = _semaphore.increment(_NUM_THREADS)
	_timestamped_print(f"Increment (-> {cnt})")


def _worker() -> None:
	duration: float = random.uniform(0.0, _MAX_DELAY_S)
	_timestamped_print(f"Sleep {round(duration * 1000)} ms")
	time.sleep(duration)
	_timestamped_print("Decrement enter")
	cnt: int = _semaphore.decrement(1)
	_timestamped_print(f"Decrement exit (-> {cnt})")


_print_lock: threading.Lock = threading.Lock()

def _timestamped_print(s: str) -> None:
	relativetime: float = time.time() - _start_time
	s = f"[{int(relativetime * 1000):5d} ms] {threading.current_thread().name} | {s}"
	with _print_lock:
		print(s)



class _Semaphore:
	
	_lock: threading.Lock
	_cond: threading.Condition
	_count: int
	
	
	def __init__(self) -> None:
		self._lock = threading.Lock()
		self._cond = threading.Condition(self._lock)
		self._count = 0
	
	
	def increment(self, amount: int) -> int:
		if amount < 0:
			raise ValueError()
		with self._lock:
			self._count += amount
			self._cond.notify()
			return self._count
	
	
	def decrement(self, amount: int) -> int:
		if amount < 0:
			raise ValueError()
		with self._lock:
			if self._count < 0:
				raise AssertionError()
			while self._count < amount:
				self._cond.wait()
			self._count -= amount
			self._cond.notify()
			return self._count



if __name__ == "__main__":
	main()
