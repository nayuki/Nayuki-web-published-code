# 
# Reed-Solomon error-correcting code decoder
# 
# Copyright (c) 2017 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/reed-solomon-error-correcting-code-decoder
# 

import fieldmath


class ReedSolomon(object):
	"""Performs Reed-Solomon encoding and decoding. This object can encode a message into a codeword.
	The codeword can have some values modified by external code. Then this object can try
	to decode the codeword, and under some circumstances can reproduce the original message.
	This class is immutable and thread-safe, but the argument arrays passed into methods are not thread-safe."""
	
	
	# ---- Constructor ----
	
	def __init__(self, field, gen, msglen, ecclen):
		"""Constructs a Reed-Solomon encoder-decoder with the specified field, generator, and lengths."""
		if not isinstance(field, fieldmath.Field) or gen is None:
			raise TypeError()
		if msglen <= 0 or ecclen <= 0:
			raise ValueError("Invalid message or ECC length")
		
		# The field for message and codeword values, and for performing arithmetic operations on values.
		self.f = field
		
		# An element of the field whose powers generate all the non-zero elements of the field.
		self.generator = gen
		
		# The number of values in each message. A positive integer.
		self.message_len = msglen
		
		# The number of error correction values to expand the message by. A positive integer.
		self.ecc_len = ecclen
		
		# The number of values in each codeword, equal to message_len + ecc_len. Always at least 2.
		self.codeword_len = msglen + ecclen
	
	
	# ---- Encoder methods ----
	
	def encode(self, message):
		"""Returns a new sequence representing the codeword produced by encoding the specified message.
		If the message has the correct length and all its values are
		valid in the field, then this method is guaranteed to succeed."""
		
		# Check arguments
		if len(message) != self.message_len:
			raise ValueError("Invalid message length")
		
		# Make the generator polynomial (this doesn't depend on the message)
		genpoly = self._make_generator_polynomial()
		
		# Compute the remainder ((message(x) * x^ecclen) mod genpoly(x)) by performing polynomial division.
		# Process message bytes (polynomial coefficients) from the highest monomial power to the lowest power
		eccpoly = [0] * self.ecc_len
		for msgval in reversed(message):
			factor = self.f.add(msgval, eccpoly[-1])
			del eccpoly[-1]
			eccpoly.insert(0, 0)
			for j in range(self.ecc_len):
				eccpoly[j] = self.f.subtract(eccpoly[j], self.f.multiply(genpoly[j], factor))
		
		# Negate the remainder, then concatenate with message polynomial
		return [self.f.negate(val) for val in eccpoly] + message
	
	
	# Computes the generator polynomial by multiplying powers of the generator value:
	# genpoly(x) = (1 - gen^0) * (1 - gen^1) * ... * (1 - gen^(ecclen-1)).
	# The resulting array of coefficients is in little endian, i.e. from lowest to highest power, except
	# that the very highest power (the coefficient for the x^ecclen term) is omitted because it's always 1.
	# The result of this method can be pre-computed because it doesn't depend on the message to be encoded.
	def _make_generator_polynomial(self):
		# Start with the polynomial of 1*x^0, which is the multiplicative identity
		result = [1] + [0] * (self.ecc_len - 1)
		
		genpow = self.f.one()
		for i in range(self.ecc_len):
			# At this point, genpow == generator^i.
			# Multiply the current genpoly by (x - generator^i)
			for j in reversed(range(self.ecc_len)):
				result[j] = self.f.multiply(self.f.negate(genpow), result[j])
				if j >= 1:
					result[j] = self.f.add(result[j - 1], result[j])
			genpow = self.f.multiply(self.generator, genpow)
		return result
	
	
	# ---- Decoder methods ----
	
	def decode(self, codeword, numerrorstocorrect=None):
		"""Attempts to decode the specified codeword with the specified level of
		error-correcting capability, returning either a best-guess message or None.
		If the number of errors to correct is omitted, then the maximum valid value is used by default.
		If the number of erroneous values in the codeword is less than or equal to numerrorstocorrect,
		then decoding is guaranteed to succeed. Otherwise an explicit failure (None answer)
		is most likely, but wrong answer and right answer are also possible too."""
		
		# Check arguments
		if numerrorstocorrect is None:
			numerrorstocorrect = self.ecc_len // 2
		if len(codeword) != self.codeword_len:
			raise ValueError("Invalid codeword length")
		if not (0 <= numerrorstocorrect <= self.ecc_len // 2):
			raise ValueError("Number of errors to correct is out of range")
		
		# Calculate and check syndromes
		syndromes = self._calculate_syndromes(codeword)
		if any(val != 0 for val in syndromes):
			# At this point, we know the codeword must have some errors
			if numerrorstocorrect == 0:
				return None  # Only detect but not fix errors
			
			# Try to solve for the error locator polynomial
			errlocpoly = self._calculate_error_locator_polynomial(syndromes, numerrorstocorrect)
			if errlocpoly is None:
				return None
			
			# Try to find the codeword indexes where errors might have occurred
			errlocs = self._find_error_locations(errlocpoly, numerrorstocorrect)
			if errlocs is None or len(errlocs) == 0:
				return None
			
			# Try to find the error values at these indexes
			errvals = self._calculate_error_values(errlocs, syndromes)
			if errvals is None:
				return None
			
			# Perform repairs to the codeword with the information just derived
			newcodeword = self._fix_errors(codeword, errlocs, errvals)
			
			# Final sanity check by recomputing syndromes
			newsyndromes = self._calculate_syndromes(newcodeword)
			if any(val != 0 for val in newsyndromes):
				raise AssertionError()
			codeword = newcodeword
		
		# At this point, all syndromes are zero.
		# Extract the message part of the codeword
		return codeword[self.ecc_len : ]
	
	
	# Returns a new array representing the sequence of syndrome values for the given codeword.
	# To summarize the math, syndrome[i] = codeword(generator^i).
	def _calculate_syndromes(self, codeword):
		# Check arguments
		if len(codeword) != self.codeword_len:
			raise ValueError()
		
		# Evaluate the codeword polynomial at generator powers
		result = []
		genpow = self.f.one()
		for i in range(self.ecc_len):
			result.append(self._evaluate_polynomial(codeword, genpow))
			genpow = self.f.multiply(self.generator, genpow)
		return result
	
	
	# Returns a new array representing the coefficients of the error locator polynomial
	# in little endian, or None if the syndrome values imply too many errors to handle.
	def _calculate_error_locator_polynomial(self, syndromes, numerrorstocorrect):
		# Check arguments
		if len(syndromes) != self.ecc_len or not (0 <= numerrorstocorrect <= self.ecc_len // 2):
			raise ValueError()
		
		# Copy syndrome values into augmented matrix
		matrix = fieldmath.Matrix(numerrorstocorrect, numerrorstocorrect + 1, self.f)
		for r in range(matrix.row_count()):
			for c in range(matrix.column_count()):
				val = syndromes[r + c]
				if c == matrix.column_count() - 1:
					val = self.f.negate(val)
				matrix.set(r, c, val)
		
		# Solve the system of linear equations
		matrix.reduced_row_echelon_form()
		
		# Create result vector filled with zeros. Note that columns without a pivot
		# will yield variables that stay at the default value of zero.
		# Constant term is always 1, regardless of the matrix
		result = [1] + [0] * numerrorstocorrect
		
		# Find the column of the pivot in each row, and set the
		# appropriate output variable's value based on the column index
		c = 0
		for r in range(matrix.row_count()):
			# Advance the column index until a pivot is found, but handle specially if
			# the rightmost column is identified as a pivot or if no column is a pivot
			while True:
				if c == matrix.column_count():
					return result
				elif self.f.equals(matrix.get(r, c), self.f.zero()):
					c += 1
				elif c == matrix.column_count() - 1:
					return None  # Linear system is inconsistent
				else:
					break
			
			# Copy the value in the rightmost column to the result vector
			result[-1 - c] = matrix.get(r, numerrorstocorrect)
		return result
	
	
	# Returns a new array that represents indexes into the codeword array where the value
	# might be erroneous, or None if it is discovered that the decoding process is impossible.
	# This method tries to find roots of the error locator polynomial by brute force.
	def _find_error_locations(self, errlocpoly, maxsolutions):
		# Check arguments
		if not (0 <= maxsolutions < self.codeword_len):
			raise ValueError()
		
		# Evaluate errlocpoly(generator^-i) for 0 <= i < codewordlen
		indexesfound = []
		genrec = self.f.reciprocal(self.generator)
		genrecpow = self.f.one()
		for i in range(self.codeword_len):
			# At this point, genrecpow == generator^-i
			polyval = self._evaluate_polynomial(errlocpoly, genrecpow)
			if self.f.equals(polyval, self.f.zero()):
				if len(indexesfound) >= maxsolutions:
					return None  # Too many solutions
				indexesfound.append(i)
			genrecpow = self.f.multiply(genrec, genrecpow)
		return indexesfound
	
	
	# Returns a new array representing the error values/magnitudes at the given error locations,
	# or None if the information given is inconsistent (thus decoding is impossible).
	# If the result of this method is not None, then after fixing the codeword it is guaranteed
	# to have all zero syndromes (but it could be the wrong answer, unequal to the original message).
	def _calculate_error_values(self, errlocs, syndromes):
		# Check arguments
		if len(syndromes) != self.ecc_len:
			raise ValueError()
		
		# Calculate and copy values into matrix
		matrix = fieldmath.Matrix(len(syndromes), len(errlocs) + 1, self.f)
		for c in range(matrix.column_count() - 1):
			genpow = self._pow(self.generator, errlocs[c])
			genpowpow = self.f.one()
			for r in range(matrix.row_count()):
				matrix.set(r, c, genpowpow)
				genpowpow = self.f.multiply(genpow, genpowpow)
		for r in range(matrix.row_count()):
			matrix.set(r, matrix.column_count() - 1, syndromes[r])
		
		# Solve matrix and check basic consistency
		matrix.reduced_row_echelon_form()
		if not self.f.equals(matrix.get(matrix.column_count() - 1, matrix.column_count() - 1), self.f.zero()):
			return None  # System of linear equations is inconsistent
		
		# Check that the top left side equals an identity matrix,
		# and extract the rightmost column as result vector
		result = []
		for i in range(len(errlocs)):
			if not self.f.equals(matrix.get(i, i), self.f.one()):
				return None  # Linear system is under-determined; no unique solution
			result.append(matrix.get(i, matrix.column_count() - 1))
		return result
	
	
	# Returns a new codeword representing the given codeword with the given errors subtracted.
	# Always succeeds, as long as the array values are well-formed.
	def _fix_errors(self, codeword, errlocs, errvals):
		# Check arguments
		if len(codeword) != self.codeword_len or len(errlocs) != len(errvals):
			raise ValueError()
		
		# Clone the codeword and change values at specific indexes
		result = list(codeword)
		for (loc, val) in zip(errlocs, errvals):
			result[loc] = self.f.subtract(result[loc], val)
		return result
	
	
	# ---- Simple utility methods ----
	
	# Returns the value of the given polynomial at the given point. The polynomial is represented
	# in little endian. In other words, this method evaluates result = polynomial(point)
	# = polynomial[0]*point^0 + polynomial[1]*point^1 + ... + ponylomial[len-1]*point^(len-1).
	def _evaluate_polynomial(self, polynomial, point):
		# Horner's method
		result = self.f.zero()
		for polyval in reversed(polynomial):
			result = self.f.multiply(point, result)
			result = self.f.add(polyval, result)
		return result
	
	
	# Returns the given field element raised to the given power. The power must be non-negative.
	def _pow(self, base, exp):
		if exp < 0:
			raise ValueError("Unsupported")
		result = self.f.one()
		for _ in range(exp):
			result = self.f.multiply(base, result)
		return result
