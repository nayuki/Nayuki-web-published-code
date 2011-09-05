// DWITE - April 2010 - Problem 3: Bill Amendments
// Solution by Nayuki Minase

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


public final class dwite201004p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite201004p3());
	}
	
	
	protected void runOnce() {
		List<Bill> bills = new ArrayList<Bill>();
		Map<String,Integer> amendments = new HashMap<String,Integer>();
		
		// Read bills
		int n = io.readIntLine();
		for (int i = 0; i < n; i++) {
			io.tokenizeLine();
			String payer = io.readToken();
			int value = io.readIntToken();
			bills.add(new Bill(payer, value));
			amendments.put(payer, 0);
		}
		
		// Read amendments
		int m = io.readIntLine();
		for (int i = 0; i < m; i++) {
			io.tokenizeLine();
			String payer = io.readToken();
			int value = io.readIntToken();
			amendments.put(payer, amendments.get(payer) + value);
		}
		
		// Write bills while doing amendments on the fly
		for (Bill bill : bills) {
			int amendment = amendments.get(bill.payer);
			int subtracted = Math.min(bill.value, amendment);
			amendments.put(bill.payer, amendment - subtracted);
			io.printf("%s %d%n", bill.payer, bill.value - subtracted);
		}
	}
	
	
	
	private static class Bill {
		
		public final String payer;
		public final int value;
		
		
		public Bill(String payer, int value) {
			this.payer = payer;
			this.value = value;
		}
		
	}
	
}
