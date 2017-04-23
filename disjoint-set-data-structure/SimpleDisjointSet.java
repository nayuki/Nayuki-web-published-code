/* 
 * Disjoint-set data structure - Simple library (Java)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/disjoint-set-data-structure
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */


/* 
 * Represents a set of disjoint sets. Also known as the union-find data structure.
 * Main operations are querying if two elements are in the same set, and merging two sets together.
 * Useful for testing graph connectivity, and is used in Kruskal's algorithm.
 */
public final class SimpleDisjointSet {
	
	/*---- Fields ----*/
	
	private Node[] nodes;
	
	
	
	/*---- Constructors ----*/
	
	// Constructs a new set containing the given number of singleton sets.
	// For example, new SimpleDisjointSet(3) --> {{0}, {1}, {2}}.
	public SimpleDisjointSet(int numElems) {
		if (numElems <= 0)
			throw new IllegalArgumentException("Number of elements must be positive");
		nodes = new Node[numElems];
		for (int i = 0; i < numElems; i++) {
			Node node = new Node();
			node.parent = node;
			node.rank = 0;
			nodes[i] = node;
		}
	}
	
	
	
	/*---- Methods ----*/
	
	// Returns the representative node for the set containing the given element. Also performs path compression on nodes.
	private Node find(int elemIndex) {
		if (elemIndex < 0 || elemIndex >= nodes.length)
			throw new IndexOutOfBoundsException();
		return find(nodes[elemIndex]);
	}
	
	
	// Returns the representative node for the set containing the given element. Also performs path compression on nodes.
	private static Node find(Node node) {
		if (node.parent != node)
			node.parent = find(node.parent);  // Full path compression
		return node.parent;
	}
	
	
	// Tests whether the given two elements are members of the same set.
	public boolean inSameSet(int elemIndex0, int elemIndex1) {
		return find(elemIndex0) == find(elemIndex1);
	}
	
	
	// Merges together the sets that the given two elements belong to.
	// Returns true if and only if the two elements belonged to different sets at the start of the operation.
	public boolean union(int elemIndex0, int elemIndex1) {
		// Get representative nodes
		Node repr0 = find(elemIndex0);
		Node repr1 = find(elemIndex1);
		if (repr0 == repr1)
			return false;
		
		// Graph repr1's subtree onto node repr0 or vice versa, depending on ranks
		if (repr0.rank > repr1.rank)
			repr1.parent = repr0;
		else if (repr1.rank > repr0.rank)
			repr0.parent = repr1;
		else {  // repr0.rank == repr1.rank
			repr1.parent = repr0;
			repr0.rank++;
		}
		return true;
	}
	
	
	
	/*---- Helper class: Simple node ----*/
	
	private static final class Node {
		
		public Node parent;  // Not null
		public int rank;  // At least 0
		
	}
	
}
