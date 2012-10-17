/* 
 * DWITE - January 2006 - Problem 3: London Knights
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;


public final class dwite200601p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA31.txt", "OUT31.txt", new dwite200601p3());
	}
	
	
	public void run() {
		// Read input
		int n = io.readIntLine();
		Collection<Player> players = new ArrayList<Player>();
		for (int i = 0; i < n; i++) {
			io.tokenizeLine();
			int playernum = io.readIntToken();
			String lastname = io.readToken();
			String firstname = io.readToken();
			List<Integer> stats = new ArrayList<Integer>();
			while (io.canReadToken())
				stats.add(io.readIntToken());
			players.add(new Player(playernum, firstname, lastname, stats));
		}
		
		// Query and write output
		io.println(Collections.max(players, new PlayerComparator(1)).getName());
		io.println(Collections.max(players, new PlayerComparator(2)).getName());
		io.println(Collections.min(players, new PlayerComparator(4)).getName());
		io.println(Collections.max(players, new PlayerComparator(5)).getName());
		io.println(Collections.max(players, new PlayerComparator(6)).getName());
	}
	
	
	
	private static class Player {
		
		private final int playerNumber;
		private final String firstName;
		private final String lastName;
		private final List<Integer> statistics;
		
		
		public Player(int playerNum, String firstName, String lastName, List<Integer> stats) {
			this.playerNumber = playerNum;
			this.firstName = firstName;
			this.lastName = lastName;
			this.statistics = stats;
		}
		
		
		public String getName() {
			return String.format("%s %s", firstName, lastName);
		}
		
		
		public String toString() {
			return String.format("%s %s (%d) %s", firstName, lastName, playerNumber, statistics);
		}
		
	}
	
	
	
	private static class PlayerComparator implements Comparator<Player> {
		
		private int statIndexToCompare;
		
		
		public PlayerComparator(int index) {
			this.statIndexToCompare = index;
		}
		
		
		public int compare(Player p0, Player p1) {
			Integer stat0 = p0.statistics.get(statIndexToCompare);
			Integer stat1 = p1.statistics.get(statIndexToCompare);
			return stat0.compareTo(stat1);
		}
		
	}
	
}
