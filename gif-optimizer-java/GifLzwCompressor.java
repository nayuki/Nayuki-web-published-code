/* 
 * Library classes for GIF optimizer (Java)
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/gif-optimizer-java
 */

import java.io.IOException;
import java.util.Arrays;
import java.util.Objects;


/* 
 * Compresses a byte array into GIF's dialect of LZW-encoded data, without making subblocks.
 * Multiple compressor functions are provided, with different time/space trade-offs.
 * The output from every compressor must decompress to the same data.
 */
final class GifLzwCompressor {
	
	/*---- Uncompressed encoder ----*/
	
	/* 
	 * Compresses the given byte array to the given bit output stream using an "uncompressed" strategy.
	 * The compressor only emits codes for literals, never codes for newly added dictionary entries.
	 * The compressor emits dictionary-clear codes periodically to maintain a constant code bit width.
	 * The output length depends on the data length and code bits, but not the data values themselves.
	 */
	public static void encodeUncompressed(byte[] data, int codeSize, BitOutputStream out) throws IOException {
		// Check arguments
		Objects.requireNonNull(data);
		if (codeSize < 2 || codeSize > 8)
			throw new IllegalArgumentException();
		Objects.requireNonNull(out);
		
		// Compute numbers
		final int alphabetSize = 1 << codeSize;
		final int clearCode = alphabetSize;
		final int stopCode = clearCode + 1;
		codeSize++;  // Accommodate Clear and Stop symbols
		
		// Start encoding data
		out.writeBits(clearCode, codeSize);
		int numNewEntries = 0;
		for (int b : data) {
			b &= 0xFF;
			if (b >= alphabetSize)
				throw new IllegalArgumentException("Byte value out of range");
			out.writeBits(b, codeSize);  // Write the byte as a literal symbol
			
			// Periodically clear dictionary to avoid codeSize increasing
			numNewEntries++;
			if (numNewEntries >= alphabetSize - 2) {
				out.writeBits(clearCode, codeSize);
				numNewEntries = 0;
			}
		}
		out.writeBits(stopCode, codeSize);
	}
	
	
	/*---- Optimizing encoder ----*/
	
	/* 
	 * Compresses the given byte array to the given bit output stream using a flexible advanced strategy.
	 * The input array is either treated as a single block, or split into a sequence of blocks where each is
	 * 'blockSize' long (except that the last block can be shorter). The compressor computes the compressed
	 * bit length (using normal LZW compression) of every possible run of blocks, finds the optimal block
	 * boundaries to clear the dictionary to minimize the total bit length, and performs the final encoding.
	 * dictClear = -1 allows the dictionary to fill up, otherwise dictClear in the range [7, 4096] forces
	 * the LZW encoder to emit a clear code immediately upon the dictionary reaching that size.
	 */
	public static void encodeOptimized(byte[] data, int codeSize, int blockSize, int dictClear, BitOutputStream out, boolean print) throws IOException {
		// Check arguments
		Objects.requireNonNull(data);
		if (codeSize < 2 || codeSize > 8)
			throw new IllegalArgumentException();
		if (blockSize <= 0 || dictClear < -1)
			throw new IllegalArgumentException();
		Objects.requireNonNull(out);
		
		if (data.length == 0) {
			out.writeBits((1 << codeSize) + 1, codeSize + 1);  // Stop code
			return;
		}
		int numBlocks = (data.length + blockSize - 1) / blockSize;  // ceil(length / blockSize)
		assert numBlocks >= 1;
		
		long[] minBitLengths = new long[numBlocks];
		int[] numBlocksToEncode = new int[numBlocks];
		for (int i = numBlocks - 1; i >= 0; i--) {
			if (print) System.out.printf("\rOptimizing: %d of %d block ranges", numBlocks - 1 - i, numBlocks);
			byte[] subData = Arrays.copyOfRange(data, i * blockSize, data.length);
			long[] subMinBitLen = Arrays.copyOfRange(minBitLengths, i + 1, minBitLengths.length);
			long[] temp = getLzwEncodedSize(subData, blockSize, codeSize, dictClear, subMinBitLen);
			minBitLengths[i] = temp[0];
			numBlocksToEncode[i] = (int)temp[1];
		}
		if (print) System.out.println();
		
		// Encode and write the LZW blocks
		if (print) System.out.print("Writing pixels - breakpoints: 0");
		out.writeBits(1 << codeSize, codeSize + 1);  // Initial clear code
		int i = 0;
		while (i < numBlocks) {
			int start = i * blockSize;
			i += numBlocksToEncode[i];
			int end = Math.min(i * blockSize, data.length);
			if (print) System.out.print(", " + end);
			encodeLzwBlock(Arrays.copyOfRange(data, start, end), end >= data.length, codeSize, dictClear, out);
		}
		assert i == numBlocks;
		if (print) System.out.println();
	}
	
	
	// Returns the pair (minimum bit length to encode the given data array,
	// number of prefix blocks to encode to achieve the minimum), given that:
	// - nextOptimalSizes[0] is the minimum bit length to encode data[1*blockSize : end],
	// - nextOptimalSizes[1] is the minimum bit length to encode data[2*blockSize : end], etc.
	private static long[] getLzwEncodedSize(byte[] data, int blockSize, int codeSize, int dictClear, long[] nextOptimalSizes) {
		if (data.length == 0 || nextOptimalSizes.length != (data.length - 1) / blockSize)
			throw new IllegalArgumentException();
		try {
			long minBitLen = -1;
			int blocksToEncode = -1;
			DictionaryEncoder enc = new DictionaryEncoder(codeSize, dictClear);
			CountingBitOutputStream counter = new CountingBitOutputStream();
			int nextBlockIndex = 1;
			int curBlockEnd = Math.min(nextBlockIndex * blockSize, data.length);
			
			int i = 0;
			while (i < data.length) {
				int matched = enc.encodeNext(data, i, counter);
				i += matched;
				while (i >= curBlockEnd) {
					// Remember, the LZW dictionary contains all prefixes. So even if we encoded
					// more input symbols than the block boundary, it would take the same number of
					// output symbols (and thus bits) to encode exactly up to the block boundary.
					long totalBitLen = counter.length + enc.codeSize;
					if (nextBlockIndex - 1 < nextOptimalSizes.length)
						totalBitLen += nextOptimalSizes[nextBlockIndex - 1];
					if (minBitLen == -1 || totalBitLen < minBitLen) {
						minBitLen = totalBitLen;
						blocksToEncode = nextBlockIndex;
					}
					if (curBlockEnd == data.length)
						break;
					nextBlockIndex++;
					curBlockEnd = Math.min(nextBlockIndex * blockSize, data.length);
				}
			}
			assert i == data.length;
			return new long[]{minBitLen, blocksToEncode};
			
		} catch (IOException e) {
			throw new AssertionError();
		}
	}
	
	
	// Encodes the given block of data using LZW with the given parameters to the given stream.
	private static void encodeLzwBlock(byte[] data, boolean isLast, int codeSize, int dictClear, BitOutputStream out) throws IOException {
		DictionaryEncoder enc = new DictionaryEncoder(codeSize, dictClear);
		int i = 0;
		while (i < data.length)
			i += enc.encodeNext(data, i, out);
		assert i == data.length;
		// End the current block with either Clear or Stop code
		out.writeBits((1 << codeSize) + (isLast ? 1 : 0), enc.codeSize);
	}
	
	
	
	// A helper class with mutable state.
	private static final class DictionaryEncoder {
		
		private static final int MAX_DICT_SIZE = 4096;
		
		private final int initCodeBits;
		private final int alphabetSize;
		private final int dictClear;  // In the range [7, MAX_DICT_SIZE + 1]
		
		private TrieNode root;
		private int size;     // Number of dictionary entries, max 4096
		public int codeSize;  // Equal to ceil(log2(size))
		
		
		public DictionaryEncoder(int codeSize, int dictClear) {
			if (codeSize < 2 || codeSize > 8)
				throw new IllegalArgumentException();
			if (dictClear != -1 && (dictClear < 7 || dictClear > MAX_DICT_SIZE))
				throw new IllegalArgumentException();
			
			initCodeBits = codeSize;
			alphabetSize = 1 << codeSize;
			this.dictClear = (dictClear == -1) ? (MAX_DICT_SIZE + 1) : dictClear;
			
			root = new TrieNode(-1, alphabetSize);  // Root has no symbol
			for (int i = 0; i < root.children.length; i++)
				root.children[i] = new TrieNode(i, alphabetSize);
			clearDictionary();
		}
		
		
		// Returns the number of bytes consumed.
		public int encodeNext(byte[] data, int start, BitOutputStream out) throws IOException {
			// Find longest match in dictionary
			TrieNode node = root;
			int i;
			for (i = start; i < data.length; i++) {
				TrieNode next = node.children[data[i] & 0xFF];
				if (next == null)
					break;
				node = next;
			}
			if (node == root)
				throw new IllegalArgumentException("Byte value out of range");
			
			// Write encoded symbol
			out.writeBits(node.symbol, codeSize);
			
			// Add new dictionary entry
			if (size < MAX_DICT_SIZE) {
				if (i < data.length)  // Only add a physical entry if next symbol is not Clear or Stop
					node.children[data[i] & 0xFF] = new TrieNode(size, alphabetSize);
				// But we must update the size and code bits for the decoder's sake
				if (Integer.bitCount(size) == 1)  // Is a power of 2
					codeSize++;
				size++;
				if (size >= dictClear) {
					out.writeBits(1 << initCodeBits, codeSize);  // Write the clear code
					clearDictionary();
				}
			}
			return i - start;  // Length of match
		}
		
		
		private void clearDictionary() {
			for (TrieNode child : root.children)
				Arrays.fill(child.children, null);
			size = alphabetSize + 2;  // Includes Clear and Stop symbols
			codeSize = initCodeBits + 1;
		}
		
		
		
		private static final class TrieNode {
			
			public final int symbol;
			public TrieNode[] children;
			
			
			public TrieNode(int sym, int alphaSz) {
				symbol = sym;
				children = new TrieNode[alphaSz];
			}
			
		}
		
	}
	
}
