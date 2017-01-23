# 
# Gauss-Jordan elimination over any field (Python)
# 
# Copyright (c) 2017 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/gauss-jordan-elimination-over-any-field
# 

from fractions import Fraction
import fieldmath


# Run with no command line arguments.
def main():
	# Set up the matrix
	f = fieldmath.RationalField.FIELD
	mat = fieldmath.Matrix(3, 4, f)
	mat.set(0, 0, Fraction( 2, 1))
	mat.set(0, 1, Fraction( 5, 1))
	mat.set(0, 2, Fraction( 3, 1))
	mat.set(0, 3, Fraction( 7, 1))
	mat.set(1, 0, Fraction( 1, 1))
	mat.set(1, 1, Fraction( 0, 1))
	mat.set(1, 2, Fraction( 1, 1))
	mat.set(1, 3, Fraction( 1, 1))
	mat.set(2, 0, Fraction(-4, 1))
	mat.set(2, 1, Fraction( 2, 1))
	mat.set(2, 2, Fraction(-9, 1))
	mat.set(2, 3, Fraction( 6, 1))
	
	# Gauss-Jordan elimination
	mat.reduced_row_echelon_form()
	
	# Print resulting matrix
	for i in range(mat.row_count()):
		print(" ".join(str(mat.get(i, j)) for j in range(mat.column_count())))


if __name__ == "__main__":
	main()
