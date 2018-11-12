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


// Decompresses GIF's dialect of LZW-encoded data. Requires prior unpacking of GIF data subblocks.
final class GifLzwDecompressor {
	
	public static byte[] decode(BitInputStream in, int codeBits) throws IOException {
		// Check arguments
		Objects.requireNonNull(in);
		if (!(2 <= codeBits && codeBits <= 8))
			throw new IllegalArgumentException();
		
		// Initialize dictionary
		LzwDictionary dict = new LzwDictionary(1 << codeBits);
		final int clearCode = dict.alphabetSize;
		final int stopCode = clearCode + 1;
		
		// Start decoding
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		for (int prevSymbol = -1; ; ) {  // Parse and process each symbol
			int symbol = in.readBits(dict.currentCodeBits);
			if (symbol >= dict.currentSize)
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
	
	
	
	private static final class LzwDictionary {
		
		public final int alphabetSize;
		
		public int currentSize;
		public int currentCodeBits;
		
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
			
			// Add special zero-length Clear and Stop symbols
			for (int i = 0; i <= 2; i++)
				symbolStarts[alphaSz + i] = alphaSz;
			
			resetEntries();
		}
		
		
		public void resetEntries() {
			currentSize = alphabetSize + 2;  // Alphabet plus Clear and Stop symbols
			currentCodeBits = 32 - Integer.numberOfLeadingZeros(currentSize - 1);  // ceil(log2(currentSize))
			Arrays.fill(symbolStarts, currentSize + 1, symbolStarts.length, -1);  // Mark unused entries
		}
		
		
		public void fillPlaceholderEntry(int prevSymbol, int curSymbol) {
			// Check arguments
			if (symbolStarts[currentSize] != -1) {
				if (currentSize >= MAX_ENTRIES)
					return;
				else
					throw new IllegalStateException();
			}
			if (!(0 <= prevSymbol && prevSymbol < currentSize - 1))
				throw new IllegalArgumentException();
			if (!(0 <= curSymbol && curSymbol < currentSize))
				throw new IllegalArgumentException();
			
			// Compute numbers
			int newEntryLen = symbolStarts[prevSymbol + 1] - symbolStarts[prevSymbol] + 1;
			int newSymbol = currentSize - 1;
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
			if (!(0 <= symbol && symbol < currentSize))
				throw new IllegalArgumentException();
			Objects.requireNonNull(out);
			int start = symbolStarts[symbol];
			int end = symbolStarts[symbol + 1];
			out.write(symbolBytes, start, end - start);
		}
		
		
		public void addPlaceholderEntry() {
			if (currentSize < MAX_ENTRIES) {
				if (symbolStarts[currentSize] == -1)
					throw new IllegalStateException();
				if (Integer.bitCount(currentSize) == 1)  // Is power of 2
					currentCodeBits++;
				currentSize++;
			}
		}
		
		
		public static final int MAX_ENTRIES = 4096;
		
	}
	
}
