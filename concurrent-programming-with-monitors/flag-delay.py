# 
# Concurrent programming with monitors (Python)
# by Project Nayuki, 2024. Public domain.
# https://www.nayuki.io/
# 

import random, threading, time


# Customizable parameters
_NUM_WAITERS: int = 4
_MAX_CHECK_DELAY_S: float = 1.0
_MAX_SET_DELAY_S: float = 10.0


# State variables
_start_time: float = time.time()
_lock: threading.Lock = threading.Lock()
_flag: bool = False


def main() -> None:
	for i in range(_NUM_WAITERS):
		threading.Thread(target=_worker, args=[i]).start()
	
	duration: float = random.uniform(0.0, _MAX_SET_DELAY_S)
	_timestamped_print(f"Main | Sleep {round(duration * 1000)} ms")
	time.sleep(duration)
	
	_timestamped_print("Main | Set true")
	with _lock:
		global _flag
		_flag = True


def _worker(id: int) -> None:
	def print(s: str) -> None:
		_timestamped_print(f"Worker {id} | {s}")
	
	while True:
		with _lock:
			if _flag:
				break
		
		duration: float = random.uniform(0.0, _MAX_CHECK_DELAY_S)
		print(f"Get false; sleep {round(duration * 1000)} ms")
		time.sleep(duration)
	
	print("Get true")


_print_lock: threading.Lock = threading.Lock()

def _timestamped_print(s: str) -> None:
	relativetime: float = time.time() - _start_time
	s = f"[{int(relativetime * 1000):5d} ms] " + s
	with _print_lock:
		print(s)


if __name__ == "__main__":
	main()
