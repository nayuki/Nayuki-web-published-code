// DWITE - January 2012 - Problem 4: Lego Ladder
// Solution by Nayuki Minase


public final class dwite201201p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA4.txt", "OUT4.txt", new dwite201201p4());
	}
	
	
	protected void runOnce() {
		for (int i = 0; i < 3; i++)
			runOneGame();
		io.println();
	}
	
	
	private void runOneGame() {
		int n = io.readIntLine();
		int[] blocks = new int[n];
		io.tokenizeLine();
		for (int i = 0; i < blocks.length; i++)
			blocks[i] = io.readIntToken();
		
		// Verdict for each game state: 0 = undefined, 1 = lose, 2 = win.
		// Index i represents the game state for the set of blocks where block[j] is present iff i has bit j as 1.
		int[] verdict = new int[1 << n];
		
		// Calculate verdicts in ascending weight so that we can do dynamic programming.
		// Note that for weight <= 2, all positions are necessarily losing.
		for (int weight = 0; weight <= n; weight++) {
			for (int i = 0; i < verdict.length; i++) {
				if (weight(i) == weight) {
					// Check if it's a losing position
					boolean nonincreasing = true;
					boolean nondecreasing = true;
					int prev = -1;
					for (int j = 0; j < n; j++) {
						if (((i >>> j) & 1) != 0) {
							if (prev != -1) {
								nonincreasing &= blocks[j] <= prev;
								nondecreasing &= blocks[j] >= prev;
							}
							prev = blocks[j];
						}
					}
					if (nonincreasing || nondecreasing)
						verdict[i] = 1;
					else {
						// See if we can remove one block to give the next player a losing position
						boolean win = false;
						for (int j = 0; j < n; j++)
							win |= ((i >>> j) & 1) != 0 && verdict[i ^ (1 << j)] == 1;
						if (win)
							verdict[i] = 2;
						else
							verdict[i] = 1;
					}
				}
			}
		}
		
		// See if the starting position is Alice's win or her loss
		switch (verdict[(1 << n) - 1]) {
			case 1:  io.print("B");  break;
			case 2:  io.print("A");  break;
			default:  throw new AssertionError();
		}
	}
	
	
	// Hamming weight - the number of bits in x that are set to 1
	private static int weight(int x) {
		int count = 0;
		while (x != 0) {
			count++;
			x &= x - 1;
		}
		return count;
	}
	
}
