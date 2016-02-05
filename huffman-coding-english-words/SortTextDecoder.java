/* 
 * Word-based sort coding decoder
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


public final class SortTextDecoder {
	
	public static void main(String[] args) throws IOException {
		// Check arguments
		if (args.length != 2) {
			System.err.println("Usage: java SortTextDecoder Encoded.txt Decoded.txt");
			System.exit(1);
		}
		
		// Variables to carry to next stage
		String text;
		Map<String,String> codewordToWord = new HashMap<String,String>();
		String escapeCode = null;
		
		// Read all of input text file
		BufferedReader in = new BufferedReader(new InputStreamReader(new FileInputStream(args[0]), "UTF-8"));
		try {
			// Read codebook
			while (true) {
				String line = in.readLine();
				if (line == null)
					throw new EOFException();
				if (line.equals("----------"))  // End of codebook
					break;
				String[] parts = line.split(" ", 2);
				codewordToWord.put(parts[0], parts[1]);
				if (parts[1].equals("ESC"))
					escapeCode = parts[0];
			}
			
			// Read payload text
			StringBuilder sb = new StringBuilder();
			while (true) {
				int c = in.read();
				if (c == -1)
					break;
				sb.append((char)c);
			}
			text = sb.toString();
		} finally {
			in.close();
		}
		
		// Write output text file
		Writer out = new OutputStreamWriter(new BufferedOutputStream(new FileOutputStream(args[1])), "UTF-8");
		try {
			for (TextToken tok : TextTokenizer.tokenize(text)) {
				int type = tok.type;
				String val = tok.value;
				if (type == 4)  // Symbol
					out.write(val);
				else if (escapeCode != null && type >= 0 && type <= 3 && val.startsWith(escapeCode))  // Escape
					out.write(val.substring(escapeCode.length()));  // Delete prefix
				else if (type >= 0 && type <= 2) {
					String key = val.toLowerCase();
					if (!codewordToWord.containsKey(key))
						throw new RuntimeException("Codeword not in codebook: " + key);
					String word = codewordToWord.get(key);
					if (type == 1)
						word = word.substring(0, 1).toUpperCase() + word.substring(1);  // To title case
					if (type == 2)
						word = word.toUpperCase();
					out.write(word);
				} else
					throw new RuntimeException("Invalid encoded text");
			}
		} finally {
			out.close();
		}
	}
	
}
