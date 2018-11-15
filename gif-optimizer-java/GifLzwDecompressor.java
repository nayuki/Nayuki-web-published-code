/* 
 * Library classes for GIF optimizer (Java)
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gif-optimizer-java
 */

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.Objects;


/* 
 * Decompresses a bit stream of GIF's dialect of LZW-encoded data into a byte array.
 * The incoming bit stream needs to have GIF data subblocks already unpacked.
 */
final class GifLzwDecompressor {
	
	public static byte[] decode(BitInputStream in, int codeSize) throws IOException {
		// Check arguments
		Objects.requireNonNull(in);
		if (!(2 <= codeSize && codeSize <= 8))
			throw new IllegalArgumentException();
		
		// Initialize dictionary
		LzwDictionary dict = new LzwDictionary(1 << codeSize);
		final int clearCode = dict.alphabetSize;
		final int stopCode = clearCode + 1;
		
		// Start decoding
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		for (int prevSymbol = -1; ; ) {  // Parse and process each symbol
			int symbol = in.readBits(dict.currentCodeSize);
			if (symbol >= dict.numEntries)
				throw new IllegalArgumentException("Symbol out of range");
			else if (symbol == stopCode)
				break;
			else if (symbol == clearCode) {
				dict.resetEntries();
				prevSymbol = -1;
			} else {  // Ordinary data symbol
				// Add new entry to dictionary if not at beginning and not full
				if (prevSymbol != -1)
					dict.fillPlaceholderEntry(prevSymbol, symbol);
				
				// Write bytes of the current symbol's entry
				dict.writeEntry(symbol, out);
				prevSymbol = symbol;
				
				// Increment size before knowing what the encoder just added
				dict.addPlaceholderEntry();
			}
		}
		return out.toByteArray();
	}
	
	
	
	// A helper class with mutable state.
	private static final class LzwDictionary {
		
		public final int alphabetSize;
		
		public int numEntries;  // Always in the range [alphabetSize + 2, MAX_ENTRIES]
		public int currentCodeSize;  // Always equal to ceil(log2(numEntries))
		
		private byte[] symbolBytes;
		private int[] symbolStarts;
		
		
		public LzwDictionary(int alphaSz) {
			if (!(1 <= alphaSz && alphaSz <= 256))
				throw new IllegalArgumentException();
			alphabetSize = alphaSz;
			
			// Fill prefix with literals
			symbolStarts = new int[MAX_ENTRIES + 1];
			symbolBytes = new byte[alphaSz];  // Minimum initial size
			for (int i = 0; i < alphaSz; i++) {
				symbolStarts[i] = i;
				symbolBytes[i] = (byte)i;
			}
			
			// Add special Clear and Stop symbols with zero-length data
			for (int i = 0; i <= 2; i++)
				symbolStarts[alphaSz + i] = alphaSz;
			
			resetEntries();
		}
		
		
		public void resetEntries() {
			numEntries = alphabetSize + 2;  // Alphabet plus Clear and Stop symbols
			currentCodeSize = 32 - Integer.numberOfLeadingZeros(numEntries - 1);
			Arrays.fill(symbolStarts, numEntries + 1, symbolStarts.length, -1);  // Mark unused entries
		}
		
		
		public void fillPlaceholderEntry(int prevSymbol, int curSymbol) {
			// Check arguments
			if (symbolStarts[numEntries] != -1) {
				if (numEntries >= MAX_ENTRIES)
					return;
				else
					throw new IllegalStateException();
			}
			if (!(0 <= prevSymbol && prevSymbol < numEntries - 1))
				throw new IllegalArgumentException();
			if (!(0 <= curSymbol && curSymbol < numEntries))
				throw new IllegalArgumentException();
			
			// Compute numbers
			int newEntryLen = symbolStarts[prevSymbol + 1] - symbolStarts[prevSymbol] + 1;
			int newSymbol = numEntries - 1;
			int newStart = symbolStarts[newSymbol];
			int newEnd = newStart + newEntryLen;
			
			// Update arrays
			while (symbolBytes.length < newEnd)  // Ensure capacity
				symbolBytes = Arrays.copyOf(symbolBytes, symbolBytes.length * 2);
			System.arraycopy(symbolBytes, symbolStarts[prevSymbol], symbolBytes, newStart, newEntryLen - 1);
			symbolBytes[newEnd - 1] = symbolBytes[symbolStarts[curSymbol]];
			symbolStarts[newSymbol + 1] = newEnd;
		}
		
		
		public void writeEntry(int symbol, OutputStream out) throws IOException {
			if (!(0 <= symbol && symbol < numEntries))
				throw new IllegalArgumentException();
			Objects.requireNonNull(out);
			int start = symbolStarts[symbol];
			int end = symbolStarts[symbol + 1];
			out.write(symbolBytes, start, end - start);
		}
		
		
		public void addPlaceholderEntry() {
			if (numEntries < MAX_ENTRIES) {
				if (symbolStarts[numEntries] == -1)
					throw new IllegalStateException();
				if (Integer.bitCount(numEntries) == 1)  // Is power of 2
					currentCodeSize++;
				numEntries++;
			}
		}
		
		
		public static final int MAX_ENTRIES = 4096;
		
	}
	
}
