# 
# Approximating Euler's number correctly (Python)
# 
# Copyright (c) 2020 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/approximating-eulers-number-correctly
# 

import time


# Runs a demo that prints out some numbers
def main():
	# Print e rounded to n decimal places, for n from 0 to 60
	for i in range(61):
		print(compute_eulers_number(i))
	print()
	
	# Compute 1 to 100000 decimal places (exponentially increasing) and print timing
	prev = 0
	for i in range(101):
		digits = int(round(10 ** (i / 20)))
		if digits == prev:
			continue
		prev = digits
		
		start_time = time.time()
		compute_eulers_number(digits)
		elapsed_time = time.time() - start_time
		print(f"{digits:6d}  {elapsed_time:7.3f} s")


# For example: compute_eulers_number(4) = "2.7183"
def compute_eulers_number(accuracy):
	if accuracy < 0:
		raise ValueError()
	
	extra_precision = 7
	while True:
		result = compute_eulers_number_internal(accuracy, extra_precision)
		if result is not None:
			return result
		extra_precision += 2


def compute_eulers_number_internal(accuracy, extra_precision):
	full_scaler = 10 ** (accuracy + extra_precision)
	extra_scaler = 10 ** extra_precision
	
	sum_low  = 0
	sum_high = 0
	term_low  = full_scaler
	term_high = full_scaler
	i = 0
	while term_low > 0:
		sum_low  += term_low
		sum_high += term_high
		
		if i >= 1 and term_high < extra_scaler:
			sum_upper_bound = sum_high + term_high
			temp = divide_and_round(sum_low, extra_scaler)
			if divide_and_round(sum_upper_bound, extra_scaler) == temp:
				# Note: The number of terms used is i+1
				s = str(temp)
				return s[ : len(s) - accuracy] + "." + s[len(s) - accuracy : ]
		
		i += 1
		term_low  = term_low  // i
		term_high = term_high // i + 1


# Any rounding mode works correctly with compute_eulers_number_internal().
# Round-half-to-even is implemented here, but truncation, flooring, etc. are acceptable too.
def divide_and_round(num, div):
	quot = num // div
	rem = num % div
	if rem * 2 > div or (rem * 2 == div and quot & 1 == 1):
		quot += 1
	return quot


if __name__ == "__main__":
	main()
