/* 
 * DWITE - February 2011 - Problem 2: Safe from Rooks
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.HashSet;
import java.util.Set;


public final class dwite201102p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA2.txt", "OUT2.txt", new dwite201102p2());
	}
	
	
	protected void runOnce() {
		// Read sizes
		io.tokenizeLine();
		long rows = io.readIntToken();
		long cols = io.readIntToken();
		int rooks = io.readIntToken();
		
		// We only need to keep track of which rows and which columns have rooks
		Set<Integer> rookRows = new HashSet<Integer>();
		Set<Integer> rookCols = new HashSet<Integer>();
		for (int i = 0; i < rooks; i++) {
			io.tokenizeLine();
			rookRows.add(io.readIntToken());
			rookCols.add(io.readIntToken());
		}
		
		io.println((rows - rookRows.size()) * (cols - rookCols.size()));
	}
	
}
