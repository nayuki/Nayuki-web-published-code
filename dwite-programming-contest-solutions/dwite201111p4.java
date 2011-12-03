// DWITE - November 2011 - Problem 4: Bear Trees
// Solution by Nayuki Minase

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;
import java.util.Queue;


public final class dwite201111p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA4.txt", "OUT4.txt", new dwite201111p4());
	}
	
	
	@SuppressWarnings("unchecked")
	protected void runOnce() {
		int n = io.readIntLine();
		final List<Integer>[] neighbors = new List[n];
		for (int i = 0; i < n; i++)
			neighbors[i] = new ArrayList<Integer>();
		
		for (int i = 0; i < n - 1; i++) {
			io.tokenizeLine();
			int x = io.readIntToken();
			int y = io.readIntToken();
			neighbors[x].add(y);
			neighbors[y].add(x);
		}
		
		// Remove backlinks
		treeify(neighbors, 0);

		// Always explore the next eligible node that has the fewest children
		int maxLen = 0;
		Queue<Integer> queue = new PriorityQueue<Integer>(1, new Comparator<Integer>() {
			public int compare(Integer x, Integer y) {
				return ((Integer)neighbors[x].size()).compareTo(neighbors[y].size());
			}
		});
		queue.add(0);
		while (queue.size() > 0) {
			maxLen = Math.max(queue.size(), maxLen);
			int node = queue.remove();
			queue.addAll(neighbors[node]);
		}
		io.println(maxLen);
	}
	
	
	private static void treeify(List<Integer>[] neighbors, int node) {
		for (int neigh : neighbors[node]) {
			neighbors[neigh].remove((Integer)node);
			treeify(neighbors, neigh);
		}
	}
	
}
