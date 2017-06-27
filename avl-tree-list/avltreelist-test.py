# 
# AVL tree list test (Python)
# 
# Copyright (c) 2017 Project Nayuki. (MIT License)
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

import random
import avltreelist


# Comprehensively tests all the defined methods against Python's built-in list class
def main():
	ITERATIONS = 3000
	list0 = []
	list1 = avltreelist.AvlTreeList()
	length = 0
	for i in range(ITERATIONS):
		if i % 300 == 0:
			print("Progress: {:.0%}".format(float(i) / ITERATIONS))
		op = random.randrange(100)
		
		if op < 1:  # Clear
			list1.check_structure()
			list0 = []
			list1.clear()
			length = 0
			
		elif op < 2:  # Set
			if length > 0:
				index = random.randint(0, length - 1)
				val = random.randrange(100000)
				list0[index] = val
				list1[index] = val
			
		elif op < 30:  # Random insertion
			n = random.randint(1, 100)
			for j in range(n):
				index = random.randint(0, length)
				val = random.randrange(100000)
				list0.insert(index, val)
				list1.insert(index, val)
				length += 1
			
		elif op < 50:  # Ascending insertion
			n = random.randint(1, 100)
			offset = random.randint(0, length)
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
	
	print("Test passed")


if __name__ == "__main__":
	main()
