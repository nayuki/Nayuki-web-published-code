// DWITE - January 2005 - Problem 4: Zeller's Congruence

import dwite.*;


public final class dwite200501p4 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA41.txt", "OUT41.txt", new dwite200501p4());
	}
	
	
	private static final String[] months = {
		"JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
		"JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
	};
	
	private static final String[] daysOfWeek = {
		"SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"
	};
	
	
	protected void runOnce() {
		io.tokenizeLine();
		int m = getMonth(io.readToken());
		String daystr = io.readToken();
		int d = Integer.parseInt(daystr.substring(0, daystr.length() - 1));
		int y = io.readIntToken();
		io.println(daysOfWeek[getDayOfWeek(y, m, d)]);
	}
	
	
	// Returns the month number corresponding to the string, starting with January = 1.
	private static int getMonth(String s) {
		for (int i = 0; i < months.length; i++) {
			if (s.equals(months[i]))
				return i + 1;
		}
		throw new IllegalArgumentException("Invalid month");
	}
	
	
	// Zeller's congruence computation
	private static int getDayOfWeek(int y, int m, int d) {
		if (m <= 2) {
			m += 12;
			y--;
		}
		int c = y / 100;
		y %= 100;
		int dow = (26*(m+1)/10 + d + y + y/4 + c/4 - 2*c) % 7;
		if (dow < 0)
			dow += 7;
		return dow;
	}
	
}
