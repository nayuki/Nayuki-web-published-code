// DWITE - October 2009 - Problem 5: Running In Circles
// Solution by Nayuki Minase

import java.util.ArrayList;
import java.util.List;


public final class dwite200910p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5.txt", "OUT5.txt", new dwite200910p5());
	}
	
	
	private Node[] nodes;
	
	
	protected void runOnce() {
		nodes = new Node[101];
		for (int i = 0; i < nodes.length; i++)
			nodes[i] = new Node();
		
		int n = io.readIntLine();
		for (int i = 0; i < n; i++) {
			io.tokenizeLine();
			int from = io.readIntToken();
			int to   = io.readIntToken();
			nodes[from].outEdges.add(nodes[to]);
		}
		
		for (int i = 0; i < nodes.length; i++) {
			for (int j = 0; j < nodes.length; j++)
				nodes[j].visited = false;
			
			int cycleLen = findCycleLength(nodes[i], nodes[i], 0);
			if (cycleLen != -1) {
				io.println(cycleLen);
				return;
			}
		}
		throw new IllegalArgumentException();
	}
	
	
	private int findCycleLength(Node start, Node current, int distance) {
		current.visited = true;
		for (Node next : current.outEdges) {
			if (next == start)
				return distance + 1;
			else if (!next.visited) {
				int temp = findCycleLength(start, next, distance + 1);
				if (temp != -1)
					return temp;
			}
		}
		current.visited = false;
		return -1;
	}
	
	
	
	private static class Node {
		
		public final List<Node> outEdges;
		public boolean visited;
		
		
		public Node() {
			outEdges = new ArrayList<Node>();
			visited = false;
		}
		
	}
	
}
