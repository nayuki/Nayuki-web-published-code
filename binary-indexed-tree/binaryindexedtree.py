# 
# Binary indexed tree (Python)
# 
# Copyright (c) 2020 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/binary-indexed-tree
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


class BinaryIndexedTree:
	
	def __init__(self, arg):
		if isinstance(arg, int):
			self.sumtree = [0] * arg
		else:
			self.sumtree = list(arg)
			for (i, val) in enumerate(self.sumtree):
				# For each consecutive 1 in the lowest order bits of i
				j = 1
				while i & j != 0:
					val += self.sumtree[i ^ j]
					j <<= 1
				self.sumtree[i] = val
	
	
	def __len__(self):
		return len(self.sumtree)
	
	
	def __getitem__(self, index):
		if not (0 <= index < len(self)):
			raise IndexError()
		result = self.sumtree[index]
		# For each consecutive 1 in the lowest order bits of index
		i = 1
		while index & i != 0:
			result -= self.sumtree[index ^ i]
			i <<= 1
		return result
	
	
	def __setitem__(self, index, val):
		if not (0 <= index < len(self)):
			raise IndexError()
		self.add(index, val - self[index])
	
	
	def add(self, index, delta):
		if not (0 <= index < len(self)):
			raise IndexError()
		while index < len(self):
			self.sumtree[index] += delta
			index |= index + 1  # Set lowest 0 bit; strictly increasing
	
	
	def get_total(self):
		return self.get_prefix_sum(len(self))
	
	
	def get_prefix_sum(self, end):
		if not (0 <= end <= len(self)):
			raise IndexError()
		result = 0
		while end > 0:
			result += self.sumtree[end - 1]
			end &= end - 1  # Clear lowest 1 bit; strictly decreasing
		return result
	
	
	def get_range_sum(self, start, end):
		if not (0 <= start <= end <= len(self)):
			raise IndexError()
		return self.get_prefix_sum(end) - self.get_prefix_sum(start)
