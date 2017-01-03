# 
# Reed-Solomon error-correcting code decoder
# 
# Copyright (c) 2017 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/reed-solomon-error-correcting-code-decoder
# 

import random, time
import fieldmath, reedsolomon


# Runs a bunch of demos and tests, printing information to standard output.
def main():
	show_example()
	test_correctness()


# Shows an example of encoding a message, and decoding a codeword containing errors.
def show_example():
	# Configurable parameters
	field = fieldmath.BinaryField(0x11D)
	generator = 0x02
	msglen = 8
	ecclen = 5
	rs = reedsolomon.ReedSolomon(field, generator, msglen, ecclen)
	
	# Generate random message
	message = [random.randrange(field.size) for _ in range(msglen)]
	print("Original message: {}".format(message))
	
	# Encode message to produce codeword
	codeword = rs.encode(message)
	print("Encoded codeword: {}".format(codeword))
	
	# Perturb some values in the codeword
	probability = float(ecclen // 2) / (msglen + ecclen)
	perturbed = 0
	for i in range(len(codeword)):
		if random.random() < probability:
			codeword[i] ^= random.randrange(1, field.size)
			perturbed += 1
	print("Number of values perturbed: {}".format(perturbed))
	print("Perturbed codeword: {}".format(codeword))
	
	# Try to decode the codeword
	decoded = rs.decode(codeword)
	print("Decoded message: {}".format(decoded if (decoded is not None) else "Failure"))
	print("")


# Tests the Reed-Solomon encoding and decoding logic under many parameters with many repetitions.
# This prints the results of each test round, and loops infinitely unless
# stopped by an exception (which should not happen if correctly designed).
# - Whenever numerrors <= floor(ecclen / 2), the decoding will always succeed,
#   otherwise the implementation is faulty.
# - Whenever numerrors > floor(ecclen / 2), failures and wrong answers are perfectly normal,
#   and success is generally not expected (but still possible).
def test_correctness():
	# Field parameters
	field = fieldmath.BinaryField(0x11D)
	generator = 0x02
	
	# Run forever unless an exception is thrown or unexpected behavior is encountered
	testduration = 10.0  # In seconds
	while True:
		# Choose random Reed-Solomon parameters
		msglen = random.randrange(1, field.size)
		ecclen = random.randrange(1, field.size)
		codewordlen = msglen + ecclen
		if codewordlen > field.size - 1:
			continue
		numerrors = random.randrange(codewordlen + 1)
		rs = reedsolomon.ReedSolomon(field, generator, msglen, ecclen)
		
		# Do as many trials as possible in a fixed amount of time
		numsuccess = 0
		numwrong   = 0
		numfailure = 0
		starttime = time.time()
		while time.time() - starttime < testduration:
			
			# Generate random message
			message = [random.randrange(field.size) for _ in range(msglen)]
			
			# Encode message to codeword
			codeword = rs.encode(message)
			
			# Perturb values in the codeword
			indexes = [i for i in range(codewordlen)]
			for i in range(numerrors):
				# Partial Durstenfeld shuffle
				j = random.randrange(i, codewordlen)
				indexes[i], indexes[j] = indexes[j], indexes[i]
				# Actual perturbation
				codeword[indexes[i]] ^= random.randrange(1, field.size)
			
			# Try to decode the codeword, and evaluate result
			decoded = rs.decode(codeword)
			if decoded == message:
				numsuccess += 1
			elif numerrors <= ecclen // 2:
				raise AssertionError("Decoding should have succeeded")
			elif decoded is not None:
				numwrong += 1
			else:
				numfailure += 1
		
		# Print parameters and statistics for this round
		print("msgLen={}, eccLen={}, codewordLen={}, numErrors={}  numTrials={}, numSuccess={}, numWrong={}, numFailure={}".format(
			msglen, ecclen, codewordlen, numerrors, numsuccess + numwrong + numfailure, numsuccess, numwrong, numfailure))


if __name__ == "__main__":
	main()
