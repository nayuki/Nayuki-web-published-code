# 
# Concurrent programming with monitors (Python)
# by Project Nayuki, 2024. Public domain.
# https://www.nayuki.io/page/concurrent-programming-with-monitors
# 

from __future__ import annotations
import collections, random, threading, time
from typing import Generic, TypeVar


# Customizable parameters
_NUM_THREADS: int = 4
_MAX_DELAY_S: float = 10.0


# State variables
_start_time: float = time.time()
_queue: _Queue[int]


def main() -> None:
	global _queue
	_queue = _Queue(3)
	for i in range(_NUM_THREADS):
		threading.Thread(name=f"Worker{i}", target=_worker).start()


def _worker() -> None:
	while True:
		duration: float = random.uniform(0.0, _MAX_DELAY_S)
		_timestamped_print(f"Sleep {round(duration * 1000)} ms")
		time.sleep(duration)
		
		if random.random() < 0.5:
			val: int = random.randrange(10000)
			_queue.add(val)
		else:
			_queue.remove()


_print_lock: threading.Lock = threading.Lock()

def _timestamped_print(s: str) -> None:
	relativetime: float = time.time() - _start_time
	s = f"[{int(relativetime * 1000):5d} ms] {threading.current_thread().name} | {s}"
	with _print_lock:
		print(s)



_E = TypeVar("_E")

class _Queue(Generic[_E]):
	
	_limit: int
	_lock: threading.Lock
	_can_add: threading.Condition
	_can_remove: threading.Condition
	_data: collections.deque[_E]
	
	
	def __init__(self, limit: int):
		if limit < 1:
			raise ValueError()
		self._limit = limit
		self._lock = threading.Lock()
		self._can_add = threading.Condition(self._lock)
		self._can_remove = threading.Condition(self._lock)
		self._data = collections.deque()
	
	
	def add(self, val: _E) -> None:
		_timestamped_print(f"val={val} -> add() -> begin")
		with self._lock:
			while len(self._data) == self._limit:
				_timestamped_print(f"add() -> length={len(self._data)} -> wait")
				self._can_add.wait()
			self._data.append(val)
			self._can_remove.notify()
			_timestamped_print(f"add() -> length={len(self._data)-1} -> length={len(self._data)} -> end")
	
	
	def remove(self) -> _E:
		_timestamped_print("remove() -> begin")
		with self._lock:
			while len(self._data) == 0:
				_timestamped_print(f"remove() -> length={len(self._data)} -> wait")
				self._can_remove.wait()
			result: _E = self._data.popleft()
			self._can_add.notify()
			_timestamped_print(f"remove() -> val={result} -> length={len(self._data)+1} -> length={len(self._data)} -> end")
			return result



if __name__ == "__main__":
	main()
