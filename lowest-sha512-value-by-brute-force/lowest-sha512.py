# 
# Lowest SHA-512 value by brute force (Python)
# 
# Copyright (c) 2020 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/lowest-sha512-value-by-brute-force
# 

import hashlib, itertools


def main():
	# Configuration and constraints
	MSG_LEN = 12
	START_CHAR = ord("a")
	END_CHAR   = ord("z")
	assert isinstance(MSG_LEN, int) and MSG_LEN > 0
	assert isinstance(START_CHAR, int) and isinstance(END_CHAR, int)
	assert 0 <= START_CHAR < END_CHAR < 256
	
	# Initialize values
	message = bytearray([START_CHAR] * MSG_LEN)
	lowesthash = None
	
	# Test all (END_CHAR - START_CHAR + 1)^MSG_LEN possible messages
	for trials in itertools.count():
		# Hash message and compare with lowest
		hash = hashlib.sha512(message).hexdigest()
		if lowesthash is None or hash < lowesthash:
			lowesthash = hash
			print(f"Trial #{trials}:  sha512({message.decode('ASCII')}) = {hash[ : 24]}...")
		
		# Increment message. For example, "aa" -> "ab", "fnzz" -> "foaa".
		i = MSG_LEN - 1
		while i >= 0 and message[i] == END_CHAR:
			message[i] = START_CHAR
			i -= 1
		if i < 0:
			break
		message[i] += 1
	
	print("Search space exhausted")


if __name__ == "__main__":
	main()
