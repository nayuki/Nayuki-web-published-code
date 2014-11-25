/* 
 * Fast DEFLATE implementation
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/simple-deflate-implementation
 */

import static org.junit.Assert.assertArrayEquals;
import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.util.zip.DataFormatException;
import org.junit.Test;


public final class InflaterTest {
	
	/* Test cases */
	
	@Test(expected=EOFException.class)
	public void testEofStartOfBlock() throws IOException, DataFormatException {
		// No blocks
		test("", "");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testReservedBlockType() throws IOException, DataFormatException {
		// Reserved block type
		test("1 11 00000", "");
	}
	
	
	@Test(expected=EOFException.class)
	public void testEofInBlockType() throws IOException, DataFormatException {
		// Partial block type
		test("1 0", "");
	}
	
	
	@Test
	public void testUncompressedEmpty() throws IOException, DataFormatException {
		// Uncompressed block len=0: (empty)
		test("1 00 00000   0000000000000000 1111111111111111", "");
	}
	
	
	@Test
	public void testUncompressedThreeBytes() throws IOException, DataFormatException {
		// Uncompressed block len=3: 05 14 23
		test("1 00 00000   1100000000000000 0011111111111111   10100000 00101000 11000100", "05 14 23");
	}
	
	
	@Test
	public void testUncompressedTwoBlocks() throws IOException, DataFormatException {
		// Uncompressed block len=1: 05
		// Uncompressed block len=2: 14 23
		test("0 00 00000   0100000000000000 1011111111111111   10100000 00101000   1 00 00000   1000000000000000 0111111111111111   11000100", "05 14 23");
	}
	
	
	@Test(expected=EOFException.class)
	public void testUncompressedEofBeforeLength() throws IOException, DataFormatException {
		// Uncompressed block (partial padding) (no length)
		test("1 00 000", "");
	}
	
	
	@Test(expected=EOFException.class)
	public void testUncompressedEofInLength() throws IOException, DataFormatException {
		// Uncompressed block (partial length)
		test("1 00 00000 0000000000", "");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testUncompressedMismatchedLength() throws IOException, DataFormatException {
		// Uncompressed block (mismatched len and nlen)
		test("1 00 00000 0010000000010000 1111100100110101", "");
	}
	
	
	@Test(expected=EOFException.class)
	public void testUncompressedEofInData() throws IOException, DataFormatException {
		// Uncompressed block len=6: 55 EE (End)
		test("1 00 11111 0110000000000000 1001111111111111 10101010 01110111", "");
	}
	
	
	@Test(expected=EOFException.class)
	public void testUncompressedBlockNoFinalBlock() throws IOException, DataFormatException {
		// Uncompressed block len=0: (empty)
		// No final block
		test("0 00 00000   0000000000000000 1111111111111111", "");
	}
	
	
	@Test
	public void testUncompressedBlockNoDiscardBits() throws IOException, DataFormatException {
		// Fixed Huffman block: 90 A1 FF End
		// Uncompressed block len=2: AB CD
		test("0 10 110010000 110100001 111111111 0000000  1 00 0100000000000000 1011111111111111 11010101 10110011", "90 A1 FF AB CD");
	}
	
	
	@Test
	public void testFixedHuffmanEmpty() throws IOException, DataFormatException {
		// Fixed Huffman block: End
		test("1 10 0000000", "");
	}
	
	
	@Test
	public void testFixedHuffmanLiterals() throws IOException, DataFormatException {
		// Fixed Huffman block: 00 80 8F 90 C0 FF End
		test("1 10 00110000 10110000 10111111 110010000 111000000 111111111 0000000", "00 80 8F 90 C0 FF");
	}
	
	
	@Test
	public void testFixedHuffmanNonOverlappingRun() throws IOException, DataFormatException {
		// Fixed Huffman block: 00 01 02 (3,3) End
		test("1 10 00110000 00110001 00110010 0000001 00010 0000000", "00 01 02 00 01 02");
	}
	
	
	@Test
	public void testFixedHuffmanOverlappingRun0() throws IOException, DataFormatException {
		// Fixed Huffman block: 01 (1,4) End
		test("1 10 00110001 0000010 00000 0000000", "01 01 01 01 01");
	}
	
	
	@Test
	public void testFixedHuffmanOverlappingRun1() throws IOException, DataFormatException {
		// Fixed Huffman block: 8E 8F (2,5) End
		test("1 10 10111110 10111111 0000011 00001 0000000", "8E 8F 8E 8F 8E 8F 8E");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testFixedHuffmanInvalidLengthCode286() throws IOException, DataFormatException {
		// Fixed Huffman block: #286
		test("1 10 11000110", "");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testFixedHuffmanInvalidLengthCode287() throws IOException, DataFormatException {
		// Fixed Huffman block: #287
		test("1 10 11000111", "");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testFixedHuffmanInvalidDistanceCode30() throws IOException, DataFormatException {
		// Fixed Huffman block: 00 #257 #30
		test("1 10 00110000 0000001 11110", "");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testFixedHuffmanInvalidDistanceCode31() throws IOException, DataFormatException {
		// Fixed Huffman block: 00 #257 #31
		test("1 10 00110000 0000001 11111", "");
	}
	
	
	@Test(expected=EOFException.class)
	public void testFixedHuffmanEofInHuffmanSymbol() throws IOException, DataFormatException {
		// Fixed Huffman block: (partial symbol)
		test("1 10 00000", "");
	}
	
	
	@Test(expected=EOFException.class)
	public void testFixedHuffmanEofInRunExtensionBits() throws IOException, DataFormatException {
		// Fixed Huffman block: 00 #269+1(partial)
		test("1 10 00110000 0001101 1", "");
	}
	
	
	@Test(expected=EOFException.class)
	public void testFixedHuffmanEofInDistanceExtensionBits() throws IOException, DataFormatException {
		// Fixed Huffman block: 00 #285 #0 #257 #8+00(partial)
		test("1 10 00110000 11000101 00000 0000001 01000 00", "");
	}
	
	
	@Test
	public void testDynamicHuffmanEmpty() throws IOException, DataFormatException {
		// Dynamic Huffman block:
		//   numCodeLen=19
		//     codeLenCodeLen = 0:0, 1:1, 2:0, ..., 15:0, 16:0, 17:0, 18:1
		//   numLitLen=257, numDist=2
		//     litLenCodeLen = 0:1, 1:0, ..., 255:0, 256:1
		//     distCodeLen = 0:1, 1:1
		//   Data: End
		String blockHeader = "1 01";
		String codeCounts = "00000 10000 1111";
		String codeLenCodeLens = "000 000 100 000 000 000 000 000 000 000 000 000 000 000 000 000 000 100 000";
		String codeLens = "0 11111111 10101011 0 0 0";
		String data = "1";
		test(blockHeader + codeCounts + codeLenCodeLens + codeLens + data, "");
	}
	
	
	@Test
	public void testDynamicHuffmanEmptyNoDistanceCode() throws IOException, DataFormatException {
		// Dynamic Huffman block:
		//   numCodeLen=18
		//     codeLenCodeLen = 0:2, 1:2, 2:0, ..., 15:0, 16:0, 17:0, 18:1
		//   numLitLen=257, numDist=1
		//     litLenCodeLen = 0:0, ..., 254:0, 255:1, 256:1
		//     distCodeLen = 0:0
		//   Data: End
		String blockHeader = "1 01";
		String codeCounts = "00000 00000 0111";
		String codeLenCodeLens = "000 000 100 010 000 000 000 000 000 000 000 000 000 000 000 000 000 010";
		String codeLens = "01111111 00101011 11 11 10";
		String data = "1";
		test(blockHeader + codeCounts + codeLenCodeLens + codeLens + data, "");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testDynamicHuffmanCodeLengthRepeatAtStart() throws IOException, DataFormatException {
		// Dynamic Huffman block:
		//   numLitLen=257, numDist=1, numCodeLen=18
		//   codeLenCodeLen = 0:0, 1:1, 2:0, ..., 15:0, 16:1, 17:0, 18:0
		//   Literal/length/distance code lengths: #16+00
		String blockHeader = "1 01";
		String codeCounts = "00000 00000 0111";
		String codeLenCodeLens = "100 000 000 000 000 000 000 000 000 000 000 000 000 000 000 000 000 100";
		String codeLens = "1";
		test(blockHeader + codeCounts + codeLenCodeLens + codeLens, "");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testDynamicHuffmanTooManyCodeLengthItems() throws IOException, DataFormatException {
		// Dynamic Huffman block:
		//   numLitLen=257, numDist=1, numCodeLen=18
		//   codeLenCodeLen = 0:0, 1:1, 2:0, ..., 15:0, 16:0, 17:0, 18:1
		//   Literal/length/distance code lengths: 1 1 #18+1111111 #18+1101100
		String blockHeader = "1 01";
		String codeCounts = "00000 00000 0111";
		String codeLenCodeLens = "000 000 100 000 000 000 000 000 000 000 000 000 000 000 000 000 000 100";
		String codeLens = "0 0 11111111 10011011";
		test(blockHeader + codeCounts + codeLenCodeLens + codeLens, "");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testDynamicHuffmanOverfullCode0() throws IOException, DataFormatException {
		// Dynamic Huffman block:
		//   numLitLen=257, numDist=1, numCodeLen=4
		//   codeLenCodeLen = 0:1, 1:1, 2:1, 3:0
		String blockHeader = "1 01";
		String codeCounts = "00000 00000 0000";
		String codeLenCodeLens = "100 100 100 000";
		String padding = "0000000000000000000";
		test(blockHeader + codeCounts + codeLenCodeLens + padding, "");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testDynamicHuffmanOverfullCode1() throws IOException, DataFormatException {
		// Dynamic Huffman block:
		//   numLitLen=257, numDist=1, numCodeLen=4
		//   codeLenCodeLen = 0:1, 1:1, 2:1, 3:1
		String blockHeader = "1 01";
		String codeCounts = "00000 00000 0000";
		String codeLenCodeLens = "100 100 100 100";
		String padding = "0000000000000000000";
		test(blockHeader + codeCounts + codeLenCodeLens + padding, "");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testDynamicHuffmanUnpairedCode() throws IOException, DataFormatException {
		// Dynamic Huffman block:
		//   numLitLen=257, numDist=1, numCodeLen=4
		//   codeLenCodeLen = 0:1, 1:2, 2:3, 3:0
		String blockHeader = "1 01";
		String codeCounts = "00000 00000 0000";
		String codeLenCodeLens = "100 010 110 000";
		String padding = "0000000000000000000";
		test(blockHeader + codeCounts + codeLenCodeLens + padding, "");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testDynamicHuffmanEmptyCode() throws IOException, DataFormatException {
		// Dynamic Huffman block:
		//   numLitLen=257, numDist=1, numCodeLen=4
		//   codeLenCodeLen = 0:0, 1:0, 2:0, 3:0
		String blockHeader = "1 01";
		String codeCounts = "00000 00000 0000";
		String codeLenCodeLens = "000 000 000 000";
		String padding = "0000000000000000000";
		test(blockHeader + codeCounts + codeLenCodeLens + padding, "");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testDynamicHuffmanUnderfullCode0() throws IOException, DataFormatException {
		// Dynamic Huffman block:
		//   numLitLen=257, numDist=1, numCodeLen=4
		//   codeLenCodeLen = 0:0, 1:0, 2:1, 3:0
		String blockHeader = "1 01";
		String codeCounts = "00000 00000 0000";
		String codeLenCodeLens = "000 000 100 000";
		String padding = "0000000000000000000";
		test(blockHeader + codeCounts + codeLenCodeLens + padding, "");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testDynamicHuffmanUnderfullCode1() throws IOException, DataFormatException {
		// Dynamic Huffman block:
		//   numLitLen=257, numDist=1, numCodeLen=4
		//   codeLenCodeLen = 0:2, 1:1, 2:0, 3:0
		String blockHeader = "1 01";
		String codeCounts = "00000 00000 0000";
		String codeLenCodeLens = "010 100 000 000";
		String padding = "0000000000000000000";
		test(blockHeader + codeCounts + codeLenCodeLens + padding, "");
	}
	
	
	@Test(expected=DataFormatException.class)
	public void testDynamicHuffmanUseOfNullDistanceCode() throws IOException, DataFormatException {
		// Dynamic Huffman block:
		//   numLitLen=258, numDist=1, numCodeLen=18
		//   codeLenCodeLen = 0:2, 1:2, 2:2, ..., 15:0, 16:0, 17:0, 18:2
		//   Literal/length/distance code lengths: 2 #18+1111111 #18+1101100 1 2 0
		//   Data: 00 #257
		String blockHeader = "1 01";
		String codeCounts = "10000 00000 0111";
		String codeLenCodeLens = "000 000 010 010 000 000 000 000 000 000 000 000 000 000 000 010 000 010";
		String codeLens = "10 111111111 110101011 01 10 00";
		String data = "10 11";
		String padding = "0000000000000000";
		test(blockHeader + codeCounts + codeLenCodeLens + codeLens + data + padding, "");
	}
	
	
	
	/* Utility method */
	
	// 'input' is a string of 0's and 1's (with optional spaces) representing the input bit sequence.
	// 'refOutput' is a string of pairs of hexadecimal digits (with optional spaces) representing
	// the expected decompressed output byte sequence.
	private static void test(String input, String refOutput) throws IOException, DataFormatException {
		refOutput = refOutput.replace(" ", "");
		if (refOutput.length() % 2 != 0)
			throw new IllegalArgumentException();
		byte[] refOut = new byte[refOutput.length() / 2];
		for (int i = 0; i < refOut.length; i++)
			refOut[i] = (byte)Integer.parseInt(refOutput.substring(i * 2, (i + 1) * 2), 16);
		
		input = input.replace(" ", "");
		while (input.length() % 8 != 0)
			input += "0";
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		new Inflater(new StringInputStream(input), out);
		assertArrayEquals(refOut, out.toByteArray());
	}
	
}
