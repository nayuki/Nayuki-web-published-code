# 
# AVL tree list test (Python)
# 
# Copyright (c) 2022 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/avl-tree-list
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy of
# this software and associated documentation files (the "Software"), to deal in
# the Software without restriction, including without limitation the rights to
# use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
# the Software, and to permit persons to whom the Software is furnished to do so,
# subject to the following conditions:
# - The above copyright notice and this permission notice shall be included in
#   all copies or substantial portions of the Software.
# - The Software is provided "as is", without warranty of any kind, express or
#   implied, including but not limited to the warranties of merchantability,
#   fitness for a particular purpose and noninfringement. In no event shall the
#   authors or copyright holders be liable for any claim, damages or other
#   liability, whether in an action of contract, tort or otherwise, arising from,
#   out of or in connection with the Software or the use or other dealings in the
#   Software.
# 

import random, unittest
from typing import Iterator, List, Optional
from avltreelist import AvlTreeList


class AvlTreeListTest(unittest.TestCase):
	
	def test_add(self) -> None:
		lst: AvlTreeList[str] = AvlTreeList()
		lst.append("January")
		lst.append("February")
		lst.append("March")
		lst.append("April")
		lst.append("May")
		lst.append("June")
		lst.check_structure()
		self.assertEqual(6, len(lst))
		self.assertEqual("January" , lst[0])
		self.assertEqual("February", lst[1])
		self.assertEqual("March"   , lst[2])
		self.assertEqual("April"   , lst[3])
		self.assertEqual("May"     , lst[4])
		self.assertEqual("June"    , lst[5])
	
	
	def test_add_list(self) -> None:
		lst: AvlTreeList[str] = AvlTreeList()
		
		small: AvlTreeList[str] = AvlTreeList()
		small.append("January")
		lst.extend(small)
		
		small = AvlTreeList()
		small.append("February")
		small.append("March")
		small.append("April")
		lst.extend(small)
		
		small = AvlTreeList()
		small.append("May")
		small.append("June")
		small.append("July")
		small.append("August")
		small.append("September")
		small.append("October")
		small.append("November")
		small.append("December")
		lst.extend(small)
		
		self.assertEqual(12, len(lst))
		self.assertEqual("January"  , lst[ 0])
		self.assertEqual("February" , lst[ 1])
		self.assertEqual("March"    , lst[ 2])
		self.assertEqual("April"    , lst[ 3])
		self.assertEqual("May"      , lst[ 4])
		self.assertEqual("June"     , lst[ 5])
		self.assertEqual("July"     , lst[ 6])
		self.assertEqual("August"   , lst[ 7])
		self.assertEqual("September", lst[ 8])
		self.assertEqual("October"  , lst[ 9])
		self.assertEqual("November" , lst[10])
		self.assertEqual("December" , lst[11])
	
	
	def test_set(self) -> None:
		lst: AvlTreeList[Optional[str]] = AvlTreeList()
		for _ in range(10):
			lst.append(None)
		lst[0] = "zero"
		lst[1] = "ten"
		lst[2] = "twenty"
		lst[3] = "thirty"
		lst[4] = "forty"
		lst[5] = "fifty"
		lst[6] = "sixty"
		lst[7] = "seventy"
		lst[8] = "eighty"
		lst[9] = "ninety"
		self.assertEqual(10, len(lst))
		self.assertEqual("zero"   , lst[0])
		self.assertEqual("ten"    , lst[1])
		self.assertEqual("twenty" , lst[2])
		self.assertEqual("thirty" , lst[3])
		self.assertEqual("forty"  , lst[4])
		self.assertEqual("fifty"  , lst[5])
		self.assertEqual("sixty"  , lst[6])
		self.assertEqual("seventy", lst[7])
		self.assertEqual("eighty" , lst[8])
		self.assertEqual("ninety" , lst[9])
	
	
	def test_insert_at_beginning(self) -> None:
		lst: AvlTreeList[str] = AvlTreeList()
		lst.insert(0, "Sunday")
		lst.insert(0, "Monday")
		lst.insert(0, "Tuesday")
		self.assertEqual(3, len(lst))
		self.assertEqual("Tuesday", lst[0])
		self.assertEqual("Monday" , lst[1])
		self.assertEqual("Sunday" , lst[2])
	
	
	def test_insert_at_end(self) -> None:
		lst: AvlTreeList[str] = AvlTreeList()
		lst.insert(0, "Saturday")
		lst.insert(1, "Friday")
		lst.insert(2, "Thursday")
		lst.insert(3, "Wednesday")
		self.assertEqual(4, len(lst))
		self.assertEqual("Saturday" , lst[0])
		self.assertEqual("Friday"   , lst[1])
		self.assertEqual("Thursday" , lst[2])
		self.assertEqual("Wednesday", lst[3])
	
	
	def test_insert_at_middle(self) -> None:
		lst: AvlTreeList[str] = AvlTreeList()
		lst.insert(0, "Up")
		lst.insert(1, "Down")
		lst.insert(1, "Left")
		lst.insert(2, "Right")
		lst.insert(1, "Front")
		lst.insert(2, "Back")
		self.assertEqual(6, len(lst))
		self.assertEqual("Up"   , lst[0])
		self.assertEqual("Front", lst[1])
		self.assertEqual("Back" , lst[2])
		self.assertEqual("Left" , lst[3])
		self.assertEqual("Right", lst[4])
		self.assertEqual("Down" , lst[5])
	
	
	def test_insert_list(self) -> None:
		lst: AvlTreeList[str] = AvlTreeList()
		def extend(dest: AvlTreeList[str], i: int, src: AvlTreeList[str]) -> None:
			for (j, val) in enumerate(src):
				dest.insert(i + j, val)
		
		small: AvlTreeList[str] = AvlTreeList()
		small.append("1")
		small.append("2")
		small.append("3")
		small.append("5")
		extend(lst, 0, small)
		
		small = AvlTreeList()
		small.append("377")
		small.append("610")
		small.append("987")
		extend(lst, 4, small)
		
		small = AvlTreeList()
		small.append("8")
		small.append("13")
		small.append("21")
		small.append("144")
		small.append("233")
		extend(lst, 4, small)
		
		small = AvlTreeList()
		small.append("34")
		small.append("55")
		small.append("89")
		extend(lst, 7, small)
		
		self.assertEqual(15, len(lst))
		self.assertEqual(  "1", lst[ 0])
		self.assertEqual(  "2", lst[ 1])
		self.assertEqual(  "3", lst[ 2])
		self.assertEqual(  "5", lst[ 3])
		self.assertEqual(  "8", lst[ 4])
		self.assertEqual( "13", lst[ 5])
		self.assertEqual( "21", lst[ 6])
		self.assertEqual( "34", lst[ 7])
		self.assertEqual( "55", lst[ 8])
		self.assertEqual( "89", lst[ 9])
		self.assertEqual("144", lst[10])
		self.assertEqual("233", lst[11])
		self.assertEqual("377", lst[12])
		self.assertEqual("610", lst[13])
		self.assertEqual("987", lst[14])
	
	
	# Stresses the self-balancing mechanism
	def test_insert_many_beginning(self) -> None:
		lst: AvlTreeList[int] = AvlTreeList()
		for i in reversed(range(30000)):
			lst.insert(0, i)
		for (i, x) in enumerate(lst):
			self.assertEqual(i, x)
	
	
	# Stresses the self-balancing mechanism
	def test_insert_many_end(self) -> None:
		lst: AvlTreeList[int] = AvlTreeList()
		for i in range(30000):
			lst.append(i)
		for (i, x) in enumerate(lst):
			self.assertEqual(i, x)
	
	
	# Adds in a weird binary pattern to stress arrays and linked lists
	def test_insert_many_everywhere(self) -> None:
		N: int = 15
		lst: AvlTreeList[int] = AvlTreeList()
		lst.append(0)
		for i in reversed(range(N)):
			k: int = 1
			for j in range(1 << i, 1 << N, 2 << i):
				lst.insert(k, j)
				k += 2
		for (i, x) in enumerate(lst):
			self.assertEqual(i, x)
	
	
	def test_remove(self) -> None:
		lst: AvlTreeList[str] = AvlTreeList()
		s: str = "the quick brown fox jumped over the lazy dog"
		for c in s:
			lst.append(c)
		self.assertEqual(len(s), len(lst))
		
		self.assertEqual('e', lst.pop( 2))
		self.assertEqual('u', lst.pop( 4))
		self.assertEqual('q', lst.pop( 3))
		self.assertEqual(' ', lst.pop( 2))
		self.assertEqual('f', lst.pop(12))
		self.assertEqual(' ', lst.pop(11))
		self.assertEqual('n', lst.pop(10))
		self.assertEqual('w', lst.pop( 9))
		self.assertEqual(' ', lst.pop(11))
		self.assertEqual('j', lst.pop(11))
		self.assertEqual('u', lst.pop(11))
		self.assertEqual('x', lst.pop(10))
		self.assertEqual('p', lst.pop(11))
		self.assertEqual('d', lst.pop(12))
		self.assertEqual('e', lst.pop(11))
		self.assertEqual('v', lst.pop(13))
		self.assertEqual('e', lst.pop(13))
		self.assertEqual('l', lst.pop(19))
		self.assertEqual('z', lst.pop(20))
		self.assertEqual('a', lst.pop(19))
		self.assertEqual(' ', lst.pop(18))
		self.assertEqual('g', lst.pop(22))
		
		s = "thick broom or they do";
		self.assertEqual(len(s), len(lst))
		for i in range(len(s)):
			self.assertEqual(s[i], lst[i])
		
		self.assertEqual('t', lst.pop(0))
		self.assertEqual('c', lst.pop(2))
		self.assertEqual('k', lst.pop(2))
		self.assertEqual(' ', lst.pop(2))
		self.assertEqual('b', lst.pop(2))
		self.assertEqual('r', lst.pop(2))
		self.assertEqual('o', lst.pop(2))
		self.assertEqual('o', lst.pop(2))
		self.assertEqual('o', lst.pop(4))
		self.assertEqual('h', lst.pop(7))
		self.assertEqual(' ', lst.pop(5))
		self.assertEqual('t', lst.pop(5))
		self.assertEqual('o', lst.pop(9))
		self.assertEqual(' ', lst.pop(7))
		self.assertEqual('y', lst.pop(6))
		
		s = "him red";
		self.assertEqual(len(s), len(lst))
		for i in range(len(s)):
			self.assertEqual(s[i], lst[i])
	
	
	def test_clear(self) -> None:
		lst: AvlTreeList[int] = AvlTreeList()
		for i in range(20):
			lst.append(i * i)
		
		lst.clear()
		self.assertEqual(0, len(lst))
		
		lst.append(- 1)
		lst.append(- 8)
		lst.append(-27)
		self.assertEqual(3, len(lst))
		self.assertEqual(- 1, lst[0])
		self.assertEqual(- 8, lst[1])
		self.assertEqual(-27, lst[2])
	
	
	def test_iterator(self) -> None:
		lst: AvlTreeList[int] = AvlTreeList()
		for i in range(50):
			lst.append(i * i)
		
		itr: Iterator[int] = iter(lst)
		for i in range(50):
			self.assertEqual(i * i, next(itr))
		try:
			next(itr)
			self.fail()
		except StopIteration:
			pass
	
	
	# Comprehensively tests all the defined methods.
	def test_against_python_list_randomly(self) -> None:
		ITERATIONS: int = 3000
		list0: List[int] = []
		list1: AvlTreeList[int] = AvlTreeList()
		length = 0
		for i in range(ITERATIONS):
			op: int = random.randrange(100)
			
			if op < 1:  # Clear
				list1.check_structure()
				list0 = []
				list1.clear()
				length = 0
				
			elif op < 2:  # Set
				if length > 0:
					index: int = random.randint(0, length - 1)
					val: int = random.randrange(100000)
					list0[index] = val
					list1[index] = val
				
			elif op < 30:  # Random insertion
				n: int = random.randint(1, 100)
				for j in range(n):
					index = random.randint(0, length)
					val = random.randrange(100000)
					list0.insert(index, val)
					list1.insert(index, val)
					length += 1
				
			elif op < 50:  # Ascending insertion
				n = random.randint(1, 100)
				offset: int = random.randint(0, length)
				for j in range(n):
					val = random.randrange(100000)
					list0.insert(offset + j, val)
					list1.insert(offset + j, val)
				length += n
				
			elif op < 70:  # Descending insertion
				n = random.randint(1, 100)
				offset = random.randint(0, length)
				for j in range(n):
					val = random.randrange(100000)
					list0.insert(offset, val)
					list1.insert(offset, val)
				length += n
				
			elif op < 80:  # Random deletion
				n = min(random.randint(1, 100), length)
				for j in range(n):
					index = random.randint(0, length - 1)
					del list0[index]
					del list1[index]
					length -= 1
				
			elif op < 90:  # Ascending deletion
				if length > 0:
					offset = random.randint(0, length - 1)
					n = min(random.randint(1, 100), length - offset)
					for j in range(n):
						del list0[offset]
						del list1[offset]
					length -= n
				
			elif op < 100:  # Descending deletion
				if length > 0:
					offset = random.randint(0, length - 1)
					n = min(random.randint(1, 100), offset + 1)
					for j in range(n):
						del list0[offset - j]
						del list1[offset - j]
					length -= n
			else:
				raise AssertionError()
			
			if len(list0) != length or len(list1) != length:
				raise AssertionError()
			if length > 0:
				for j in range(10):
					index = random.randint(0, length - 1)
					if list0[index] is not list1[index]:
						raise AssertionError()



if __name__ == "__main__":
	unittest.main()
