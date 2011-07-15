// DWITE - December 2005 - Problem 5: How Many Sums

import dwite.*;

import java.util.HashMap;
import java.util.Map;


public final class dwite200512p5 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA51.txt", "OUT51.txt", new dwite200512p5());
	}
	
	
	protected void runOnce() {
		int total = Integer.parseInt(io.readLine());
		int n = Integer.parseInt(io.readLine());
		io.tokenizeLine();
		// 'instances' maps a number to the number of instances of it available
		Map<Integer,Integer> instances = new HashMap<Integer,Integer>();
		for (int i = 0; i < n; i++) {
			int x = io.readIntToken();
			if (!instances.containsKey(x))
				instances.put(x, 0);
			instances.put(x, instances.get(x) + 1);
		}
		
		// Subset sum problem using dynamic programming
		int[] sums = new int[total + 1];
		sums[0] = 1;
		// For each number
		for (int x : instances.keySet()) {
			int inst = instances.get(x);
			// For each starting point
			for (int j = total; j >= 0; j--) {
				// For each number of instances
				for (int k = 1; k <= inst && j + k * x <= total; k++)
					sums[j + k * x] += sums[j];
			}
		}
		io.println(sums[total]);
	}
	
}
