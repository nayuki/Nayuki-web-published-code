# 
# AA tree set (Python)
# 
# Copyright (c) 2022 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/aa-tree-set
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


class AaTreeSet:
	
	def __init__(self, coll=None):
		self.clear()
		if coll is not None:
			for val in coll:
				self.add(val)
	
	
	def clear(self):
		self.root = AaTreeSet.Node.EMPTY_LEAF
		self.size = 0
	
	
	def __len__(self):
		return self.size
	
	
	def __contains__(self, val):
		node = self.root
		while node is not AaTreeSet.Node.EMPTY_LEAF:
			if val < node.value:
				node = node.left
			elif val > node.value:
				node = node.right
			else:
				return True
		return False
	
	
	def add(self, val):
		if val in self:
			return
		self.root = self.root.add(val)
		self.size += 1
	
	
	def remove(self, val):
		self.root, found = self.root.remove(val)
		if not found:
			raise KeyError(str(val))
		self.size -= 1
	
	
	def discard(self, val):
		self.root, found = self.root.remove(val)
		if found:
			self.size -= 1
	
	
	# Note: Not fail-fast on concurrent modification.
	def __iter__(self):
		stack = []
		node = self.root
		while True:
			while node is not AaTreeSet.Node.EMPTY_LEAF:
				stack.append(node)
				node = node.left
			if len(stack) == 0:
				break
			node = stack.pop()
			yield node.value
			node = node.right
	
	
	# For unit tests
	def check_structure(self):
		visited = set()
		if self.root.check_structure(visited) != self.size or len(visited) != self.size:
			raise AssertionError()
	
	
	
	class Node:
		
		def __init__(self, val=None):
			self.value = val
			if val is None:  # For the singleton empty leaf node
				self.level = 0
			else:  # Normal non-leaf nodes
				self.level = 1
				self.left  = AaTreeSet.Node.EMPTY_LEAF
				self.right = AaTreeSet.Node.EMPTY_LEAF
		
		
		def add(self, val):
			if self is AaTreeSet.Node.EMPTY_LEAF:
				return AaTreeSet.Node(val)
			if val < self.value:
				self.left = self.left.add(val)
			elif val > self.value:
				self.right = self.right.add(val)
			else:
				raise ValueError("Value already in tree")
			return self._skew()._split()  # Rebalance this node
		
		
		def remove(self, val):
			EMPTY = AaTreeSet.Node.EMPTY_LEAF
			if self is EMPTY:
				return (EMPTY, False)
			
			if val < self.value:
				self.left, found = self.left.remove(val)
			elif val > self.value:
				self.right, found = self.right.remove(val)
			else:  # Remove value at this node
				found = True
				if self.left is not EMPTY:
					# Find predecessor node
					temp = self.left
					while temp.right is not EMPTY:
						temp = temp.right
					self.value = temp.value  # Replace value with predecessor
					self.left, fnd = self.left.remove(self.value)  # Remove predecessor node
					assert fnd
				elif self.right is not EMPTY:
					# Find successor node
					temp = self.right
					while temp.left is not EMPTY:
						temp = temp.left
					self.value = temp.value  # Replace value with successor
					self.right, fnd = self.right.remove(self.value)  # Remove successor node
					assert fnd
				else:
					assert self.level == 1
					return (EMPTY, True)
			
			# Rebalance this node if a child was lowered
			if not found or self.level == min(self.left.level, self.right.level) + 1:
				return (self, found)
			if self.right.level == self.level:
				self.right.level -= 1
			self.level -= 1
			result = self._skew()
			result.right = result.right._skew()
			if result.right.right is not EMPTY:
				result.right.right = result.right.right._skew()
			result = result._split()
			result.right = result.right._split()
			return (result, True)
		
		
		#       |          |
		#   A - B    ->    A - B
		#  / \   \        /   / \
		# 0   1   2      0   1   2
		def _skew(self):
			assert self is not AaTreeSet.Node.EMPTY_LEAF
			if self.left.level < self.level:
				return self
			result = self.left
			self.left = result.right
			result.right = self
			return result
		
		
		#   |                      |
		#   |                    - B -
		#   |                   /     \
		#   A - B - C    ->    A       C
		#  /   /   / \        / \     / \
		# 0   1   2   3      0   1   2   3
		def _split(self):
			assert self is not AaTreeSet.Node.EMPTY_LEAF
			# Must short-circuit because if right.level < self.level, then right.right might not exist
			if self.right.level < self.level or self.right.right.level < self.level:
				return self
			result = self.right
			self.right = result.left
			result.left = self
			result.level += 1
			return result
		
		
		# For unit tests, invokable by the outer class.
		def check_structure(self, visitednodes):
			if self is AaTreeSet.Node.EMPTY_LEAF:
				return 0
			if self in visitednodes:
				raise AssertionError()
			visitednodes.add(self)
			
			value = self.value
			level = self.level
			left  = self.left
			right = self.right
			if value is None or left is None or right is None:
				raise AssertionError()
			if not (level > 0 and level == left.level + 1 and level - right.level in (0, 1)):
				raise AssertionError()
			if level == right.level and level == right.right.level:  # Must short-circuit evaluate
				raise AssertionError()
			if left != AaTreeSet.Node.EMPTY_LEAF and not (left.value < value):
				raise AssertionError()
			if right != AaTreeSet.Node.EMPTY_LEAF and not (right.value > value):
				raise AssertionError()
			
			size = 1 + left.check_structure(visitednodes) + right.check_structure(visitednodes)
			if not (2**level - 1 <= size <= 3**level - 1):
				raise AssertionError()
			return size


# Static initializer. A bit of a hack, but more elegant than using None values as leaf nodes.
AaTreeSet.Node.EMPTY_LEAF = AaTreeSet.Node()
