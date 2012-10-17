/* 
 * DWITE - November 2011 - Problem 5: Portals Check
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.HashMap;
import java.util.Map;


public final class dwite201111p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5.txt", "OUT5.txt", new dwite201111p5());
	}
	
	
	private Map<String,Integer> nameToNodeId;
	
	
	protected void runOnce() {
		nameToNodeId = new HashMap<String,Integer>();
		DisjointSets ds = new DisjointSets(100000);
		boolean[] hasPortals = new boolean[100000];
		
		int n = io.readIntLine();
		for (int i = 0; i < n; i++) {
			io.tokenizeLine();
			String command = io.readToken();
			int nodeA = getNodeId(io.readToken());
			int nodeB = getNodeId(io.readToken());
			if (command.equals("p")) {
				ds.union(nodeA, nodeB);
				hasPortals[nodeA] = true;
				hasPortals[nodeB] = true;
			} else if (command.equals("q"))
				io.println(ds.find(nodeA) == ds.find(nodeB) && hasPortals[nodeA] ? "connected" : "not connected");
			else
				throw new IllegalArgumentException();
		}
	}
	
	
	private int getNodeId(String name) {
		if (!nameToNodeId.containsKey(name))
			nameToNodeId.put(name, nameToNodeId.size());
		return nameToNodeId.get(name);
	}
	
	
	
	private static final class DisjointSets {
		
		private Node[] nodes;
		
		
		public DisjointSets(int size) {
			nodes = new Node[size];
			for (int i = 0; i < size; i++)
				nodes[i] = new Node();
		}
		
		
		// Returns the representative of node i.
		public Node find(int i) {
			Node node = nodes[i];
			if (node.parent == node)
				return node;
			else {
				Node temp = node;
				while (temp.parent != temp)
					temp = temp.parent;
				node.parent = temp;  // Path compression
				return temp;
			}
		}
		
		
		// Combines the set that node i belongs to and the set that node j belongs to.
		public void union(int i, int j) {
			Node x = find(i);
			Node y = find(j);
			if (x == y)
				return;
			else if (x.rank < y.rank)
				x.parent = y;
			else if (x.rank > y.rank)
				y.parent = x;
			else {
				x.parent = y;
				y.rank++;
			}
		}
		
	}
	
	
	
	private static class Node {
		
		public Node parent;
		public int rank;
		
		
		public Node() {
			parent = this;
			rank = 0;
		}
		
	}
	
}
