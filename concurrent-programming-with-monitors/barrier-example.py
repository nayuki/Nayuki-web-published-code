# 
# Concurrent programming with monitors (Python)
# by Project Nayuki, 2024. Public domain.
# https://www.nayuki.io/page/concurrent-programming-with-monitors
# 

from __future__ import annotations
import random, threading, time


# Customizable parameters
_NUM_THREADS: int = 10
_MAX_DELAY_S: float = 10.0


# State variables
_start_time: float = time.time()
_barrier: _Barrier


def main() -> None:
	global _barrier
	_barrier = _Barrier(_NUM_THREADS)
	for i in range(_NUM_THREADS):
		threading.Thread(name=f"Worker{i}", target=_worker).start()


def _worker() -> None:
	duration: float = random.uniform(0.0, _MAX_DELAY_S)
	_timestamped_print(f"Sleep {round(duration * 1000)} ms")
	time.sleep(duration)
	_timestamped_print("Enter barrier")
	_barrier.wait()
	_timestamped_print("Exit barrier")


_print_lock: threading.Lock = threading.Lock()

def _timestamped_print(s: str) -> None:
	relativetime: float = time.time() - _start_time
	s = f"[{int(relativetime * 1000):5d} ms] {threading.current_thread().name} | {s}"
	with _print_lock:
		print(s)



class _Barrier:
	
	_lock: threading.Lock
	_cond: threading.Condition
	_count: int
	
	
	def __init__(self, initcount: int):
		self._lock = threading.Lock()
		self._cond = threading.Condition(self._lock)
		if initcount < 0:
			raise ValueError("Negative count")
		self._count = initcount
	
	
	def wait(self) -> None:
		with self._lock:
			if self._count == 0:
				raise RuntimeError("Barrier already reached zero")
			if self._count < 0:
				raise AssertionError()
			self._count -= 1
			if self._count == 0:
				self._cond.notify_all()
				return
			while self._count > 0:
				self._cond.wait()



if __name__ == "__main__":
	main()
