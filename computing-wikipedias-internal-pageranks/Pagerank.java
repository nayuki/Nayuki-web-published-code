/* 
 * Computing Wikipedia's internal PageRanks
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/computing-wikipedias-internal-pageranks
 */

import java.util.Arrays;


/* 
 * Calculates PageRank, by encapsulating a list of links and a list of current PageRank values.
 */
final class Pagerank {
	
	/*---- Fields ----*/
	
	// The vector of current PageRank values, changing after each iteration. Length equals idLimit.
	// Other classes can read this data, but should not modify it.
	public double[] pageranks;
	
	
	// List of page-to-page links in a packed run-length format:
	// (target page ID, number of incoming links, source page IDs...), ... .
	private int[] links;
	
	// Maximum page ID value plus 1. This sets the length of various arrays.
	private int idLimit;
	
	// Number of page IDs with incoming links or outgoing links (ignores disconnected nodes).
	private int numActive;
	
	// Indicates whether each page ID is active or not. Length equals idLimit.
	private boolean[] isActive;
	
	// The number of outgoing links each page ID has. Length equals idLimit.
	private int[] numOutgoingLinks;
	
	// Temporary array, which is filled and discarded per iteration. Length equals idLimit.
	private double[] newPageranks;
	
	
	/*---- Constructor ----*/
	
	// Constructs a PageRank calculator based on the given array of links
	// in the compressed format returned by class PageLinksList.
	public Pagerank(int[] links) {
		this.links = links;
		
		// Find highest page ID among all links
		int maxId = 0;
		for (int i = 0; i < links.length; ) {
			int dest = links[i];
			maxId = Math.max(dest, maxId);
			int numIncoming = links[i + 1];
			for (int j = 0; j < numIncoming; j++) {
				int src = links[i + 2 + j];
				maxId = Math.max(src, maxId);
			}
			i += numIncoming + 2;
		}
		idLimit = maxId + 1;
		
		// Compute metadata fields
		boolean[] hasIncomingLinks = new boolean[idLimit];
		numOutgoingLinks = new int[idLimit];
		for (int i = 0; i < links.length; ) {
			int dest = links[i];
			hasIncomingLinks[dest] = true;
			int numIncoming = links[i + 1];
			for (int j = 0; j < numIncoming; j++) {
				int src = links[i + 2 + j];
				numOutgoingLinks[src]++;
			}
			i += numIncoming + 2;
		}
		isActive = new boolean[idLimit];
		numActive = 0;
		for (int i = 0; i < idLimit; i++) {
			if (numOutgoingLinks[i] > 0 || hasIncomingLinks[i]) {
				isActive[i] = true;
				numActive++;
			}
		}
		
		// Initialize PageRanks uniformly for active pages
		pageranks = new double[idLimit];
		double initWeight = 1.0 / numActive;
		for (int i = 0; i < idLimit; i++) {
			if (isActive[i])
				pageranks[i] = initWeight;
		}
		newPageranks = new double[idLimit];
	}
	
	
	/*---- Methods ----*/
	
	// Performs one iteration of the PageRank algorithm and updates the values in the array 'pageranks'.
	public void iterateOnce(double damping) {
		// Pre-divide by number of outgoing links
		for (int i = 0; i < idLimit; i++) {
			if (numOutgoingLinks[i] > 0)
				pageranks[i] /= numOutgoingLinks[i];
		}
		
		// Distribute PageRanks over links (main calculation)
		Arrays.fill(newPageranks, 0);
		for (int i = 0; i < links.length; ) {
			int numIncoming = links[i + 1];
			double sum = 0;
			for (int j = 0; j < numIncoming; j++) {
				int src = links[i + 2 + j];
				sum += pageranks[src];
			}
			int dest = links[i];
			newPageranks[dest] = sum;
			i += numIncoming + 2;
		}
		
		// Calculate global bias due to pages without outgoing links
		double bias = 0;
		for (int i = 0; i < idLimit; i++) {
			if (isActive[i] && numOutgoingLinks[i] == 0)
				bias += pageranks[i];
		}
		bias /= numActive;
		
		// Apply bias and damping to all active pages
		double temp = bias * damping + (1 - damping) / numActive;  // Factor out some arithmetic
		for (int i = 0; i < idLimit; i++) {
			if (isActive[i])
				pageranks[i] = newPageranks[i] * damping + temp;
		}
	}
	
}
