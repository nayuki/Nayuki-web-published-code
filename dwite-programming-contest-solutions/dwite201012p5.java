// DWITE - December 2010 - Problem 5: E-Searching
// Solution by Nayuki Minase

import java.util.ArrayList;
import java.util.List;


public final class dwite201012p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5.txt", "OUT5.txt", new dwite201012p5());
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		List<String> dict = new ArrayList<String>();
		for (int i = 0; i < n; i++)
			dict.add(io.readLine());
		
		for (int i = 0; i < 5; i++)
			runQuery(dict);
	}
	
	
	private void runQuery(List<String> dict) {
		String query = io.readLine();
		boolean head = true;
		for (String word : dict) {
			boolean isMatch = isMatch(word, query);
			if (isMatch) {
				if (head) head = false;
				else io.print(", ");
				io.print(word);
			}
		}
		if (head)
			io.print("NO MATCH");
		io.println();
	}
	
	
	// Implements an non-deterministic finite automaton (NFA)
	// For reference, read http://swtch.com/~rsc/regexp/regexp1.html
	private static boolean isMatch(String input, String pattern) {
		boolean[] inState = new boolean[pattern.length() + 1];
		inState[0] = true;
		doEpsilonTransitions(inState, pattern);
		
		// For each letter in the input
		for (int i = 0; i < input.length(); i++) {
			boolean[] newInState = new boolean[inState.length];
			// For each state except the last
			for (int j = 0; j < pattern.length(); j++) {
				if (inState[j]) {
					if (pattern.charAt(j) == '?')
						newInState[j + 1] = true;
					else if (pattern.charAt(j) == '*')
						newInState[j] = true;
					else if (pattern.charAt(j) == input.charAt(i))
						newInState[j + 1] = true;
				}
			}
			inState = newInState;
			doEpsilonTransitions(inState, pattern);
		}
		return inState[pattern.length()];
	}
	
	
	private static void doEpsilonTransitions(boolean[] inState, String pattern) {
		for (int i = 0; i < pattern.length(); i++) {
			if (inState[i] && pattern.charAt(i) == '*')
				inState[i + 1] = true;
		}
	}
	
}
