/* 
 * DWITE - November 2010 - Problem 2: Seating Arrangement
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.Arrays;


public final class dwite201011p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA2.txt", "OUT2.txt", new dwite201011p2());
	}
	
	
	protected void runOnce() {
		io.tokenizeLine();
		int n = io.readIntToken();
		int p = io.readIntToken();
		boolean[] filled = new boolean[n];  // Whether a seat is filled
		for (int i = 0; i < p; i++) {
			int position = findPlace(filled);
			filled[position] = true;
			if (i == p - 1)
				io.println(position + 1);
		}
	}
	
	
	private static int findPlace(boolean[] filled) {
		int n = filled.length;
		int[] distances = new int[n];
		Arrays.fill(distances, 9999);
		
		// Compute distances from left side
		int dist = 9999;
		for (int i = 0; i < n; i++) {
			if (filled[i])
				dist = 0;
			distances[i] = Math.min(dist, distances[i]);
			dist++;
		}
		
		// Compute distances from right side
		dist = 9999;
		for (int i = n - 1; i >= 0; i--) {
			if (filled[i])
				dist = 0;
			distances[i] = Math.min(dist, distances[i]);
			dist++;
		}
		
		int bestPosition = -1;
		int bestDistance = 0;
		for (int i = 0; i < filled.length; i++) {  // Scan from left
			if (!filled[i] && distances[i] > bestDistance) {
				bestPosition = i;
				bestDistance = distances[i];
			}
		}
		return bestPosition;
	}
	
}
