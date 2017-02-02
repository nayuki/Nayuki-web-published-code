/* 
 * Library classes for GIF optimizer (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gif-optimizer-java
 */

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Arrays;


// Decompresses GIF's dialect of LZW-encoded data. Requires prior unpacking of GIF subblocks.
final class GifLzwDecompressor {
	
	// Static method for decompression.
	public static byte[] decode(BitInputStream in, int codeBits) throws IOException {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		new GifLzwDecompressor(in, 1 << codeBits, out);
		return out.toByteArray();
	}
	
	
	
	/* Stateful decompressor object */
	
	private static final int MAX_DICT_SIZE = 4096;
	
	private final int alphabetSize;
	private final int[] symbolStart;
	private int curDictSize;
	private int curCodeBits;
	
	
	private GifLzwDecompressor(BitInputStream in, int alphaSize, OutputStream out) throws IOException {
		// Initialize dictionary with literals
		symbolStart = new int[MAX_DICT_SIZE + 1];
		byte[] dictionary = new byte[alphaSize];  // Minimum initial size
		for (int i = 0; i < alphaSize; i++) {
			symbolStart[i] = i;
			dictionary[i] = (byte)i;
		}
		
		// Clear and Stop symbols shall be zero-length
		for (int i = 0; i <= 2; i++)
			symbolStart[alphaSize + i] = alphaSize;
		
		// Initialize other fields
		alphabetSize = alphaSize;
		clearDictionary();
		
		// Start decoding
		final int clearCode = alphaSize;
		final int stopCode = clearCode + 1;
		int prevSymbol = -1;
		while (true) {
			// Process next symbol
			int symbol = in.readBits(curCodeBits);
			if (symbol >= curDictSize)
				throw new IllegalArgumentException("Symbol out of range");
			else if (symbol == stopCode)
				break;
			else if (symbol == clearCode) {
				clearDictionary();
				prevSymbol = -1;
			}
			else {
				// Add new entry to dictionary
				if (prevSymbol != -1 && symbolStart[MAX_DICT_SIZE] == -1) {
					int newSym = curDictSize - 1;
					int len = symbolStart[prevSymbol + 1] - symbolStart[prevSymbol] + 1;
					int newStart = symbolStart[newSym];
					while (newStart + len > dictionary.length)  // Ensure capacity
						dictionary = Arrays.copyOf(dictionary, dictionary.length * 2);
					System.arraycopy(dictionary, symbolStart[prevSymbol], dictionary, newStart, len - 1);
					dictionary[newStart + len - 1] = symbol < newSym ? dictionary[symbolStart[symbol]] : dictionary[symbolStart[prevSymbol]];
					symbolStart[newSym + 1] = newStart + len;
				}
				
				int start = symbolStart[symbol];
				int end = symbolStart[symbol + 1];
				out.write(dictionary, start, end - start);
				prevSymbol = symbol;
				
				if (curDictSize < MAX_DICT_SIZE) {
					// Increment the dictionary size without yet knowing what the encoder just added
					if ((curDictSize & (curDictSize - 1)) == 0)  // Is power of 2
						curCodeBits++;
					curDictSize++;
				}
			}
		}
	}
	
	
	private void clearDictionary() {
		// Calculate code bits
		curDictSize = alphabetSize + 2;  // Plus Clear and Stop symbols
		curCodeBits = 0;  // Always equal to ceil(log2(curDictSize))
		while ((1 << curCodeBits) < curDictSize)
			curCodeBits++;
		
		// Erase indexes to dictionary entries
		Arrays.fill(symbolStart, curDictSize + 1, symbolStart.length, -1);
	}
	
}
