// DWITE - November 2009 - Problem 4: Breadth First Not Quite Tree
// Solution by Nayuki Minase

import java.util.Arrays;


public final class dwite200911p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA4.txt", "OUT4.txt", new dwite200911p4());
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		int[][] edges = new int[n][2];
		for (int i = 0; i < n; i++) {
			io.tokenizeLine();
			edges[i][0] = io.readIntToken();
			edges[i][1] = io.readIntToken();
		}
		
		int[] nodeLevel = new int[100];
		Arrays.fill(nodeLevel, 999);
		
		// Bellman-Ford algorithm
		nodeLevel[1] = 0;
		for (int i = 0; i < nodeLevel.length; i++) {
			for (int[] edge : edges) {
				nodeLevel[edge[0]] = Math.min(nodeLevel[edge[1]] + 1, nodeLevel[edge[0]]);
				nodeLevel[edge[1]] = Math.min(nodeLevel[edge[0]] + 1, nodeLevel[edge[1]]);
			}
		}
		
		int count = 0;
		for (int[] edge : edges) {
			if (nodeLevel[edge[0]] != -1 && nodeLevel[edge[0]] == nodeLevel[edge[1]])
				count++;
		}
		io.println(count);
	}
	
}
