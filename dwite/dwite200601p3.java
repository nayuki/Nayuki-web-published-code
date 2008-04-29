import java.io.*;
import java.util.*;


// DWITE - January 2006 - Problem 3: London Knights
public class dwite200601p3 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		int n = Integer.parseInt(in.readLine());
		Collection<Player> players = new ArrayList<Player>();
		for (int i = 0; i < n; i++) {
			StringTokenizer st = new StringTokenizer(in.readLine(), " ");
			int playernum = Integer.parseInt(st.nextToken());
			String lastname = st.nextToken();
			String firstname = st.nextToken();
			List<Integer> stats = new ArrayList<Integer>();
			while (st.hasMoreTokens())
				stats.add(Integer.parseInt(st.nextToken()));
			players.add(new Player(playernum, firstname, lastname, stats));
		}
		
		out.println(Collections.max(players, new PlayerComparator(1)).getName());
		out.println(Collections.max(players, new PlayerComparator(2)).getName());
		out.println(Collections.min(players, new PlayerComparator(4)).getName());
		out.println(Collections.max(players, new PlayerComparator(5)).getName());
		out.println(Collections.max(players, new PlayerComparator(6)).getName());
	}
	
	
	
	private static String infile = "DATA31.txt";  // Specify null to use System.in
	private static String outfile = "OUT31.txt";  // Specify null to use System.out
	
	
	public static void main(String[] args) throws IOException {
		InputStream in0;
		if (infile != null) in0 = new FileInputStream(infile);
		else in0 = System.in;
		Reader in1 = new InputStreamReader(in0, "US-ASCII");
		BufferedReader in = new BufferedReader(in1);
		
		OutputStream out0;
		if (outfile != null) out0 = new FileOutputStream(outfile);
		else out0 = System.out;
		Writer out1 = new OutputStreamWriter(out0, "US-ASCII");
		PrintWriter out = new PrintWriter(out1, true);
		
		main(in, out);
		
		in.close();
		in1.close();
		in0.close();
		out.close();
		out1.close();
		out0.close();
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
		
		
		public String toString() {
			return String.format("Player comparator (%d)", statIndexToCompare);
		}
		
	}
	
}