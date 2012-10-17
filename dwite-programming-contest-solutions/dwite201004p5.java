/* 
 * DWITE - April 2010 - Problem 5: Air Travel Planning
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


public final class dwite201004p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5.txt", "OUT5.txt", new dwite201004p5());
	}
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		Map<String,Integer> costs = new HashMap<String,Integer>();
		List<Edge> edges = new ArrayList<Edge>();
		for (int i = 0; i < n; i++) {
			io.tokenizeLine();
			String from = io.readToken();
			String to   = io.readToken();
			int dist = io.readIntToken();
			edges.add(new Edge(from, to, dist));
			costs.put(from, 999);
			costs.put(to  , 999);
		}
		
		// Bellman-Ford algorithm
		costs.put("YYZ", 0);
		for (int i = 0; i < costs.size(); i++) {
			for (Edge edge : edges) {
				int cost = Math.min(costs.get(edge.from) + edge.cost, costs.get(edge.to));
				costs.put(edge.to, cost);
			}
		}
		io.println(costs.get("SEA"));
	}
	
	
	
	private static class Edge {
		
		public final String from;
		public final String to;
		public final int cost;
		
		
		public Edge(String from, String to, int cost) {
			this.from = from;
			this.to = to;
			this.cost = cost;
		}
		
	}
	
}
