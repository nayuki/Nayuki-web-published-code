// DWITE - January 2012 - Problem 3: Breaking Bonds
// Solution by Nayuki Minase

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;


public final class dwite201201p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite201201p3());
	}
	
	
	private List<Edge>[] neighbors;
	
	private boolean[] visited;
	
	
	@SuppressWarnings("unchecked")
	protected void runOnce() {
		// Read input
		io.tokenizeLine();
		int nodes = io.readIntToken();
		int edges = io.readIntToken();
		neighbors = new List[nodes];
		visited = new boolean[nodes];
		for (int i = 0; i < neighbors.length; i++)
			neighbors[i] = new ArrayList<Edge>();
		for (int i = 0; i < edges; i++) {
			io.tokenizeLine();
			int a = io.readIntToken() - 1;
			int b = io.readIntToken() - 1;
			neighbors[a].add(new Edge(i, b));
			neighbors[b].add(new Edge(i, a));
		}
		
		// Analyze graph
		int disconnected = 0;
		for (int i = 0; i < edges; i++) {
			Arrays.fill(visited, false);
			exploreGraph(0, i);
			for (boolean b : visited) {
				if (!b) {
					disconnected++;
					break;
				}
			}
		}
		io.println(disconnected);
	}
	
	
	private void exploreGraph(int node, int disabledEdge) {
		visited[node] = true;
		for (Edge edge : neighbors[node]) {
			if (!visited[edge.target] && edge.id != disabledEdge)
				exploreGraph(edge.target, disabledEdge);
		}
	}
	
	
	
	private static class Edge {
		
		public final int id;
		public final int target;
		
		
		public Edge(int id, int target) {
			this.id = id;
			this.target = target;
		}
		
	}
	
}
