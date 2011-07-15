// DWITE - December 2005 - Problem 4: Now I Know My ABC's

import dwite.*;


public final class dwite200512p4 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA41.txt", "OUT41.txt", new dwite200512p4());
	}
	
	
	protected void runOnce() {
		// Read input
		String line = io.readLine();
		
		// Count frequencies
		int[] freq = new int[26];
		for (int i = 0; i < line.length(); i++) {
			char c = line.charAt(i);
			if (isLetter(c))
				freq[(c - 'A') % 32]++;
		}
		
		// Write output
		boolean initial = true;
		for (int i = 0; i < freq.length; i++) {
			if (freq[i] != 0) {
				if (initial) initial = false;
				else io.print(":");
				io.printf("%c-%d", (char)('A' + i), freq[i]);
			}
		}
		io.println();
	}
	
	
	private static boolean isLetter(char c) {
		return c >= 'A' && c <= 'Z'
		    || c >= 'a' && c <= 'z';
	}
	
}
