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
		TestAdd();
		TestSet();
		TestInsertAtBeginning();
		TestInsertAtEnd();
		TestInsertAtMiddle();
		TestInsertManyBeginning();
		TestInsertManyEnd();
		TestInsertManyEverywhere();
		TestRemoveAt();
		TestClear();
		TestAgainstNetListRandomly();
		Console.WriteLine("Test passed");
	}
	
	
	private static void TestAdd() {
		AvlTreeList<string> list = new AvlTreeList<string>();
		list.Add("January");
		list.Add("February");
		list.Add("March");
		list.Add("April");
		list.Add("May");
		list.Add("June");
		list.CheckStructure();
		AssertEquals(list.Count, 6);
		AssertEquals(list[0], "January" );
		AssertEquals(list[1], "February");
		AssertEquals(list[2], "March"   );
		AssertEquals(list[3], "April"   );
		AssertEquals(list[4], "May"     );
		AssertEquals(list[5], "June"    );
	}
	
	
	private static void TestSet() {
		AvlTreeList<string> list = new AvlTreeList<string>();
		for (int i = 0; i < 10; i++)
			list.Add(null);
		list[0] = "zero";
		list[1] = "ten";
		list[2] = "twenty";
		list[3] = "thirty";
		list[4] = "forty";
		list[5] = "fifty";
		list[6] = "sixty";
		list[7] = "seventy";
		list[8] = "eighty";
		list[9] = "ninety";
		AssertEquals(list.Count, 10);
		AssertEquals(list[0], "zero"   );
		AssertEquals(list[1], "ten"    );
		AssertEquals(list[2], "twenty" );
		AssertEquals(list[3], "thirty" );
		AssertEquals(list[4], "forty"  );
		AssertEquals(list[5], "fifty"  );
		AssertEquals(list[6], "sixty"  );
		AssertEquals(list[7], "seventy");
		AssertEquals(list[8], "eighty" );
		AssertEquals(list[9], "ninety" );
	}
	
	
	private static void TestInsertAtBeginning() {
		AvlTreeList<string> list = new AvlTreeList<string>();
		list.Insert(0, "Sunday");
		list.Insert(0, "Monday");
		list.Insert(0, "Tuesday");
		AssertEquals(list.Count, 3);
		AssertEquals(list[0], "Tuesday");
		AssertEquals(list[1], "Monday" );
		AssertEquals(list[2], "Sunday" );
	}
	
	
	private static void TestInsertAtEnd() {
		AvlTreeList<string> list = new AvlTreeList<string>();
		list.Insert(0, "Saturday");
		list.Insert(1, "Friday");
		list.Insert(2, "Thursday");
		list.Insert(3, "Wednesday");
		AssertEquals(list.Count, 4);
		AssertEquals(list[0], "Saturday" );
		AssertEquals(list[1], "Friday"   );
		AssertEquals(list[2], "Thursday" );
		AssertEquals(list[3], "Wednesday");
	}
	
	
	private static void TestInsertAtMiddle() {
		AvlTreeList<string> list = new AvlTreeList<string>();
		list.Insert(0, "Up");
		list.Insert(1, "Down");
		list.Insert(1, "Left");
		list.Insert(2, "Right");
		list.Insert(1, "Front");
		list.Insert(2, "Back");
		AssertEquals(list.Count, 6);
		AssertEquals(list[0], "Up"   );
		AssertEquals(list[1], "Front");
		AssertEquals(list[2], "Back" );
		AssertEquals(list[3], "Left" );
		AssertEquals(list[4], "Right");
		AssertEquals(list[5], "Down" );
	}
	
	
	// Stresses the self-balancing mechanism
	private static void TestInsertManyBeginning() {
		AvlTreeList<int> list = new AvlTreeList<int>();
		for (int i = 0; i < 300000; i++)
			list.Add(i);
		
		for (int i = 0; i < list.Count; i++)
			AssertEquals(list[i], i);
	}
	
	
	// Stresses the self-balancing mechanism
	private static void TestInsertManyEnd() {
		AvlTreeList<int> list = new AvlTreeList<int>();
		for (int i = 299999; i >= 0; i--)
			list.Insert(0, i);
		
		for (int i = 0; i < list.Count; i++)
			AssertEquals(list[i], i);
	}
	
	
	// Adds in a weird binary pattern to stress arrays and linked lists
	private static void TestInsertManyEverywhere() {
		const int N = 18;
		AvlTreeList<int> list = new AvlTreeList<int>();
		list.Add(0);
		for (int i = N - 1; i >= 0; i--) {
			for (int j = 1 << i, k = 1; j < (1 << N); j += 2 << i, k += 2)
				list.Insert(k, j);
		}
		
		for (int i = 0; i < list.Count; i++)
			AssertEquals(list[i], i);
	}
	
	
	private static void TestRemoveAt() {
		AvlTreeList<char> list = new AvlTreeList<char>();
		{
			string str = "the quick brown fox jumped over the lazy dog";
			for (int i = 0; i < str.Length; i++)
				list.Add(str[i]);
			AssertEquals(list.Count, str.Length);
		}
		
		AssertEquals(list[ 2], 'e');  list.RemoveAt( 2);
		AssertEquals(list[ 4], 'u');  list.RemoveAt( 4);
		AssertEquals(list[ 3], 'q');  list.RemoveAt( 3);
		AssertEquals(list[ 2], ' ');  list.RemoveAt( 2);
		AssertEquals(list[12], 'f');  list.RemoveAt(12);
		AssertEquals(list[11], ' ');  list.RemoveAt(11);
		AssertEquals(list[10], 'n');  list.RemoveAt(10);
		AssertEquals(list[ 9], 'w');  list.RemoveAt( 9);
		AssertEquals(list[11], ' ');  list.RemoveAt(11);
		AssertEquals(list[11], 'j');  list.RemoveAt(11);
		AssertEquals(list[11], 'u');  list.RemoveAt(11);
		AssertEquals(list[10], 'x');  list.RemoveAt(10);
		AssertEquals(list[11], 'p');  list.RemoveAt(11);
		AssertEquals(list[12], 'd');  list.RemoveAt(12);
		AssertEquals(list[11], 'e');  list.RemoveAt(11);
		AssertEquals(list[13], 'v');  list.RemoveAt(13);
		AssertEquals(list[13], 'e');  list.RemoveAt(13);
		AssertEquals(list[19], 'l');  list.RemoveAt(19);
		AssertEquals(list[20], 'z');  list.RemoveAt(20);
		AssertEquals(list[19], 'a');  list.RemoveAt(19);
		AssertEquals(list[18], ' ');  list.RemoveAt(18);
		AssertEquals(list[22], 'g');  list.RemoveAt(22);
		
		{
			String str = "thick broom or they do";
			AssertEquals(list.Count, str.Length);
			for (int i = 0; i < str.Length; i++)
				AssertEquals(list[i], str[i]);
		}
		
		AssertEquals(list[0], 't');  list.RemoveAt(0);
		AssertEquals(list[2], 'c');  list.RemoveAt(2);
		AssertEquals(list[2], 'k');  list.RemoveAt(2);
		AssertEquals(list[2], ' ');  list.RemoveAt(2);
		AssertEquals(list[2], 'b');  list.RemoveAt(2);
		AssertEquals(list[2], 'r');  list.RemoveAt(2);
		AssertEquals(list[2], 'o');  list.RemoveAt(2);
		AssertEquals(list[2], 'o');  list.RemoveAt(2);
		AssertEquals(list[4], 'o');  list.RemoveAt(4);
		AssertEquals(list[7], 'h');  list.RemoveAt(7);
		AssertEquals(list[5], ' ');  list.RemoveAt(5);
		AssertEquals(list[5], 't');  list.RemoveAt(5);
		AssertEquals(list[9], 'o');  list.RemoveAt(9);
		AssertEquals(list[7], ' ');  list.RemoveAt(7);
		AssertEquals(list[6], 'y');  list.RemoveAt(6);
		
		{
			String str = "him red";
			AssertEquals(list.Count, str.Length);
			for (int i = 0; i < str.Length; i++)
				AssertEquals(list[i], str[i]);
		}
	}
	
	
	private static void TestClear() {
		AvlTreeList<int> list = new AvlTreeList<int>();
		for (int i = 0; i < 20; i++)
			list.Add(i * i);
		
		list.Clear();
		AssertEquals(list.Count, 0);
		
		list.Add(- 1);
		list.Add(- 8);
		list.Add(-27);
		AssertEquals(list.Count, 3);
		AssertEquals(list[0], - 1);
		AssertEquals(list[1], - 8);
		AssertEquals(list[2], -27);
	}
	
	
	// Comprehensively tests all the defined methods.
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
			
			AssertEquals(list0.Count, size);
			AssertEquals(list1.Count, size);
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
