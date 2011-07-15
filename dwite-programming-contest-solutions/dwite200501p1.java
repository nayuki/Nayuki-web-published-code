// DWITE - January 2005 - Problem 1: DWITE Golf Tournament

import dwite.*;

import java.util.ArrayList;
import java.util.Collections;


public final class dwite200501p1 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA11.txt", "OUT11.txt", new dwite200501p1());
	}
	
	
	public void run() {
		// Read input
		int n = io.readIntLine();
		ArrayList<Golfer> golfers = new ArrayList<Golfer>();
		for (int i = 0; i < n; i++) {
			String name = io.readLine();
			int score = 0;
			for (int j = 0; j < 9; j++)
				score += io.readIntLine();
			golfers.add(new Golfer(name, score));
		}
		
		// Sort ascending and write the output
		Collections.sort(golfers);
		for (int i = 0; i < 5; i++) {
			Golfer golfer = golfers.get(i);
			io.printf("%s %d%n", golfer.name, golfer.score);
		}
	}
	
	
	
	private static class Golfer implements Comparable<Golfer> {
		
		public final String name;
		public final int score;
		
		
		public Golfer(String name, int score) {
			this.name = name;
			this.score = score;
		}
		
		
		public int compareTo(Golfer g) {
			if (score != g.score)
				return score - g.score;
			else
				return name.compareTo(g.name);
		}
		
		
		public String toString() {
			return String.format("%s (%d)", name, score);
		}
		
	}
	
}
