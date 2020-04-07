/* 
 * Reed-Solomon error-correcting code decoder (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/reed-solomon-error-correcting-code-decoder
 */

import java.lang.reflect.Array;
import java.util.Arrays;
import java.util.Objects;


/**
 * Performs Reed-Solomon encoding and decoding. This object can encode a message into a codeword.
 * The codeword can have some values modified by external code. Then this object can try
 * to decode the codeword, and under some circumstances can reproduce the original message.
 * <p>This class is immutable and thread-safe, but the argument arrays passed into methods are not thread-safe.</p>
 */
public final class ReedSolomon<E> {
	
	/*---- Fields ----*/
	
	/** The number of values in each message. Always at least 1. */
	public final int messageLen;
	
	/** The number of error correction values to expand the message by. Always at least 1. */
	public final int eccLen;
	
	/** The number of values in each codeword, equal to messageLen + eccLen. Always at least 2. */
	public final int codewordLen;
	
	
	// The field for message and codeword values, and for performing arithmetic operations on values. Not null.
	private final Field<E> f;
	
	// An element of the field whose powers generate all the non-zero elements of the field. Not null.
	private final E generator;
	
	// The class object for the actual type parameter E, which is used in newArray(). Not null.
	private Class<E> elementType;
	
	
	
	/*---- Constructor ----*/
	
	/**
	 * Constructs a Reed-Solomon encoder-decoder with the specified field, lengths, and other parameters.
	 * <p>Note: The class argument is used like this:
	 * {@code ReedSolomon<Integer> rs = new ReedSolomon<>(f, gen, Integer.class, msgLen, eccLen);}</p>
	 * @param f the field for all values and operations (not {@code null})
	 * @param gen a generator of the field {@code f} (not {@code null})
	 * @param elemType the class object for the type parameter {@code E} (not {@code null})
	 * @param msgLen the length of message arrays, which must be positive
	 * @param eccLen the number of values to expand each message by, which must be positive
	 * @throws NullPointerException if any of the object arguments is null
	 * @throws IllegalArgumentException if msgLen &le; 0, eccLen &le; 0, or mlgLen + eccLen > Integer.MAX_VALUE
	 */
	public ReedSolomon(Field<E> f, E gen, Class<E> elemType, int msgLen, int eccLen) {
		// Check arguments
		Objects.requireNonNull(f);
		Objects.requireNonNull(gen);
		Objects.requireNonNull(elemType);
		if (msgLen <= 0 || eccLen <= 0 || Integer.MAX_VALUE - msgLen < eccLen)
			throw new IllegalArgumentException("Invalid message or ECC length");
		
		// Assign fields
		this.f = f;
		this.generator = gen;
		this.elementType = elemType;
		this.messageLen = msgLen;
		this.eccLen = eccLen;
		this.codewordLen = msgLen + eccLen;
	}
	
	
	
	/*---- Encoder methods ----*/
	
	/**
	 * Returns a new array representing the codeword produced by encoding the specified message.
	 * If the message has the correct length and all its values are
	 * valid in the field, then this method is guaranteed to succeed.
	 * @param message the message to encode, whose length must equal {@code this.messageLen}
	 * @return a new array representing the codeword values
	 * @throws NullPointerException if the message array or any of its elements are {@code null}
	 * @throws IllegalArgumentException if the message array has the wrong length
	 */
	public E[] encode(E[] message) {
		// Check arguments
		Objects.requireNonNull(message);
		if (message.length != messageLen)
			throw new IllegalArgumentException("Invalid message length");
		
		// Make the generator polynomial (this doesn't depend on the message)
		E[] genPoly = makeGeneratorPolynomial();
		
		// Compute the remainder ((message(x) * x^eccLen) mod genPoly(x)) by performing polynomial division.
		// Process message bytes (polynomial coefficients) from the highest monomial power to the lowest power
		E[] eccPoly = newArray(eccLen);
		Arrays.fill(eccPoly, f.zero());
		for (int i = messageLen - 1; i >= 0; i--) {
			E factor = f.add(message[i], eccPoly[eccLen - 1]);
			System.arraycopy(eccPoly, 0, eccPoly, 1, eccLen - 1);
			eccPoly[0] = f.zero();
			for (int j = 0; j < eccLen; j++)
				eccPoly[j] = f.subtract(eccPoly[j], f.multiply(genPoly[j], factor));
		}
		
		// Negate the remainder
		for (int i = 0; i < eccPoly.length; i++)
			eccPoly[i] = f.negate(eccPoly[i]);
		
		// Concatenate the message and ECC polynomials
		E[] result = newArray(codewordLen);
		System.arraycopy(eccPoly, 0, result, 0, eccLen);
		System.arraycopy(message, 0, result, eccLen, messageLen);
		return result;
	}
	
	
	// Computes the generator polynomial by multiplying powers of the generator value:
	// genPoly(x) = (x - gen^0) * (x - gen^1) * ... * (x - gen^(eccLen-1)).
	// The resulting array of coefficients is in little endian, i.e. from lowest to highest power, except
	// that the very highest power (the coefficient for the x^eccLen term) is omitted because it's always 1.
	// The result of this method can be pre-computed because it doesn't depend on the message to be encoded.
	private E[] makeGeneratorPolynomial() {
		// Start with the polynomial of 1*x^0, which is the multiplicative identity
		E[] result = newArray(eccLen);
		Arrays.fill(result, f.zero());
		result[0] = f.one();
		
		E genPow = f.one();
		for (int i = 0; i < eccLen; i++) {
			// At this point, genPow == generator^i.
			// Multiply the current genPoly by (x - generator^i)
			for (int j = eccLen - 1; j >= 0; j--) {
				result[j] = f.multiply(f.negate(genPow), result[j]);
				if (j >= 1)
					result[j] = f.add(result[j - 1], result[j]);
			}
			genPow = f.multiply(generator, genPow);
		}
		return result;
	}
	
	
	
	/*---- Decoder methods ----*/
	
	/**
	 * Attempts to decode the specified codeword with the maximum error-correcting
	 * capability allowed, returning either a best-guess message or {@code null}.
	 * <p>If the number of erroneous values in the codeword is less than or equal to floor(eccLen / 2),
	 * then decoding is guaranteed to succeed. Otherwise an explicit failure ({@code null} answer)
	 * is most likely, but wrong answer and right answer are also possible too.</p>
	 * @param codeword the codeword to decode, whose length must equal {@code this.codewordLen}
	 * @return a new array representing the decoded message, or {@code null} to indicate failure
	 * @throws NullPointerException if the codeword is {@code null}
	 * @throws IllegalArgumentException if the codeword array has the wrong length
	 */
	public E[] decode(E[] codeword) {
		return decode(codeword, eccLen / 2);
	}
	
	
	/**
	 * Attempts to decode the specified codeword with the specified level of
	 * error-correcting capability, returning either a best-guess message or {@code null}.
	 * <p>If the number of erroneous values in the codeword is less than or equal to numErrorsToCorrect,
	 * then decoding is guaranteed to succeed. Otherwise an explicit failure ({@code null} answer)
	 * is most likely, but wrong answer and right answer are also possible too.</p>
	 * @param codeword the codeword to decode, whose length must equal {@code this.codewordLen}
	 * @param numErrorsToCorrect the number of errors in the codeword to try to fix,
	 * which must be between 0 to floor(eccLen / 2), inclusive
	 * @return a new array representing the decoded message, or {@code null} to indicate failure
	 * @throws NullPointerException if the codeword is {@code null}
	 * @throws IllegalArgumentException if the codeword array has the wrong length,
	 * or numErrorsToCorrect is out of range
	 */
	public E[] decode(E[] codeword, int numErrorsToCorrect) {
		// Check arguments
		Objects.requireNonNull(codeword);
		if (codeword.length != codewordLen)
			throw new IllegalArgumentException("Invalid codeword length");
		if (numErrorsToCorrect < 0 || numErrorsToCorrect > eccLen / 2)
			throw new IllegalArgumentException("Number of errors to correct is out of range");
		
		// Calculate and check syndromes
		E[] syndromes = calculateSyndromes(codeword);
		if (!areAllZero(syndromes)) {
			// At this point, we know the codeword must have some errors
			if (numErrorsToCorrect == 0)
				return null;  // Only detect but not fix errors
			
			// Try to solve for the error locator polynomial
			E[] errLocPoly = calculateErrorLocatorPolynomial(syndromes, numErrorsToCorrect);
			if (errLocPoly == null)
				return null;
			
			// Try to find the codeword indexes where errors might have occurred
			int[] errLocs = findErrorLocations(errLocPoly, numErrorsToCorrect);
			if (errLocs == null || errLocs.length == 0)
				return null;
			
			// Try to find the error values at these indexes
			E[] errVals = calculateErrorValues(errLocs, syndromes);
			if (errVals == null)
				return null;
			
			// Perform repairs to the codeword with the information just derived
			E[] newCodeword = fixErrors(codeword, errLocs, errVals);
			
			// Final sanity check by recomputing syndromes
			E[] newSyndromes = calculateSyndromes(newCodeword);
			if (!areAllZero(newSyndromes))
				throw new AssertionError();
			codeword = newCodeword;
		}
		
		// At this point, all syndromes are zero.
		// Extract the message part of the codeword
		return Arrays.copyOfRange(codeword, eccLen, codeword.length);
	}
	
	
	// Returns a new array representing the sequence of syndrome values for the given codeword.
	// To summarize the math, syndrome[i] = codeword(generator^i).
	private E[] calculateSyndromes(E[] codeword) {
		// Check arguments
		Objects.requireNonNull(codeword);
		if (codeword.length != codewordLen)
			throw new IllegalArgumentException();
		
		// Evaluate the codeword polynomial at generator powers
		E[] result = newArray(eccLen);
		E genPow = f.one();
		for (int i = 0; i < result.length; i++) {
			result[i] = evaluatePolynomial(codeword, genPow);
			genPow = f.multiply(generator, genPow);
		}
		return result;
	}
	
	
	// Returns a new array representing the coefficients of the error locator polynomial
	// in little endian, or null if the syndrome values imply too many errors to handle.
	private E[] calculateErrorLocatorPolynomial(E[] syndromes, int numErrorsToCorrect) {
		// Check arguments
		Objects.requireNonNull(syndromes);
		if (syndromes.length != eccLen || numErrorsToCorrect <= 0 || numErrorsToCorrect > syndromes.length / 2)
			throw new IllegalArgumentException();
		
		// Copy syndrome values into augmented matrix
		Matrix<E> matrix = new Matrix<>(numErrorsToCorrect, numErrorsToCorrect + 1, f);
		for (int r = 0; r < matrix.rowCount(); r++) {
			for (int c = 0; c < matrix.columnCount(); c++) {
				E val = syndromes[r + c];
				if (c == matrix.columnCount() - 1)
					val = f.negate(val);
				matrix.set(r, c, val);
			}
		}
		
		// Solve the system of linear equations
		matrix.reducedRowEchelonForm();
		
		// Create result vector filled with zeros. Note that columns without a pivot
		// will yield variables that stay at the default value of zero
		E[] result = newArray(numErrorsToCorrect + 1);
		Arrays.fill(result, f.zero());
		result[0] = f.one();  // Constant term is always 1, regardless of the matrix
		
		// Find the column of the pivot in each row, and set the
		// appropriate output variable's value based on the column index
		outer:
		for (int r = 0, c = 0; r < matrix.rowCount(); r++) {
			// Advance the column index until a pivot is found, but handle specially if
			// the rightmost column is identified as a pivot or if no column is a pivot
			while (true) {
				if (c == matrix.columnCount())
					break outer;
				else if (f.equals(matrix.get(r, c), f.zero()))
					c++;
				else if (c == matrix.columnCount() - 1)
					return null;  // Linear system is inconsistent
				else
					break;
			}
			
			// Copy the value in the rightmost column to the result vector
			result[numErrorsToCorrect - c] = matrix.get(r, numErrorsToCorrect);
		}
		return result;
	}
	
	
	// Returns a new array that represents indexes into the codeword array where the value
	// might be erroneous, or null if it is discovered that the decoding process is impossible.
	// This method tries to find roots of the error locator polynomial by brute force.
	private int[] findErrorLocations(E[] errLocPoly, int maxSolutions) {
		// Check arguments
		Objects.requireNonNull(errLocPoly);
		if (maxSolutions <= 0 || maxSolutions > codewordLen)
			throw new IllegalArgumentException();
		
		// Create temporary buffer for roots found
		int[] indexesFound = new int[maxSolutions];
		int numFound = 0;
		
		// Evaluate errLocPoly(generator^-i) for 0 <= i < codewordLen
		E genRec = f.reciprocal(generator);
		E genRecPow = f.one();
		for (int i = 0; i < codewordLen; i++) {
			// At this point, genRecPow == generator^-i
			E polyVal = evaluatePolynomial(errLocPoly, genRecPow);
			if (f.equals(polyVal, f.zero())) {
				if (numFound >= indexesFound.length)
					return null;  // Too many solutions
				indexesFound[numFound] = i;
				numFound++;
			}
			genRecPow = f.multiply(genRec, genRecPow);
		}
		return Arrays.copyOf(indexesFound, numFound);
	}
	
	
	// Returns a new array representing the error values/magnitudes at the given error locations,
	// or null if the information given is inconsistent (thus decoding is impossible).
	// If the result of this method is not null, then after fixing the codeword it is guaranteed
	// to have all zero syndromes (but it could be the wrong answer, unequal to the original message).
	private E[] calculateErrorValues(int[] errLocs, E[] syndromes) {
		// Check arguments
		Objects.requireNonNull(errLocs);
		Objects.requireNonNull(syndromes);
		if (syndromes.length != eccLen)
			throw new IllegalArgumentException();
		
		// Calculate and copy values into matrix
		Matrix<E> matrix = new Matrix<>(syndromes.length, errLocs.length + 1, f);
		for (int c = 0; c < matrix.columnCount() - 1; c++) {
			E genPow = pow(generator, errLocs[c]);
			E genPowPow = f.one();
			for (int r = 0; r < matrix.rowCount(); r++) {
				matrix.set(r, c, genPowPow);
				genPowPow = f.multiply(genPow, genPowPow);
			}
		}
		for (int r = 0; r < matrix.rowCount(); r++)
			matrix.set(r, matrix.columnCount() - 1, syndromes[r]);
		
		// Solve matrix and check basic consistency
		matrix.reducedRowEchelonForm();
		if (!f.equals(matrix.get(matrix.columnCount() - 1, matrix.columnCount() - 1), f.zero()))
			return null;  // System of linear equations is inconsistent
		
		// Check that the top left side equals an identity matrix,
		// and extract the rightmost column as result vector
		E[] result = newArray(errLocs.length);
		for (int i = 0; i < result.length; i++) {
			if (!f.equals(matrix.get(i, i), f.one()))
				return null;  // Linear system is under-determined; no unique solution
			result[i] = matrix.get(i, matrix.columnCount() - 1);
		}
		return result;
	}
	
	
	// Returns a new codeword representing the given codeword with the given errors subtracted.
	// Always succeeds, as long as the array values are well-formed.
	private E[] fixErrors(E[] codeword, int[] errLocs, E[] errVals) {
		// Check arguments
		Objects.requireNonNull(codeword);
		Objects.requireNonNull(errLocs);
		Objects.requireNonNull(errVals);
		if (codeword.length != codewordLen || errLocs.length != errVals.length)
			throw new IllegalArgumentException();
		
		// Clone the codeword and change values at specific indexes
		E[] result = codeword.clone();
		for (int i = 0; i < errLocs.length; i++)
			result[errLocs[i]] = f.subtract(result[errLocs[i]], errVals[i]);
		return result;
	}
	
	
	
	/*---- Simple utility methods ----*/
	
	// Returns a new array of the given length with E as the actual element type.
	// This method exists so that unchecked generic operations are confined in one place here.
	@SuppressWarnings("unchecked")
	private E[] newArray(int len) {
		if (len < 0)
			throw new NegativeArraySizeException();
		return (E[])Array.newInstance(elementType, len);
	}
	
	
	// Returns the value of the given polynomial at the given point. The polynomial is represented
	// in little endian. In other words, this method evaluates result = polynomial(point)
	// = polynomial[0]*point^0 + polynomial[1]*point^1 + ... + ponylomial[len-1]*point^(len-1).
	private E evaluatePolynomial(E[] polynomial, E point) {
		Objects.requireNonNull(polynomial);
		Objects.requireNonNull(point);
		
		// Horner's method
		E result = f.zero();
		for (int i = polynomial.length - 1; i >= 0; i--) {
			result = f.multiply(point, result);
			result = f.add(polynomial[i], result);
		}
		return result;
	}
	
	
	// Tests whether all elements of the given array are equal to the field's zero element.
	private boolean areAllZero(E[] array) {
		Objects.requireNonNull(array);
		for (E val : array) {
			if (!f.equals(val, f.zero()))
				return false;
		}
		return true;
	}
	
	
	// Returns the given field element raised to the given power. The power must be non-negative.
	private E pow(E base, int exp) {
		Objects.requireNonNull(base);
		if (exp < 0)
			throw new UnsupportedOperationException();
		E result = f.one();
		for (int i = 0; i < exp; i++)
			result = f.multiply(base, result);
		return result;
	}
	
}
