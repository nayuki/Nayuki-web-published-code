/* 
 * Library classes for GIF optimizer (Java)
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/gif-optimizer-java
 */

import java.io.IOException;
import java.util.Arrays;


// Provides different methods for performing GIF's dialect of LZW compression.
// The result from each method will decompress to the same data, of course.
class GifLzwCompressor {
	
	/*---- Simple encoders ----*/
	
	// Uses only literal symbols, and clears the dictionary periodically to prevent the code bit width from changing.
	// When the data length and code bits are the same, the output length is always the same.
	public static void encodeUncompressed(byte[] data, int start, int end, int codeBits, BitOutputStream out) throws IOException {
		if (start < 0 || end < start || end > data.length)
			throw new ArrayIndexOutOfBoundsException();
		if (codeBits < 2 || codeBits > 8)
			throw new IllegalArgumentException();
		
		final int alphabetSize = 1 << codeBits;
		final int clearCode = alphabetSize;
		final int stopCode = clearCode + 1;
		codeBits++;  // To accommodate Clear and Stop codes
		
		out.writeBits(clearCode, codeBits);
		for (int i = start, j = 0; i < end; i++) {
			int b = data[i] & 0xFF;
			if (b >= alphabetSize)
				throw new IllegalArgumentException("Byte value out of range");
			out.writeBits(b, codeBits);  // Write every byte as a literal symbol
			
			// Clear the dictionary periodically to ensure that codeBits does not increase
			j++;
			if (j == alphabetSize - 2) {
				out.writeBits(clearCode, codeBits);
				j = 0;
			}
		}
		out.writeBits(stopCode, codeBits);
	}
	
	
	private static void encodeLzwBlock(byte[] data, int rangeStart, int rangeEnd, int dataEnd, int codeBits, int dictClear, BitOutputStream out) throws IOException {
		if (!(0 <= rangeStart && rangeStart <= rangeEnd && rangeEnd <= dataEnd && dataEnd <= data.length))
			throw new ArrayIndexOutOfBoundsException();
		if (codeBits < 2 || codeBits > 8)
			throw new IllegalArgumentException();
		
		DictionaryEncoder enc = new DictionaryEncoder(codeBits, dictClear);
		final int clearCode = 1 << codeBits;
		final int stopCode = clearCode + 1;
		int i = rangeStart;
		while (i < rangeEnd)
			i += enc.encodeNext(data, i, rangeEnd, out);
		if (i != rangeEnd)
			throw new AssertionError();
		out.writeBits(rangeEnd < dataEnd ? clearCode : stopCode, enc.codeBits);  // Terminate block with Clear or Stop code
	}
	
	
	
	/*---- Optimizing encoder ----*/
	
	// Based on splitting the data into blocks and applying encodeLzwBlock() to each.
	public static void encodeOptimized(byte[] data, int start, int end, int codeBits, int blockSize, int dictClear, BitOutputStream out, boolean print) throws IOException {
		if (start < 0 || end < start || end > data.length)
			throw new ArrayIndexOutOfBoundsException();
		if (codeBits < 2 || codeBits > 8 || blockSize <= 0)
			throw new IllegalArgumentException();
		
		int numBlocks = (end - start + blockSize - 1) / blockSize;  // ceil(length / blockSize)
		if (numBlocks == 0) {  // Requires special handling
			out.writeBits((1 << codeBits) + 1, codeBits + 1);  // Stop code
			return;
		}
		
		// sizes[i][j] is the LZW compressed size (in bits) of encoding j*blockSize bytes starting at offset start+i*blockSize
		long[][] sizes = new long[numBlocks][];
		for (int i = 0, off = start; i < sizes.length; i++, off += blockSize) {
			if (print) System.out.printf("\rOptimizing: %d of %d blocks", i, numBlocks);
			sizes[i] = getLzwEncodedSizes(data, off, blockSize, codeBits, dictClear);
		}
		if (print) System.out.println();
		
		// bestSize[i] represents the minimum LZW compressed size (in bits) of encoding the byte range
		// [start+i*blockSize, start+end) (i.e. the block start up to the end of the array range)
		long[] bestSize = new long[numBlocks];
		int[] bestNumBlocks = new int[numBlocks];
		for (int i = numBlocks - 1; i >= 0; i--) {
			bestSize[i] = sizes[i][numBlocks - i];
			bestNumBlocks[i] = numBlocks - i;
			for (int j = 1; j + i < numBlocks; j++) {  // Dynamic programming
				long size = sizes[i][j] + bestSize[i + j];
				if (size < bestSize[i]) {
					bestSize[i] = size;
					bestNumBlocks[i] = j;
				}
			}
		}
		
		// Encode and write the LZW blocks
		if (print) System.out.print("Writing pixels - breakpoints: 0");
		out.writeBits(1 << codeBits, codeBits + 1);  // Initial clear code
		for (int i = 0; i < numBlocks; ) {
			int st = start + i * blockSize;
			int n = bestNumBlocks[i];
			int ed = Math.min(st + n * blockSize, end);
			if (print) System.out.print(", " + ed);
			encodeLzwBlock(data, st, ed, end, codeBits, dictClear, out);
			i += n;
		}
		if (print) System.out.println();
	}
	
	
	// Returns an array describing the number of bits to encode the byte sequences
	// {data[off : off], data[off : off + blockSize], data[off : off + 2*blockSize], ...}
	// until the last block (which may be a partial block that has [1, blockSize] bytes).
	private static long[] getLzwEncodedSizes(byte[] data, int off, int blockSize, int codeBits, int dictClear) {
		try {
			// result[0] is the bit length of encoding 0 blocks of size 'blockSize' starting at off,
			// result[1] is the bit length of encoding 1 blocks of size 'blockSize' starting at off, etc.
			// result[result.length-1] is the length of encoding everything starting at off.
			long[] result = new long[(data.length - off + blockSize - 1) / blockSize + 1];  // ceil((data.length - off) / blockSize) + 1
			
			DictionaryEncoder enc = new DictionaryEncoder(codeBits, dictClear);
			CountingBitOutputStream counter = new CountingBitOutputStream();
			counter.writeBits(0, enc.codeBits);  // Pre-count the trailing Clear or Stop code that ends any block
			result[0] = counter.length;
			int blockIndex = 1;
			for (int i = off; i < data.length; ) {
				int matched = enc.encodeNext(data, i, data.length, counter);
				i += matched;
				while (i - off >= blockIndex * blockSize) {
					// Remember, the LZW dictionary contains all prefixes. So even if we encoded
					// more input symbols than the block boundary, it would take the same number of
					// output symbols (and thus bits) to encode exactly up to the block boundary.
					result[blockIndex] = counter.length;
					blockIndex++;
				}
			}
			result[result.length - 1] = counter.length;  // Handle last partial block
			return result;
			
		} catch (IOException e) {
			throw new AssertionError();
		}
	}
	
	
	
	private static final class DictionaryEncoder {
		
		private static final int MAX_DICT_SIZE = 4096;
		
		private int initCodeBits;
		private Node root;      // A trie structure
		private int size;       // Number of dictionary entries, max 4096
		public int codeBits;    // Equal to ceil(log2(size))
		private int dictClear;  // -1 for deferred clear code, otherwise in the range [5, 4096]
		
		
		public DictionaryEncoder(int codeBits, int dictClear) {
			if (codeBits < 2 || codeBits > 8)
				throw new IllegalArgumentException();
			initCodeBits = codeBits;
			this.dictClear = dictClear;
			
			size = 1 << initCodeBits;
			root = new Node(-1);  // Root has no symbol
			for (int i = 0; i < size; i++)
				root.children[i] = new Node(i);
			size += 2;  // Add Clear and Stop codes
			this.codeBits = initCodeBits + 1;
		}
		
		
		// Returns the number of bytes consumed.
		public int encodeNext(byte[] data, int start, int end, BitOutputStream out) throws IOException {
			// Find longest match in dictionary
			Node node = root;
			int i;
			for (i = start; i < end; i++) {
				Node next = node.children[data[i] & 0xFF];
				if (next == null)
					break;
				node = next;
			}
			if (node == root)
				throw new IllegalArgumentException("Byte value out of range");
			
			// Write encoded symbol
			out.writeBits(node.symbol, codeBits);
			
			// Add new dictionary entry
			if (size < MAX_DICT_SIZE) {
				if (i < end)  // Only add a physical entry if next symbol is not Clear or Stop
					node.children[data[i] & 0xFF] = new Node(size);
				// But we must update the size and code bits for the decoder's sake
				if ((size & (size - 1)) == 0)  // Is a power of 2
					codeBits++;
				size++;
				if (dictClear != -1 && size >= dictClear) {
					out.writeBits(1 << initCodeBits, codeBits);
					clearDictionary();
				}
			}
			return i - start;  // Length of match
		}
		
		
		private void clearDictionary() {
			for (int i = 0; i < (1 << initCodeBits); i++)
				Arrays.fill(root.children[i].children, null);
			size = (1 << initCodeBits) + 2;  // Reset size and add Clear and Stop codes
			this.codeBits = initCodeBits + 1;
		}
		
		
		
		private static class Node {
			
			public int symbol;
			public Node[] children;
			
			
			public Node(int sym) {
				symbol = sym;
				children = new Node[256];
			}
			
		}
		
	}
	
}
