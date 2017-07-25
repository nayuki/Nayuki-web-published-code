/* 
 * AVL tree list test (C#)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/avl-tree-list
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

using System;
using System.Collections.Generic;


public sealed class AvlTreeListTest {
	
	public static void Main(string[] args) {
		TestAgainstNetListRandomly();
		Console.WriteLine("Test passed");
	}
	
	
	private static void TestAgainstNetListRandomly() {
		Random rand = new Random();
		IList<int> list0 = new List<int>();
		AvlTreeList<int> list1 = new AvlTreeList<int>();
		int size = 0;
		for (int i = 0; i < 100000; i++) {
			int op = rand.Next(100);
			
			if (op < 1) {  // Clear
				list1.CheckStructure();
				list0.Clear();
				list1.Clear();
				size = 0;
				
			} else if (op < 2) {  // Set
				if (size > 0) {
					int index = rand.Next(size);
					int val = rand.Next();
					list0[index] = val;
					list1[index] = val;
				}
				
			} else if (op < 30) {  // Random insertion
				int n = rand.Next(100) + 1;
				for (int j = 0; j < n; j++) {
					int index = rand.Next(size + 1);
					int val = rand.Next();
					list0.Insert(index, val);
					list1.Insert(index, val);
				}
				size += n;
				
			} else if (op < 50) {  // Ascending insertion
				int n = rand.Next(100) + 1;
				int offset = rand.Next(size + 1);
				for (int j = 0; j < n; j++, offset++) {
					int val = rand.Next();
					list0.Insert(offset, val);
					list1.Insert(offset, val);
				}
				size += n;
				
			} else if (op < 70) {  // Descending insertion
				int n = rand.Next(100) + 1;
				int offset = rand.Next(size + 1);
				for (int j = 0; j < n; j++) {
					int val = rand.Next();
					list0.Insert(offset, val);
					list1.Insert(offset, val);
				}
				size += n;
				
			} else if (op < 80) {  // Random deletion
				int n = rand.Next(100) + 1;
				for (int j = 0; j < n && size > 0; j++, size--) {
					int index = rand.Next(size);
					AssertEquals(list0[index], list1[index]);
					list0.RemoveAt(index);
					list1.RemoveAt(index);
				}
				
			} else if (op < 90) {  // Ascending deletion
				int n = rand.Next(100) + 1;
				if (size > 0) {
					int offset = rand.Next(size);
					for (int j = 0; j < n && offset < size; j++, size--) {
						AssertEquals(list0[offset], list1[offset]);
						list0.RemoveAt(offset);
						list1.RemoveAt(offset);
					}
				}
				
			} else if (op < 100) {  // Descending deletion
				int n = rand.Next(100) + 1;
				if (size > 0) {
					int offset = rand.Next(size);
					for (int j = 0; j < n && offset >= 0; j++, offset--, size--) {
						AssertEquals(list0[offset], list1[offset]);
						list0.RemoveAt(offset);
						list1.RemoveAt(offset);
					}
				}
			} else
				throw new SystemException();
			
			AssertEquals(size, list0.Count);
			AssertEquals(size, list1.Count);
			if (size > 0) {
				for (int j = 0; j < 10; j++) {
					int index = rand.Next(size);
					AssertEquals(list0[index], list1[index]);
				}
			}
		}
	}
	
	
	private static void AssertEquals<T>(T x, T y) {
		if (!x.Equals(y))
			throw new SystemException("Value mismatch");
	}
	
}
