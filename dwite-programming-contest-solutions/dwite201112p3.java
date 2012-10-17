/* 
 * DWITE - December 2011 - Problem 3: Combo Discounts
 * Solution by Nayuki Minase
 * 
 * http://nayuki.eigenstate.org/page/dwite-programming-contest-solutions
 * https://github.com/nayuki/DWITE-programming-contest-solutions
 */

import java.util.ArrayList;
import java.util.List;


public final class dwite201112p3 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA3.txt", "OUT3.txt", new dwite201112p3());
	}
	
	
	protected void runOnce() {
		// The discount deals
		int n = io.readIntLine();
		Deal[] deals = new Deal[n];
		for (int i = 0; i < n; i++) {
			io.tokenizeLine();
			int discount = io.readIntToken();
			List<String> items = readItems();
			deals[i] = new Deal(discount, items);
		}
		
		// The orders
		int m = io.readIntLine();
		for (int i = 0; i < m; i++) {
			io.tokenizeLine();
			List<String> orderItems = readItems();
			io.println(maxDiscount(orderItems, deals, 0));
		}
	}
	
	
	private static int maxDiscount(List<String> orderItems, Deal[] deals, int dealStartIndex) {
		if (dealStartIndex == deals.length)
			return 0;
		else {
			int maxDiscount = maxDiscount(orderItems, deals, dealStartIndex + 1);
			
			// Try to apply the current deal, deals[dealStartIndex]
			Deal deal = deals[dealStartIndex];
			List<String> tempOrder = new ArrayList<String>(orderItems);
			List<String> dealItems = deal.items;
			for (String item : dealItems) {
				if (!tempOrder.remove(item))
					return maxDiscount;  // Can't apply the current deal
			}
			// Successfully applied the current deal
			return Math.max(deal.discount + maxDiscount(tempOrder, deals, dealStartIndex), maxDiscount);
		}
	}
	
	
	private List<String> readItems() {
		int numItems = io.readIntToken();
		List<String> result = new ArrayList<String>();
		for (int j = 0; j < numItems; j++)
			result.add(io.readToken());
		return result;
	}
	
	
	
	private static class Deal {
		
		public final int discount;
		
		public List<String> items;
		
		
		public Deal(int discount, List<String> items) {
			this.discount = discount;
			this.items = items;
		}
		
	}
	
}
