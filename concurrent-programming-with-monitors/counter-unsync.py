# 
# Concurrent programming with monitors (Python)
# by Project Nayuki, 2024. Public domain.
# https://www.nayuki.io/
# 

import threading, time


# Customizable parameters
_NUM_THREADS: int = 2
_ITERS_PER_THREAD: int = 1_000_000


# State variables
_count: int = 0


def main() -> None:
	# Launch threads
	threads: set[threading.Thread] = {threading.Thread(target=_worker) for _ in range(_NUM_THREADS)}
	elapsedtime: float = -time.time()
	for th in threads:
		th.start()
	
	# Wait for threads to finish
	for th in threads:
		th.join()
	elapsedtime += time.time()
	print(f"Actual count: {_count}")
	print(f"Expected count: {_NUM_THREADS * _ITERS_PER_THREAD}")
	print(f"Elapsed time: {round(elapsedtime * 1000)} ms")


def _worker() -> None:
	global _count
	for _ in range(_ITERS_PER_THREAD):
		# Obfuscate the logic because some Python interpreters
		# appear to calculate correctly when writing `_count += 1`
		temp: int = _count + 1
		_count = int(str(temp))


if __name__ == "__main__":
	main()
