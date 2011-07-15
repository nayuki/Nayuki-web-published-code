// DWITE - November 2004 - Problem 5: Wind Chill

import dwite.*;


public final class dwite200411p5 extends Solution {
	
	public static void main(String[] args) {
		Runner.run("DATA51.txt", "OUT51.txt", new dwite200411p5());
	}
	
	
	protected void runOnce() {
		// Read input
		int temp = io.readIntLine();  // Variable Tair
		int wind = io.readIntLine();  // Variable V10metre
		
		// Compute and write output
		int wct = (int)Math.round(13.12 + 0.6215*temp - 11.37*Math.pow(wind,0.16) + 0.3965*temp*Math.pow(wind,0.16));
		io.printf("%d %s%n", wct, getRating(wct));
	}
	
	
	private static String getRating(int wct) {
		if      (  0 <  wct              ) throw new IllegalArgumentException("Undefined for positive wind chill temperature");
		else if (- 9 <= wct && wct <=   0) return "LOW";
		else if (-24 <= wct && wct <= -10) return "MODERATE";
		else if (-44 <= wct && wct <= -25) return "COLD";
		else if (-59 <= wct && wct <= -45) return "EXTREME";
		else if (              wct <= -60) return "DANGER";
		else throw new AssertionError();  // Impossible; defies the laws of arithmetic
	}
	
}
