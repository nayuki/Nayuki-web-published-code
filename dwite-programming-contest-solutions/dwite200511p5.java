// DWITE - November 2005 - Problem 5: Base64 Encoding

import dwite.*;


public final class dwite200511p5 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA51.txt", "OUT51.txt", new dwite200511p5());
	}
	
	
	protected void runOnce() {
		String line = io.readLine();
		for (int i = 0; i < line.length(); i += 4) {
			int word = 0;  // 24 bits
			for (int j = 0; j < 4; j++)
				word = word << 6 | fromBase64(line.charAt(i + j));
			
			String str;
			if      (line.charAt(i + 3) != '=') str = toString(word, 3);
			else if (line.charAt(i + 2) != '=') str = toString(word, 2);
			else if (line.charAt(i + 1) != '=') str = toString(word, 1);
			else throw new AssertionError("Invalid Base64-encoded string");
			io.print(str);
		}
		io.println();
	}
	
	
	private static int fromBase64(char c) {
		if (c >= 'A' && c <= 'Z') return c - 'A' +  0;
		if (c >= 'a' && c <= 'z') return c - 'a' + 26;
		if (c >= '0' && c <= '9') return c - '0' + 52;
		if (c == '+') return 62;
		if (c == '/') return 63;
		if (c == '=') return  0;
		throw new IllegalArgumentException("Invalid character");
	}
	
	
	private static String toString(int word, int n) {
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < n; i++)
			sb.append((char)(word >>> (2 - i) * 8 & 0xFF));
		return sb.toString();
	}
	
}
