/* 
 * DWITE - March 2010 - Problem 3: Summary Diff
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;


public final class dwite201003p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite201003p3());
	}
	
	
	protected void runOnce() {
		int m = io.readIntLine();
		int n = io.readIntLine();
		
		Map<String,Integer> file0 = readFile(m);
		Map<String,Integer> file1 = readFile(n);
		io.readLine();  // Discard "---" line
		
		int diff = 0;
		for (String name : file0.keySet()) {
			if (file1.containsKey(name))
				diff += Math.abs(file0.get(name) - file1.get(name));
		}
		
		Set<String> union = new HashSet<String>(file0.keySet());
		union.addAll(file1.keySet());
		Set<String> intersection = new HashSet<String>(file0.keySet());
		intersection.retainAll(file1.keySet());
		int sizeDiff = union.size() - intersection.size();
		
		io.printf("%d %d%n", sizeDiff, diff);
	}
	
	
	private Map<String,Integer> readFile(int n) {
		Map<String,Integer> result = new HashMap<String,Integer>();
		for (int i = 0; i < n; i++) {
			io.tokenizeLine();
			String name = io.readToken();
			int val = io.readIntToken();
			result.put(name, val);
		}
		return result;
	}
	
}
