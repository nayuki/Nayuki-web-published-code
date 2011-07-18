// DWITE - October 2004 - Problem 2: 24 Hour Clock
// Solution by Nayuki Minase


public final class dwite200410p2 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA2", "OUT2", new dwite200410p2());
	}
	
	
	protected void runOnce() {
		String line = io.readLine();
		int hour = Integer.parseInt(line.substring(0, 2));
		int minute = Integer.parseInt(line.substring(3, 5));
		
		String ap = getAmPm(hour);
		hour = to12Hour(hour);
		io.printf("%d:%02d %s%n", hour, minute, ap);
	}
	
	
	private static String getAmPm(int hour) {
		if      ( 0 <= hour && hour < 12) return "AM";
		else if (12 <= hour && hour < 24) return "PM";
		else throw new IllegalArgumentException("Invalid 24-hour clock hour");
	}
	
	
	// Convert hour from [0, 24) to [1, 12] branchlessly using modular arithmetic magic
	private static int to12Hour(int hour) {
		return (hour + 11) % 12 + 1;
	}
	
}
