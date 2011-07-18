// DWITE - February 2011 - Problem 4: New type of wordplay
// Solution by Nayuki Minase


public final class dwite201102p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA4.txt", "OUT4.txt", new dwite201102p4());
	}
	
	
	private String word;
	
	// Memoization
	private boolean[][] isSolvableInitialized;
	private boolean[][] isSolvable;
	
	
	protected void runOnce() {
		io.tokenizeLine();
		for (int i = 0; i < 5; i++)
			io.print(isSolvable(io.readToken()) ? "S" : "U");
		io.println();
	}
	
	
	private boolean isSolvable(String word) {
		this.word = word;
		int len = word.length();
		isSolvableInitialized = new boolean[len + 1][len + 1];
		isSolvable = new boolean[len + 1][len + 1];
		return isSolvable(0, len);
	}
	
	
	private boolean isSolvable(int start, int end) {
		if (!isSolvableInitialized[start][end]) {
			boolean result;
			
			if (start > end)  // Invalid substring
				throw new IndexOutOfBoundsException();
			
			else if (start == end)  // Empty string
				result = true;
			
			else if (end - start == 1)  // Single character
				result = false;
			
			else {  // Two or more characters
				result = false;
				
				// If first and last characters match, then check if the word has the form "c...c <solvable middle> c...c".
				if (word.charAt(start) == word.charAt(end - 1)) {
					int i = start;
					while (i < end && word.charAt(start) == word.charAt(i))  // Find head run
						i++;
					
					int j = end;
					while (j > i && word.charAt(end - 1) == word.charAt(j - 1))  // Find tail run
						j--;
					
					// Now, word[i..j] does not contain the matching head and tail runs.
					// e.g. If word == "aabcda", then word[i..j] == "bcd".
					result |= isSolvable(i, j);
				}
				
				// Check if the word has the form "<solvable part> <solvable part>"
				for (int i = start + 1; i < end; i++)
					result |= isSolvable(start, i) && isSolvable(i, end);
				
				// Check if the word has the form "<solvable part ending with c> <solvable part> c"
				for (int i = start + 1; i < end; i++) {
					if (word.charAt(i - 1) == word.charAt(end - 1))
						result |= isSolvable(start, i) && isSolvable(i, end - 1);
				}
			}
			
			isSolvable[start][end] = result;
			isSolvableInitialized[start][end] = true;
		}
		return isSolvable[start][end];
	}
	
}
