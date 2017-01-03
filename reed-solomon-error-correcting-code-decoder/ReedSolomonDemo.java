/* 
 * Reed-Solomon error-correcting code decoder
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/reed-solomon-error-correcting-code-decoder
 */

import java.util.Arrays;
import java.util.Random;


public final class ReedSolomonDemo {
	
	// Runs a bunch of demos and tests, printing information to standard error. 
	public static void main(String[] args) {
		showExample();
		testCorrectness();
	}
	
	
	// Shows an example of encoding a message, and decoding a codeword containing errors.
	private static void showExample() {
		// Configurable parameters
		BinaryField field = new BinaryField(0x11D);
		Integer generator = 0x02;
		int msgLen = 8;
		int eccLen = 5;
		ReedSolomon<Integer> rs = new ReedSolomon<>(field, generator, Integer.class, msgLen, eccLen);
		
		// Generate random message
		Integer[] message = new Integer[msgLen];
		for (int i = 0; i < message.length; i++)
			message[i] = rand.nextInt(field.size);
		System.err.println("Original message: " + Arrays.toString(message));
		
		// Encode message to produce codeword
		Integer[] codeword = rs.encode(message);
		System.err.println("Encoded codeword: " + Arrays.toString(codeword));
		
		// Perturb some values in the codeword
		double probability = (double)(eccLen / 2) / (msgLen + eccLen);
		int perturbed = 0;
		for (int i = 0; i < codeword.length; i++) {
			if (rand.nextDouble() < probability) {
				codeword[i] ^= rand.nextInt(field.size - 1) + 1;
				perturbed++;
			}
		}
		System.err.println("Number of values perturbed: " + perturbed);
		System.err.println("Perturbed codeword: " + Arrays.toString(codeword));
		
		// Try to decode the codeword
		Integer[] decoded = rs.decode(codeword);
		System.err.println("Decoded message: " + (decoded != null ? Arrays.toString(decoded) : "Failure"));
		System.err.println();
	}
	
	
	// Tests the Reed-Solomon encoding and decoding logic under many parameters with many repetitions.
	// This prints the results of each test round, and loops infinitely unless
	// stopped by an exception (which should not happen if correctly designed).
	// - Whenever numErrors <= floor(eccLen / 2), the decoding will always succeed,
	//   otherwise the implementation is faulty.
	// - Whenever numErrors > floor(eccLen / 2), failures and wrong answers are perfectly normal,
	//   and success is generally not expected (but still possible).
	private static void testCorrectness() {
		// Field parameters
		BinaryField field = new BinaryField(0x11D);
		Integer generator = 0x02;
		
		// Run forever unless an exception is thrown or unexpected behavior is encountered
		int testDuration = 3000;  // In milliseconds
		while (true) {
			// Choose random Reed-Solomon parameters
			int msgLen = rand.nextInt(field.size) + 1;
			int eccLen = rand.nextInt(field.size) + 1;
			int codewordLen = msgLen + eccLen;
			if (codewordLen > field.size - 1)
				continue;
			int numErrors = rand.nextInt(codewordLen + 1);
			ReedSolomon<Integer> rs = new ReedSolomon<>(field, generator, Integer.class, msgLen, eccLen);
			
			// Do as many trials as possible in a fixed amount of time
			long numSuccess = 0;
			long numWrong   = 0;
			long numFailure = 0;
			long startTime = System.currentTimeMillis();
			while (System.currentTimeMillis() - startTime < testDuration) {
				
				// Generate random message
				Integer[] message = new Integer[msgLen];
				for (int i = 0; i < message.length; i++)
					message[i] = rand.nextInt(field.size);
				
				// Encode message to codeword
				Integer[] codeword = rs.encode(message);
				
				// Perturb values in the codeword
				int[] indexes = new int[codewordLen];
				for (int i = 0; i < indexes.length; i++)
					indexes[i] = i;
				for (int i = 0; i < numErrors; i++) {
					// Partial Durstenfeld shuffle
					int j = rand.nextInt(indexes.length - i) + i;
					int temp = indexes[i];
					indexes[i] = indexes[j];
					indexes[j] = temp;
					// Actual perturbation
					codeword[indexes[i]] ^= rand.nextInt(field.size - 1) + 1;
				}
				
				// Try to decode the codeword, and evaluate result
				Integer[] decoded = rs.decode(codeword);
				if (Arrays.equals(decoded, message))
					numSuccess++;
				else if (numErrors <= eccLen / 2)
					throw new AssertionError("Decoding should have succeeded");
				else if (decoded != null)
					numWrong++;
				else
					numFailure++;
			}
			
			// Print parameters and statistics for this round
			System.err.printf("msgLen=%d, eccLen=%d, codewordLen=%d, numErrors=%d;  numTrials=%d, numSuccess=%d, numWrong=%d, numFailure=%d%n",
				msgLen, eccLen, codewordLen, numErrors, numSuccess + numWrong + numFailure, numSuccess, numWrong, numFailure);
		}
	}
	
	
	private static final Random rand = new Random();
	
}
