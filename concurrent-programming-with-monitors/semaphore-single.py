# 
# Concurrent programming with monitors (Python)
# by Project Nayuki, 2024. Public domain.
# https://www.nayuki.io/page/concurrent-programming-with-monitors
# 

from __future__ import annotations
import random, threading, time


# Customizable parameters
_NUM_THREADS: int = 4
_MAX_DELAY_S: float = 10.0
_MAX_RUN_TIME_S: float = 100.0


# State variables
_start_time: float = time.time()
_semaphore: _Semaphore


def main() -> None:
	global _semaphore
	_semaphore = _Semaphore(1)
	for i in range(_NUM_THREADS):
		threading.Thread(name=f"Worker{i}", target=_worker).start()


def _worker() -> None:
	while time.time() - _start_time < _MAX_RUN_TIME_S:
		duration: float = random.uniform(0.0, _MAX_DELAY_S)
		_timestamped_print(f"Sleep {round(duration * 1000)} ms")
		time.sleep(duration)
		_timestamped_print("Decrement enter")
		cnt: int = _semaphore.decrement()
		_timestamped_print(f"Decrement exit (-> {cnt})")
		
		duration = random.uniform(0.0, _MAX_DELAY_S)
		_timestamped_print(f"Sleep {round(duration * 1000)} ms")
		time.sleep(duration)
		cnt = _semaphore.increment()
		_timestamped_print(f"Increment (-> {cnt})")


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
	
	
	def __init__(self, init: int):
		self._lock = threading.Lock()
		self._cond = threading.Condition(self._lock)
		if init < 0:
			raise ValueError()
		self._count = init
	
	
	def increment(self) -> int:
		with self._lock:
			self._count += 1
			self._cond.notify()
			return self._count
	
	
	def decrement(self) -> int:
		with self._lock:
			if self._count < 0:
				raise AssertionError()
			while self._count == 0:
				self._cond.wait()
			self._count -= 1
			return self._count



if __name__ == "__main__":
	main()
