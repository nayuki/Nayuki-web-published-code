// DWITE - February 2005 - Problem 4: Matrix Chain Product

import dwite.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;


public final class dwite200502p4 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA41.txt", "OUT41.txt", new dwite200502p4());
	}
	
	
	protected void runOnce() {
		// Read the input of matrix dimensions
		List<Integer> dimensions = new ArrayList<Integer>();
		io.tokenizeLine();
		while (true) {
			int temp = io.readIntToken();
			if (temp == 0)
				break;
			dimensions.add(temp);
		}
		
		// mincost[i][j] is the minimum cost of multiplying the chain of matrices from i (inclusive) to j (inclusive)
		int[][] mincost = new int[dimensions.size() - 1][dimensions.size()];
		int[][] maxcost = new int[dimensions.size() - 1][dimensions.size()];
		
		// Mark everything as uninitialized with -1
		for (int i = 0; i < mincost.length; i++) {
			Arrays.fill(mincost[i], -1);
			Arrays.fill(maxcost[i], -1);
		}
		
		// Dynamic programming lies ahead
		
		// The cost for multiplying a single matrix is zero (note that a matrix has 2 dimensions)
		for (int i = 0; i + 1 < dimensions.size(); i++) {
			mincost[i][i + 1] = 0;
			maxcost[i][i + 1] = 0;
		}
		
		// For each number of consecutive matrices
		for (int i = 2; i < dimensions.size(); i++) {
			// For each starting position
			for (int j = 0; j + i < dimensions.size(); j++) {
				int min = Integer.MAX_VALUE;
				int max = 0;
				// For each split position
				for (int k = 1; k < i; k++) {
					int cost = dimensions.get(j) * dimensions.get(j + k) * dimensions.get(j + i);  // The cost of the current operation
					min = Math.min(cost + mincost[j][j + k] + mincost[j + k][j + i], min);
					max = Math.max(cost + maxcost[j][j + k] + maxcost[j + k][j + i], max);
				}
				mincost[j][j + i] = min;
				maxcost[j][j + i] = max;
			}
		}
		
		// Write the output
		io.printf("%d %d%n", mincost[0][dimensions.size() - 1], maxcost[0][dimensions.size() - 1]);
	}
	
}
