# 
# Approximating Euler's number correctly (Python)
# 
# Copyright (c) 2025 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/approximating-eulers-number-correctly
# 

import time
from fractions import Fraction


# Runs a demo that prints out some numbers
def main() -> None:
	# Print e rounded to n decimal places, for n from 0 to 60
	for i in range(61):
		print(compute_eulers_number(i))
	print()
	
	# Compute 1 to 3000 decimal places (exponentially increasing) and print timing
	prev: int = 0
	for i in range(71):
		digits: int = int(round(10 ** (i / 20)))
		if digits == prev:
			continue
		prev = digits
		
		start_time: float = time.time()
		compute_eulers_number(digits)
		elapsed_time: float = time.time() - start_time
		print(f"{digits:6}  {elapsed_time:7.3f} s")


# For example: compute_eulers_number(4) = "2.7183"
def compute_eulers_number(accuracy: int) -> str:
	if accuracy < 0:
		raise ValueError()
	
	sum: Fraction = Fraction(0)
	factorial: int = 1
	error_target: int = 10 ** accuracy
	scaler: Fraction = Fraction(error_target)
	i: int = 0
	while True:
		term: Fraction = Fraction(1, factorial)
		sum += term
		if i >= 1 and factorial > error_target:  # i.e. term < 1/error_target
			lower: int = round_fraction(sum * scaler)
			upper: int = round_fraction((sum + term) * scaler)
			if lower == upper:
				# Note: The number of terms used is i+1
				s: str = str(lower)
				return s[ : len(s) - accuracy] + "." + s[len(s) - accuracy : ]
		i += 1
		factorial *= i


HALF_FRACTION: Fraction = Fraction(1, 2)

# Any rounding mode works correctly with compute_eulers_number().
# Round-half-to-even is implemented here, but truncation, flooring, etc. are acceptable too.
def round_fraction(num: Fraction) -> int:
	result: int = num.numerator // num.denominator
	error: Fraction = num - Fraction(result)
	if error > HALF_FRACTION or (error == HALF_FRACTION and result & 1 == 1):
		result += 1
	return result


if __name__ == "__main__":
	main()
