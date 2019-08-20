# 
# Lowest SHA-512 value by brute force (Python)
# 
# Copyright (c) 2019 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/lowest-sha512-value-by-brute-force
# 

import hashlib


def main():
	# Configuration
	MSG_LEN = 12  # Can be any positive integer
	START_CHAR = ord("a")  # Any integer in the range [0, 254]
	END_CHAR   = ord("z")  # Requires START_CHAR < END_CHAR <= 255
	
	# Initialize values
	message = bytearray([START_CHAR] * MSG_LEN)
	lowesthash = None
	trials = 0
	
	# Test all (END_CHAR - START_CHAR + 1)^MSG_LEN possible messages
	while True:
		# Hash message and compare with lowest
		hash = hashlib.sha512(message).hexdigest()
		if lowesthash is None or hash < lowesthash:
			print("Trial #{}:  sha512({}) = {}...".format(trials, message.decode("ASCII"), hash[ : 24]))
			lowesthash = hash
		
		# Increment message. For example, "aa" -> "ab", "fnzz" -> "foaa".
		i = MSG_LEN - 1
		while i >= 0 and message[i] == END_CHAR:
			message[i] = START_CHAR
			i -= 1
		if i < 0:
			break
		message[i] += 1
		trials += 1
	
	print("Search space exhausted")


if __name__ == "__main__":
	main()
