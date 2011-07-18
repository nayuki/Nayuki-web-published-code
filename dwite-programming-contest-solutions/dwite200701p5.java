// DWITE - January 2007 - Problem 5: Dutch Solitaire
// Solution by Nayuki Minase

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;


public final class dwite200701p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA51.txt", "OUT51.txt", new dwite200701p5());
	}
	
	
	protected void runOnce() {
		// Read input
		io.tokenizeLine();
		io.readToken();  // Discard N, the number of candies
		int piles = io.readIntToken();
		List<Integer> state = new ArrayList<Integer>();
		for (int i = 0; i < piles; i++)
			state.add(io.readIntToken());
		
		// Compute and write output
		Collections.sort(state, Collections.reverseOrder());
		Set<List<Integer>> paststates = new HashSet<List<Integer>>();
		paststates.add(state);
		for (int i = 0; i < 100; i++) {
			List<Integer> nextstate = new ArrayList<Integer>();
			int newpile = 0;
			for (int candies : state) {  // Note: All elements of 'state' are positive
				newpile++;
				if (candies > 1)
					nextstate.add(candies - 1);
			}
			nextstate.add(newpile);
			Collections.sort(nextstate, Collections.reverseOrder());
			
			if (nextstate.equals(state)) {
				io.printf("WIN-%d%n", i);
				break;
			}
			if (paststates.contains(nextstate)) {
				io.printf("LOSS-%d%n", i + 1);
				break;
			}
			
			paststates.add(nextstate);
			state = nextstate;
		}
	}
	
}
