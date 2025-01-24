# 
# Approximating the exponential function correctly (Python)
# 
# Copyright (c) 2025 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/approximating-eulers-number-correctly
# 

from typing import Optional


# Runs a demo that prints out some numbers
def main() -> None:
	for i in range(31):  # x = 0.0, 0.1, 0.2, ..., 3.0
		for j in range(1, 11):  # Accuracy 1 to 10
			x: int = i * 10 ** (j - 1)
			print(f"exp({format_decimal(x, j):12}) = {compute_exp(x, j)}")
		print()


# For example: compute_exp(20000, 4) = "7.3891"
def compute_exp(x: int, accuracy: int) -> str:
	if accuracy < 0:
		raise ValueError()
	if x < 0:
		raise ValueError("Negative numbers not supported")
	if x == 0:
		return format_decimal(10 ** accuracy, accuracy)
	
	extra_precision: int = x * 4343 // 10 ** (accuracy + 4) + 10  # Initial estimate based on x / log(10)
	while True:
		result: Optional[str] = compute_exp_internal(x, accuracy, extra_precision)
		if result is not None:
			return result
		extra_precision += 2


def compute_exp_internal(x: int, accuracy: int, extra_precision: int) -> Optional[str]:
	accuracy_scaler: int = 10 ** accuracy
	extra_scaler   : int = 10 ** extra_precision
	full_scaler: int = accuracy_scaler * extra_scaler
	
	sum_low : int = 0
	sum_high: int = 0
	term_low : int = full_scaler
	term_high: int = full_scaler
	floor_x: int = x // accuracy_scaler
	i: int = 0
	while term_low > 0:
		sum_low  += term_low
		sum_high += term_high
		term_low  = term_low  * x // accuracy_scaler
		term_high = term_high * x // accuracy_scaler + 1
		
		if (i > floor_x) and (term_high < extra_scaler):
			sum_upper_bound: int = sum_high + term_high
			temp: int = divide_and_round(sum_low, extra_scaler)
			if divide_and_round(sum_upper_bound, extra_scaler) == temp:
				# Note: The number of terms used is i+1
				return format_decimal(temp, accuracy)
		
		i += 1
		term_low  = term_low  // i
		term_high = term_high // i + 1
	return None


# Any rounding mode works correctly with compute_eulers_number_internal().
# Round-half-to-even is implemented here, but truncation, flooring, etc. are acceptable too.
def divide_and_round(num: int, div: int) -> int:
	quot, rem = divmod(num, div)
	if (rem * 2 > div) or ((rem * 2 == div) and (quot & 1 == 1)):
		quot += 1
	return quot


def format_decimal(num: int, accuracy: int) -> str:
	s: str = str(num).rjust(accuracy + 1, '0')
	i: int = len(s) - accuracy  # Do not try to simplify this to '-accuracy' because it fails when accuracy == 0
	return s[ : i] + "." + s[i : ]


if __name__ == "__main__":
	main()
