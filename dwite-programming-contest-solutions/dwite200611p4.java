/* 
 * DWITE - November 2006 - Problem 4: Money Prize
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;


public final class dwite200611p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA41.txt", "OUT41.txt", new dwite200611p4());
	}
	
	
	private static final int HEIGHT = 8;
	private static final int WIDTH = 8;
	
	
	@SuppressWarnings("unchecked")
	public void run() {
		// Read grid
		int[][] money = new int[HEIGHT][WIDTH];
		for (int y = 0; y < HEIGHT; y++) {
			io.tokenizeLine();
			for (int x = 0; x < WIDTH; x++)
				money[y][x] = io.readIntToken();
		}
		
		// Dynamic programming
		List<Integer>[][] maxmoney = new List[HEIGHT][WIDTH];
		for (int y = HEIGHT - 1; y >= 0; y--) {
			for (int x = 0; x < WIDTH; x++) {
				maxmoney[y][x] = new ArrayList<Integer>();
				if (y == HEIGHT - 1 && x == 0)  // Bottom left, the starting cell
					maxmoney[y][x].add(money[y][x]);
				else {
					List<Integer> temp = new ArrayList<Integer>();
					if (x >= 1) temp.addAll(maxmoney[y][x - 1]);
					if (y < HEIGHT - 1) temp.addAll(maxmoney[y + 1][x]);
					
					Collections.sort(temp, Collections.reverseOrder());
					for (int i = 0; i < Math.min(5, temp.size()); i++)
						maxmoney[y][x].add(temp.get(i) + money[y][x]);
				}
			}
		}
		// At the end of the loop, each list in maxmoney is in descending order.
		
		List<Integer> end = maxmoney[0][WIDTH - 1];
		for (int i = 0; i < Math.min(5, end.size()); i++)
			io.println(end.get(i));
	}
	
}
