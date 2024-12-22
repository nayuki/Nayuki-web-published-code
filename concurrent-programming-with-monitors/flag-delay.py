# 
# Concurrent programming with monitors (Python)
# by Project Nayuki, 2024. Public domain.
# https://www.nayuki.io/page/concurrent-programming-with-monitors
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
		threading.Thread(name=f"Worker{i}", target=_worker).start()
	
	duration: float = random.uniform(0.0, _MAX_SET_DELAY_S)
	_timestamped_print(f"Sleep {round(duration * 1000)} ms")
	time.sleep(duration)
	
	_timestamped_print("Set true")
	with _lock:
		global _flag
		_flag = True


def _worker() -> None:
	while True:
		with _lock:
			if _flag:
				break
		
		duration: float = random.uniform(0.0, _MAX_CHECK_DELAY_S)
		_timestamped_print(f"Get false; sleep {round(duration * 1000)} ms")
		time.sleep(duration)
	
	_timestamped_print("Get true")


_print_lock: threading.Lock = threading.Lock()

def _timestamped_print(s: str) -> None:
	relativetime: float = time.time() - _start_time
	s = f"[{int(relativetime * 1000):5d} ms] {threading.current_thread().name} | {s}"
	with _print_lock:
		print(s)


if __name__ == "__main__":
	main()
