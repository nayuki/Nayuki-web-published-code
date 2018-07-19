/* 
 * AVL tree list test (Java)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Random;
import org.junit.Test;


public final class AvlTreeListTest {
	
	@Test public void testAdd() {
		List<String> list = newList();
		list.add("January");
		list.add("February");
		list.add("March");
		list.add("April");
		list.add("May");
		list.add("June");
		checkStructure(list);
		assertEquals(6, list.size());
		assertEquals("January" , list.get(0));
		assertEquals("February", list.get(1));
		assertEquals("March"   , list.get(2));
		assertEquals("April"   , list.get(3));
		assertEquals("May"     , list.get(4));
		assertEquals("June"    , list.get(5));
	}
	
	
	@Test public void testAddList() {
		List<String> list = newList();
		{
			List<String> smallList = newList();
			smallList.add("January");
			list.addAll(smallList);
		} {
			List<String> smallList = newList();
			smallList.add("February");
			smallList.add("March");
			smallList.add("April");
			list.addAll(smallList);
		} {
			List<String> smallList = newList();
			smallList.add("May");
			smallList.add("June");
			smallList.add("July");
			smallList.add("August");
			smallList.add("September");
			smallList.add("October");
			smallList.add("November");
			smallList.add("December");
			list.addAll(smallList);
		}
		assertEquals(12, list.size());
		assertEquals("January"  , list.get( 0));
		assertEquals("February" , list.get( 1));
		assertEquals("March"    , list.get( 2));
		assertEquals("April"    , list.get( 3));
		assertEquals("May"      , list.get( 4));
		assertEquals("June"     , list.get( 5));
		assertEquals("July"     , list.get( 6));
		assertEquals("August"   , list.get( 7));
		assertEquals("September", list.get( 8));
		assertEquals("October"  , list.get( 9));
		assertEquals("November" , list.get(10));
		assertEquals("December" , list.get(11));
	}
	
	
	@Test public void testSet() {
		List<String> list = newList();
		for (int i = 0; i < 10; i++)
			list.add(null);
		list.set(0, "zero");
		list.set(1, "ten");
		list.set(2, "twenty");
		list.set(3, "thirty");
		list.set(4, "forty");
		list.set(5, "fifty");
		list.set(6, "sixty");
		list.set(7, "seventy");
		list.set(8, "eighty");
		list.set(9, "ninety");
		assertEquals(10, list.size());
		assertEquals("zero"   , list.get(0));
		assertEquals("ten"    , list.get(1));
		assertEquals("twenty" , list.get(2));
		assertEquals("thirty" , list.get(3));
		assertEquals("forty"  , list.get(4));
		assertEquals("fifty"  , list.get(5));
		assertEquals("sixty"  , list.get(6));
		assertEquals("seventy", list.get(7));
		assertEquals("eighty" , list.get(8));
		assertEquals("ninety" , list.get(9));
	}
	
	
	@Test public void testInsertAtBeginning() {
		List<String> list = newList();
		list.add(0, "Sunday");
		list.add(0, "Monday");
		list.add(0, "Tuesday");
		assertEquals(3, list.size());
		assertEquals("Tuesday", list.get(0));
		assertEquals("Monday" , list.get(1));
		assertEquals("Sunday" , list.get(2));
	}
	
	
	@Test public void testInsertAtEnd() {
		List<String> list = newList();
		list.add(0, "Saturday");
		list.add(1, "Friday");
		list.add(2, "Thursday");
		list.add(3, "Wednesday");
		assertEquals(4, list.size());
		assertEquals("Saturday" , list.get(0));
		assertEquals("Friday"   , list.get(1));
		assertEquals("Thursday" , list.get(2));
		assertEquals("Wednesday", list.get(3));
	}
	
	
	@Test public void testInsertAtMiddle() {
		List<String> list = newList();
		list.add(0, "Up");
		list.add(1, "Down");
		list.add(1, "Left");
		list.add(2, "Right");
		list.add(1, "Front");
		list.add(2, "Back");
		assertEquals(6, list.size());
		assertEquals("Up"   , list.get(0));
		assertEquals("Front", list.get(1));
		assertEquals("Back" , list.get(2));
		assertEquals("Left" , list.get(3));
		assertEquals("Right", list.get(4));
		assertEquals("Down" , list.get(5));
	}
	
	
	@Test public void testInsertList() {
		List<String> list = newList();
		{
			List<String> smallList = newList();
			smallList.add("1");
			smallList.add("2");
			smallList.add("3");
			smallList.add("5");
			list.addAll(0, smallList);
		} {
			List<String> smallList = newList();
			smallList.add("377");
			smallList.add("610");
			smallList.add("987");
			list.addAll(4, smallList);
		} {
			List<String> smallList = newList();
			smallList.add("8");
			smallList.add("13");
			smallList.add("21");
			smallList.add("144");
			smallList.add("233");
			list.addAll(4, smallList);
		} {
			List<String> smallList = newList();
			smallList.add("34");
			smallList.add("55");
			smallList.add("89");
			list.addAll(7, smallList);
		}
		assertEquals(15, list.size());
		assertEquals(  "1", list.get( 0));
		assertEquals(  "2", list.get( 1));
		assertEquals(  "3", list.get( 2));
		assertEquals(  "5", list.get( 3));
		assertEquals(  "8", list.get( 4));
		assertEquals( "13", list.get( 5));
		assertEquals( "21", list.get( 6));
		assertEquals( "34", list.get( 7));
		assertEquals( "55", list.get( 8));
		assertEquals( "89", list.get( 9));
		assertEquals("144", list.get(10));
		assertEquals("233", list.get(11));
		assertEquals("377", list.get(12));
		assertEquals("610", list.get(13));
		assertEquals("987", list.get(14));
	}
	
	
	// Stresses the self-balancing mechanism
	@Test public void testInsertManyBeginning() {
		List<Integer> list = newList();
		for (int i = 0; i < 300000; i++)
			list.add(i);
		
		int i = 0;
		for (Integer x : list) {
			assertEquals((Integer)i, x);
			i++;
		}
	}
	
	
	// Stresses the self-balancing mechanism
	@Test public void testInsertManyEnd() {
		List<Integer> list = newList();
		for (int i = 299999; i >= 0; i--)
			list.add(0, i);
		
		int i = 0;
		for (Integer x : list) {
			assertEquals((Integer)i, x);
			i++;
		}
	}
	
	
	// Adds in a weird binary pattern to stress arrays and linked lists
	@Test public void testInsertManyEverywhere() {
		final int N = 18;
		List<Integer> list = newList();
		list.add(0);
		for (int i = N - 1; i >= 0; i--) {
			for (int j = 1 << i, k = 1; j < (1 << N); j += 2 << i, k += 2)
				list.add(k, j);
		}
		
		int i = 0;
		for (Integer x : list) {
			assertEquals((Integer)i, x);
			i++;
		}
	}
	
	
	@Test public void testRemove() {
		List<Character> list = newList();
		{
			String str = "the quick brown fox jumped over the lazy dog";
			for (int i = 0; i < str.length(); i++)
				list.add(str.charAt(i));
			assertEquals(str.length(), list.size());
		}
		
		assertEquals('e', (char)list.remove( 2));
		assertEquals('u', (char)list.remove( 4));
		assertEquals('q', (char)list.remove( 3));
		assertEquals(' ', (char)list.remove( 2));
		assertEquals('f', (char)list.remove(12));
		assertEquals(' ', (char)list.remove(11));
		assertEquals('n', (char)list.remove(10));
		assertEquals('w', (char)list.remove( 9));
		assertEquals(' ', (char)list.remove(11));
		assertEquals('j', (char)list.remove(11));
		assertEquals('u', (char)list.remove(11));
		assertEquals('x', (char)list.remove(10));
		assertEquals('p', (char)list.remove(11));
		assertEquals('d', (char)list.remove(12));
		assertEquals('e', (char)list.remove(11));
		assertEquals('v', (char)list.remove(13));
		assertEquals('e', (char)list.remove(13));
		assertEquals('l', (char)list.remove(19));
		assertEquals('z', (char)list.remove(20));
		assertEquals('a', (char)list.remove(19));
		assertEquals(' ', (char)list.remove(18));
		assertEquals('g', (char)list.remove(22));
		
		{
			String str = "thick broom or they do";
			assertEquals(str.length(), list.size());
			for (int i = 0; i < str.length(); i++)
				assertEquals(str.charAt(i), (char)list.get(i));
		}
		
		assertEquals('t', (char)list.remove(0));
		assertEquals('c', (char)list.remove(2));
		assertEquals('k', (char)list.remove(2));
		assertEquals(' ', (char)list.remove(2));
		assertEquals('b', (char)list.remove(2));
		assertEquals('r', (char)list.remove(2));
		assertEquals('o', (char)list.remove(2));
		assertEquals('o', (char)list.remove(2));
		assertEquals('o', (char)list.remove(4));
		assertEquals('h', (char)list.remove(7));
		assertEquals(' ', (char)list.remove(5));
		assertEquals('t', (char)list.remove(5));
		assertEquals('o', (char)list.remove(9));
		assertEquals(' ', (char)list.remove(7));
		assertEquals('y', (char)list.remove(6));
		
		{
			String str = "him red";
			assertEquals(str.length(), list.size());
			for (int i = 0; i < str.length(); i++)
				assertEquals(str.charAt(i), (char)list.get(i));
		}
	}
	
	
	@Test public void testClear() {
		List<Integer> list = newList();
		for (int i = 0; i < 20; i++)
			list.add(i * i);
		
		list.clear();
		assertEquals(0, list.size());
		
		list.add(- 1);
		list.add(- 8);
		list.add(-27);
		assertEquals(3, list.size());
		assertEquals(- 1, (int)list.get(0));
		assertEquals(- 8, (int)list.get(1));
		assertEquals(-27, (int)list.get(2));
	}
	
	
	@Test public void testIterator() {
		List<Integer> list = newList();
		for (int i = 0; i < 50; i++)
			list.add(i * i);
		
		Iterator<Integer> iter = list.iterator();
		for (int i = 0; i < 50; i++) {
			assertTrue(iter.hasNext());
			assertEquals(i * i, (int)iter.next());
		}
		assertFalse(iter.hasNext());
	}
	
	
	@Test public void testIteratorRemove() {
		final int TRIALS = 1000;
		Random rand = new Random();
		for (int i = 0; i < TRIALS; i++) {
			
			List<Integer> list0 = new ArrayList<>();
			List<Integer> list1 = newList();
			int len = rand.nextInt(1000);
			for (int j = 0; j < len; j++) {
				int val = rand.nextInt();
				list0.add(val);
				list1.add(val);
			}
			
			double prob = rand.nextDouble();
			Iterator<?> iter0 = list0.iterator();
			Iterator<?> iter1 = list1.iterator();
			while (iter0.hasNext()) {
				assertTrue(iter1.hasNext());
				iter0.next();
				iter1.next();
				if (rand.nextDouble() < prob) {
					iter0.remove();
					iter1.remove();
				}
			}
			assertFalse(iter1.hasNext());
			
			assertEquals(list0.size(), list1.size());
			assertEquals(list0, list1);
		}
	}
	
	
	// Comprehensively tests all the defined methods.
	@Test public void testAgainstJavaListRandomly() {
		Random rand = new Random();
		List<Integer> list0 = new ArrayList<>();
		List<Integer> list1 = newList();
		int size = 0;
		for (int i = 0; i < 100000; i++) {
			int op = rand.nextInt(100);
			
			if (op < 1) {  // Clear
				checkStructure(list1);
				list0.clear();
				list1.clear();
				size = 0;
				
			} else if (op < 2) {  // Set
				if (size > 0) {
					int index = rand.nextInt(size);
					int val = rand.nextInt();
					list0.set(index, val);
					list1.set(index, val);
				}
				
			} else if (op < 30) {  // Random insertion
				int n = rand.nextInt(100) + 1;
				for (int j = 0; j < n; j++) {
					int index = rand.nextInt(size + 1);
					int val = rand.nextInt();
					list0.add(index, val);
					list1.add(index, val);
				}
				size += n;
				
			} else if (op < 50) {  // Ascending insertion
				int n = rand.nextInt(100) + 1;
				int offset = rand.nextInt(size + 1);
				for (int j = 0; j < n; j++, offset++) {
					int val = rand.nextInt();
					list0.add(offset, val);
					list1.add(offset, val);
				}
				size += n;
				
			} else if (op < 70) {  // Descending insertion
				int n = rand.nextInt(100) + 1;
				int offset = rand.nextInt(size + 1);
				for (int j = 0; j < n; j++) {
					int val = rand.nextInt();
					list0.add(offset, val);
					list1.add(offset, val);
				}
				size += n;
				
			} else if (op < 80) {  // Random deletion
				int n = rand.nextInt(100) + 1;
				for (int j = 0; j < n && size > 0; j++, size--) {
					int index = rand.nextInt(size);
					assertEquals(list0.remove(index), list1.remove(index));
				}
				
			} else if (op < 90) {  // Ascending deletion
				int n = rand.nextInt(100) + 1;
				if (size > 0) {
					int offset = rand.nextInt(size);
					for (int j = 0; j < n && offset < size; j++, size--)
						assertEquals(list0.remove(offset), list1.remove(offset));
				}
				
			} else if (op < 100) {  // Descending deletion
				int n = rand.nextInt(100) + 1;
				if (size > 0) {
					int offset = rand.nextInt(size);
					for (int j = 0; j < n && offset >= 0; j++, offset--, size--)
						assertEquals(list0.remove(offset), list1.remove(offset));
				}
			} else
				throw new AssertionError();
			
			assertEquals(size, list0.size());
			assertEquals(size, list1.size());
			if (size > 0) {
				for (int j = 0; j < 10; j++) {
					int index = rand.nextInt(size);
					assertEquals(list0.get(index), list1.get(index));
				}
			}
		}
	}
	
	
	
	// This test suite is valid for any java.util.List, not only AvlTreeList.
	// You could substitute other classes in this instantiation here.
	private static <E> List<E> newList() {
		return new AvlTreeList<>();
	}
	
	
	private static void checkStructure(List<?> list) {
		if (list instanceof AvlTreeList)
			((AvlTreeList<?>)list).checkStructure();
	}
	
}
