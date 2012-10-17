/* 
 * DWITE - January 2006 - Problem 5: Distance Between Towns
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Queue;


public final class dwite200601p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA51.txt", "OUT51.txt", new dwite200601p5());
	}
	
	
	private Graph graph;
	
	
	public void run() {
		// Read input (the graph)
		int n = io.readIntLine();
		graph = new Graph();
		for (int i = 0; i < n; i++) {
			io.tokenizeLine();
			String edge = io.readToken();
			int dist = io.readIntToken();
			Node a = graph.getOrAddNode(edge.substring(0, 1));
			Node b = graph.getOrAddNode(edge.substring(1, 2));
			a.addEdge(new Edge(b, dist));
			b.addEdge(new Edge(a, dist));
		}
		
		// Process each query
		super.run();
	}
	
	
	protected void runOnce() {
		// Read input
		String line = io.readLine();
		Node src  = graph.getOrAddNode(line.substring(0, 1));
		Node dest = graph.getOrAddNode(line.substring(1, 2));
		
		// Compute shortest path distance using Dijkstra's algorithm
		graph.clearDistances();
		src.distance = 0;
		Queue<Node> queue = new PriorityQueue<Node>();
		queue.offer(src);
		while (true) {
			Node node = queue.poll();
			if (node == null)
				throw new AssertionError("No path exists");
			else if (node == dest)
				break;
			else {
				for (Edge edge : node.edges) {
					int newdist = node.distance + edge.distance;
					if (newdist < edge.destination.distance) {
						edge.destination.distance = newdist;
						queue.offer(edge.destination);
					}
				}
			}
		}
		
		// Write output
		io.println(dest.distance);
	}
	
	
	
	private static class Graph {
		
		private Collection<Node> nodes;
		private Map<String,Node> nodeByName;
		
		
		public Graph() {
			nodes = new ArrayList<Node>();
			nodeByName = new HashMap<String,Node>();
		}
		
		
		public Node getOrAddNode(String name) {
			if (!nodeByName.containsKey(name)) {
				Node node = new Node(name);
				nodes.add(node);
				nodeByName.put(name, node);
			}
			return nodeByName.get(name);
		}
		
		
		public void clearDistances() {
			for (Node node : nodes)
				node.distance = Integer.MAX_VALUE;
		}
		
	}
	
	
	
	private static class Node implements Comparable<Node> {
		
		public final String name;
		
		private Collection<Edge> edges;
		public int distance;
		
		
		public Node(String name) {
			this.name = name;
			edges = new ArrayList<Edge>();
			distance = -1;
		}
		
		
		public void addEdge(Edge e) {
			edges.add(e);
		}
		
		
		public int compareTo(Node other) {
			if (distance < other.distance)
				return -1;
			else if (distance > other.distance)
				return  1;
			else
				return  0;
		}
		
		
		public String toString() {
			return String.format("Node %s", name);
		}
		
	}
	
	
	
	private static class Edge {
		
		public final Node destination;
		public final int distance;
		
		
		public Edge(Node dest, int dist) {
			distance = dist;
			destination = dest;
		}
		
		
		public String toString() {
			return String.format("Edge to %s (distance %d)", destination.name, distance);
		}
		
	}
	
}
