/* 
 * DWITE - November 2010 - Problem 5: Cogwheels
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */


public final class dwite201011p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5.txt", "OUT5.txt", new dwite201011p5());
	}
	
	
	protected void runOnce() {
		io.tokenizeLine();
		int n = io.readIntToken();
		int m = io.readIntToken();
		
		int[][] connections = new int[m][2];  // 0-based indexing
		for (int i = 0; i < m; i++) {
			io.tokenizeLine();
			connections[i][0] = io.readIntToken() - 1;
			connections[i][1] = io.readIntToken() - 1;
		}
		
		// Propagate directions
		char[] directions = new char[n];  // 0-based indexing
		directions[0] = 'A';  // Clockwise
		for (int i = 0; i < n; i++) {
			for (int j = 0; j < m; j++) {
				int a = connections[j][0];
				int b = connections[j][1];
				char dirA = directions[a];
				char dirB = directions[b];
				if      (dirA == 0  ) directions[a] = oppositeDirection(dirB);
				else if (dirB == 0  ) directions[b] = oppositeDirection(dirA);
				else if (dirA == 'L') directions[b] = 'L';
				else if (dirB == 'L') directions[a] = 'L';
				else if (dirA == dirB) { directions[a] = directions[b] = 'L'; }
				// Else a and b do turn and have different directions, do nothing
			}
		}
		
		io.println("" + directions[1] + directions[2]);
	}
	
	
	private static char oppositeDirection(char dir) {
		switch (dir) {
			case 0:    return 0;
			case 'A':  return 'B';
			case 'B':  return 'A';
			case 'L':  return 'L';
			default:   throw new IllegalArgumentException();
		}
	}
	
}
