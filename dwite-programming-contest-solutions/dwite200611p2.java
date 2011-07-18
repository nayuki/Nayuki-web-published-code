// DWITE - November 2006 - Problem 2: Lottery Ticket Checker
// Solution by Nayuki Minase

import java.util.ArrayList;
import java.util.List;


public final class dwite200611p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA21.txt", "OUT21.txt", new dwite200611p2());
	}
	
	
	private List<Integer> winningNumbers;
	
	
	public void run() {
		winningNumbers = readNumbers(io);
		super.run();
	}
	
	
	protected void runOnce() {
		// Read input
		List<Integer> numbers = readNumbers(io);
		
		// Compute
		int regularMatches = 0;
		for (int i = 0; i < 6; i++) {
			if (numbers.contains(winningNumbers.get(i)))
				regularMatches++;
		}
		
		int bonusMatches = 0;
		if (numbers.contains(winningNumbers.get(6)))
			bonusMatches++;
		
		String prize = getPrize(regularMatches, bonusMatches);
		
		// Write output
		io.println(prize);
	}
	
	
	private static String getPrize(int regularMatches, int bonusMatches) {
		if      (regularMatches <= 2) return "No Prize";
		else if (regularMatches == 3) return "Fifth Prize";
		else if (regularMatches == 4) return "Fourth Prize";
		else if (regularMatches == 5 && bonusMatches == 0) return "Third Prize";
		else if (regularMatches == 5 && bonusMatches == 1) return "Second Prize";
		else if (regularMatches == 6) return "First Prize";
		else throw new IllegalArgumentException("Invalid lottery result");
	}
	
	
	private static List<Integer> readNumbers(DwiteIo io) {
		List<Integer> result = new ArrayList<Integer>();
		io.tokenizeLine();
		while (io.canReadToken())
			result.add(io.readIntToken());
		return result;
	}
	
}
