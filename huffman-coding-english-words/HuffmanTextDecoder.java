/* 
 * Word-based Huffman coding decoder
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/huffman-coding-english-words
 */

import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.EOFException;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.HashMap;
import java.util.Map;


public final class HuffmanTextDecoder {
	
	public static void main(String[] args) throws IOException {
		// Check arguments
		if (args.length != 2) {
			System.err.println("Usage: java HuffmanTextEncoder Encoded.txt Decoded.txt");
			System.exit(1);
		}
		
		// Start reading input text file
		BufferedReader in = new BufferedReader(new InputStreamReader(new FileInputStream(args[0]), "UTF-8"));
		try {
			// Read codebook
			Map<String,String> codewordToWords = new HashMap<String,String>();
			int maxCodeLen = 0;
			while (true) {
				String line = in.readLine();
				if (line == null)
					throw new EOFException();
				if (line.equals("----------"))  // End of codebook
					break;
				String[] parts = line.split(" ", 2);
				codewordToWords.put(parts[0], parts[1]);
				maxCodeLen = Math.max(parts[0].length(), maxCodeLen);
			}
			
			// Write output text file
			Writer out = new OutputStreamWriter(new BufferedOutputStream(new FileOutputStream(args[1])), "UTF-8");
			try {
				StringBuilder code = new StringBuilder();  // Current partial codeword being accumulated
				while (true) {
					int c = in.read();
					if (c == -1) {
						if (code.length() != 0)
							throw new RuntimeException("Unfinished codeword: " + code.toString());
						break;
					} else if (c >= 'A' && c <= 'Z' || c >= 'a' && c <= 'z') {
						code.append((char)c);
						if (codewordToWords.containsKey(code.toString())) {
							out.write(codewordToWords.get(code.toString()));
							code.delete(0, code.length());
						}
						if (code.length() > maxCodeLen) {
							// This is not necessarily the shortest undecodable prefix of the current codeword
							throw new RuntimeException("Undecodable codeword prefix: " + code.toString());
						}
					} else {  // Symbol
						if (code.length() != 0)
							throw new RuntimeException("Unfinished codeword: " + code.toString());
						out.write((char)c);
					}
				}
			} finally {
				out.close();
			}
		} finally {
			in.close();
		}
	}
	
}
