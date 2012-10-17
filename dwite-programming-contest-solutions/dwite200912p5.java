/* 
 * DWITE - December 2009 - Problem 5: Up To Four Colours
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


public final class dwite200912p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5.txt", "OUT5.txt", new dwite200912p5());
	}
	
	
	private Node[] nodes;
	
	private Node[][] edges;
	
	
	protected void runOnce() {
		int n = io.readIntLine();
		List<Node> tempNodes = new ArrayList<Node>();
		List<Node[]> tempEdges = new ArrayList<Node[]>();
		Map<Integer,Node> numberToNode = new HashMap<Integer,Node>();
		for (int i = 0; i < n; i++) {
			io.tokenizeLine();
			int node0 = io.readIntToken();
			int node1 = io.readIntToken();
			if (node0 == node1)
				continue;
			if (!numberToNode.containsKey(node0)) {
				Node node = new Node();
				tempNodes.add(node);
				numberToNode.put(node0, node);
			}
			if (!numberToNode.containsKey(node1)) {
				Node node = new Node();
				tempNodes.add(node);
				numberToNode.put(node1, node);
			}
			tempEdges.add(new Node[]{numberToNode.get(node0), numberToNode.get(node1)});
		}
		nodes = tempNodes.toArray(new Node[tempNodes.size()]);
		edges = tempEdges.toArray(new Node[tempEdges.size()][]);
		
		for (int i = 1; i <= 4; i++) {
			// Clear
			for (int j = 0; j < nodes.length; j++)
				nodes[j].color = -1;
			
			// Test
			if (canColor(i, 0)) {
				io.println(i);
				return;
			}
		}
		io.println(0);
	}
	
	
	private boolean canColor(int n, int i) {
		if (i == nodes.length)
			return true;
		
		for (int j = 0; j < n; j++) {  // Try every color
			nodes[i].color = j;
			if (isValid() && canColor(n, i + 1))
				return true;
		}
		return false;
	}
	
	
	private boolean isValid() {
		for (int i = 0; i < edges.length; i++) {
			if (edges[i][0].color != -1 && edges[i][0].color == edges[i][1].color)
				return false;
		}
		return true;
	}
	
	
	
	private static class Node {
		
		public int color;
		
		
		public Node() {
			color = -1;
		}
		
	}
	
}
