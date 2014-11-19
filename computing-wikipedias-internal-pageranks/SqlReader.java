/* 
 * Computing Wikipedia's internal PageRanks
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/computing-wikipedias-internal-pageranks
 */

import java.io.BufferedReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;


// Parses SQL "INSERT INTO" statements from a text input stream.
final class SqlReader {
	
	private final String prefix;
	private final String suffix;
	
	private BufferedReader in;
	
	
	
	public SqlReader(BufferedReader in, String tableName) {
		this.in = in;
		prefix = "INSERT INTO `" + tableName + "` VALUES ";
		suffix = ";";
	}
	
	
	
	// Returns a list of tuples, or null at the end of the stream.
	public List<List<Object>> readInsertionTuples() throws IOException {
		while (true) {
			String line = in.readLine();
			if (line == null)
				return null;
			else if (line.equals("") || line.startsWith("--"))  // SQL comment lines
				continue;
			else if (!(line.startsWith(prefix) && line.endsWith(suffix)))  // Other SQL lines
				continue;
			
			// Current line has the form: "INSERT into `tablename` VALUES (...),(...),...,(...);"
			return parseTuples(line.substring(prefix.length(), line.length() - 1));
		}
	}
	
	
	public void close() throws IOException {
		in.close();
	}
	
	
	private static List<List<Object>> parseTuples(String line) {
		List<List<Object>> result = new ArrayList<List<Object>>();
		
		// Finite-state machine (ugly)
		int state = 0;
		List<Object> tuple = new ArrayList<Object>();
		int tokenStart = -1;
		for (int i = 0; i < line.length(); i++) {
			char c = line.charAt(i);
			switch (state) {
				// Outside tuple, expecting '('
				case 0:
					if (c == '(')
						state = 1;
					else
						throw new IllegalArgumentException();
					break;
				
				// Inside tuple, expecting item or close
				case 1:
					if (c >= '0' && c <= '9' || c == '-' || c == '.')
						state = 2;
					else if (c == '\'')
						state = 3;
					else if (c == 'N')
						state = 5;
					else if (c == ')') {
						result.add(tuple);
						tuple = new ArrayList<Object>();
						state = 8;
					} else
						throw new IllegalArgumentException();
					tokenStart = i;
					if (state == 3)
						tokenStart++;
					break;
				
				// Accumulating number
				case 2:
					if (c >= '0' && c <= '9' || c == '-' || c == '.');
					else if (c == ',' || c == ')') {
						String s = line.substring(tokenStart, i);
						tokenStart = -1;
						if (s.indexOf(".") == -1)
							tuple.add(new Integer(s));
						else
							tuple.add(new Double(s));
						if (c == ',')
							state = 7;
						else if (c == ')') {
							result.add(tuple);
							tuple = new ArrayList<Object>();
							state = 8;
						}
					} else
						throw new IllegalArgumentException();
					break;
				
				// Accumulating string
				case 3:
					if (c == '\'') {
						String s = line.substring(tokenStart, i);
						tokenStart = -1;
						if (s.indexOf('\\') != -1)
							s = s.replaceAll("\\\\(.)", "$1");  // Unescape backslashed characters
						else
							s = new String(s);  // For Java below version 7.0 update 6
						tuple.add(s);
						state = 6;
					} else if (c == '\\')
						state = 4;
					break;
				
				// Accumulating string immediately after '\'
				case 4:
					if (c == '\'' || c == '"' || c == '\\')
						state = 3;
					else
						throw new IllegalArgumentException();
					break;
				
				// Accumulating unquoted symbol
				case 5:
					if (c >= 'A' && c <= 'Z');
					else if (c == ',' || c == ')') {
						if (line.substring(tokenStart, i).equals("NULL"))
							tuple.add(null);
						else
							throw new IllegalArgumentException();
						tokenStart = -1;
						if (c == ',')
							state = 7;
						else if (c == ')') {
							result.add(tuple);
							tuple = new ArrayList<Object>();
							state = 8;
						}
					} else
						throw new IllegalArgumentException();
					break;
				
				// Inside tuple, expecting comma or ')'
				case 6:
					if (c == ',')
						state = 7;
					else if (c == ')') {
						result.add(tuple);
						tuple = new ArrayList<Object>();
						state = 8;
					} else
						throw new IllegalArgumentException();
					break;
				
				// Inside tuple, expecting item
				case 7:
					if (c >= '0' && c <= '9' || c == '-' || c == '.')
						state = 2;
					else if (c == '\'')
						state = 3;
					else if (c == 'N')
						state = 5;
					else
						throw new IllegalArgumentException();
					tokenStart = i;
					if (state == 3)
						tokenStart++;
					break;
				
				// Outside, expecting ',' or end
				case 8:
					if (c == ',')
						state = 9;
					else
						throw new IllegalArgumentException();
					break;
				
				// Outside, expecting '('
				case 9:
					if (c == '(')
						state = 1;
					else
						throw new IllegalArgumentException();
					break;
				
				default:
					throw new AssertionError();
			}
		}
		if (state != 8)
			throw new IllegalArgumentException();
		
		return result;
	}
	
}
