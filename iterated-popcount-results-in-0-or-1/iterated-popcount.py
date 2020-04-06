# 
# Iterated popcount demo
# 
# Copyright (c) 2020 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/iterated-popcount-results-in-0-or-1
# 


def main():
	while True:
		s = input("Enter an integer (or blank to quit): ")
		if s == "":
			print("Quit")
			break
		try:
			n = int(s)
			if n < 0:
				raise ValueError()
			do_iterated_popcount(n)
		except ValueError:
			print("Error: Number must be positive or zero")
		print("")


def do_iterated_popcount(n):
	i = 0
	prev = -1
	print("Iter  Value")
	while True:
		print(f"{i:4}  {n}")
		if n == prev:
			break
		prev = n
		n = bin(n).count("1")
		i += 1


if __name__ == "__main__":
	main()
