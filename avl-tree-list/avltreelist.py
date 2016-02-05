#  
# AVL tree list (Python)
# 
# Copyright (c) 2016 Project Nayuki
# https://www.nayuki.io/page/avl-tree-list
# 
# (MIT License)
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


class AvlTreeList(object):
	
	def __init__(self, lst=None):
		self.clear()
		if lst is not None:
			self.extend(lst)
	
	
	def __len__(self):
		return self.root.size
	
	
	def __getitem__(self, index):
		if index < 0 or index >= len(self):
			raise IndexError()
		return self.root.get_node_at(index).value
	
	
	def __setitem__(self, index, val):
		if index < 0 or index >= len(self):
			raise IndexError()
		self.root.get_node_at(index).value = val
	
	
	def insert(self, index, val):
		if index < 0 or index > len(self):  # Different constraint than the other methods
			raise IndexError()
		self.root = self.root.insert_at(index, val)
	
	
	def append(self, val):
		self.insert(len(self), val)
	
	
	def extend(self, lst):
		for val in lst:
			self.append(val)
	
	
	def __delitem__(self, index):
		if index < 0 or index >= len(self):
			raise IndexError()
		self.root = self.root.remove_at(index)
	
	
	def clear(self):
		self.root = AvlTreeList.Node.EMPTY_LEAF_NODE
	
	
	def __iter__(self):
		return AvlTreeList.Iter(self)
	
	
	def __str__(self):
		return "[" + ", ".join([str(self[i]) for i in range(len(self))]) + "]"
	
	
	# For unit tests
	def check_structure(self):
		self.root.check_structure(set())
	
	
	
	class Node(object):
		
		def __init__(self, val, isleaf=False):
			# The object stored at this node. Can be None.
			self.value = val
			
			if isleaf:  # For the singleton empty leaf node
				self.height = 0
				self.size   = 0
				self.left  = None
				self.right = None
				
			else:  # Normal non-leaf nodes
				# The height of the tree rooted at this node. Empty nodes have height 0.
				# This node has height equal to max(left.height, right.height) + 1.
				self.height = 1
				
				# The number of nodes in the tree rooted at this node, including this node.
				# Empty nodes have size 0. This node has size equal to left.size + right.size + 1.
				self.size = 1
				
				# The root node of the left subtree.
				self.left  = AvlTreeList.Node.EMPTY_LEAF_NODE
				
				# The root node of the right subtree.
				self.right = AvlTreeList.Node.EMPTY_LEAF_NODE
		
		
		def get_node_at(self, index):
			assert 0 <= index < self.size
			if self is AvlTreeList.Node.EMPTY_LEAF_NODE:
				raise ValueError()
			
			leftsize = self.left.size
			if index < leftsize:
				return self.left.get_node_at(index)
			elif index > leftsize:
				return self.right.get_node_at(index - leftsize - 1)
			else:
				return self
		
		
		def insert_at(self, index, obj):
			assert 0 <= index <= self.size
			if self is AvlTreeList.Node.EMPTY_LEAF_NODE:
				if index == 0:
					return AvlTreeList.Node(obj)
				else:
					raise IndexError()
			
			leftsize = self.left.size
			if index <= leftsize:
				self.left = self.left.insert_at(index, obj)
			else:
				self.right = self.right.insert_at(index - leftsize - 1, obj)
			self._recalculate()
			return self._balance()
		
		
		def remove_at(self, index):
			assert 0 <= index < self.size
			EMPTY = AvlTreeList.Node.EMPTY_LEAF_NODE
			if self is EMPTY:
				raise ValueError()
			
			leftsize = self.left.size
			if index < leftsize:
				self.left = self.left.remove_at(index)
			elif index > leftsize:
				self.right = self.right.remove_at(index - leftsize - 1)
			elif self.left is EMPTY and self.right is EMPTY:
				return EMPTY
			elif self.left is not EMPTY and self.right is EMPTY:
				return self.left
			elif self.left is EMPTY and self.right is not EMPTY:
				return self.right
			else:
				# We can remove the successor or the predecessor
				self.value = self._get_successor()
				self.right = self.right.remove_at(0)
			self._recalculate()
			return self._balance()
		
		
		def __str__(self):
			return "AvlTreeNode(size={}, height={}, val={})".format(self.size, self.height, self.value)
		
		
		def _get_successor(self):
			if self is AvlTreeList.Node.EMPTY_LEAF_NODE or self.right is AvlTreeList.Node.EMPTY_LEAF_NODE:
				raise ValueError()
			node = self.right
			while node.left is not AvlTreeList.Node.EMPTY_LEAF_NODE:
				node = node.left
			return node.value
		
		
		# Balances the subtree rooted at this node and returns the new root.
		def _balance(self):
			bal = self._get_balance()
			assert abs(bal) <= 2
			result = self
			if bal == -2:
				assert abs(self.left._get_balance()) <= 1
				if self.left._get_balance() == +1:
					self.left = self.left._rotate_left()
				result = self._rotate_right()
			elif bal == +2:
				assert abs(self.right._get_balance()) <= 1
				if self.right._get_balance() == -1:
					self.right = self.right._rotate_right()
				result = self._rotate_left()
			assert abs(result._get_balance()) <= 1
			return result
		
		
		# 
		#   A            B
		#  / \          / \
		# 0   B   ->   A   2
		#    / \      / \
		#   1   2    0   1
		# 
		def _rotate_left(self):
			if self.right is AvlTreeList.Node.EMPTY_LEAF_NODE:
				raise ValueError()
			root = self.right
			self.right = root.left
			root.left = self
			self._recalculate()
			root._recalculate()
			return root
		
		
		# 
		#     B          A
		#    / \        / \
		#   A   2  ->  0   B
		#  / \            / \
		# 0   1          1   2
		# 
		def _rotate_right(self):
			if self.left is AvlTreeList.Node.EMPTY_LEAF_NODE:
				raise ValueError()
			root = self.left
			self.left = root.right
			root.right = self
			self._recalculate()
			root._recalculate()
			return root
		
		
		# Needs to be called every time the left or right subtree is changed.
		# Assumes the left and right subtrees have the correct values computed already.
		def _recalculate(self):
			assert self is not AvlTreeList.Node.EMPTY_LEAF_NODE
			assert self.left.height >= 0 and self.right.height >= 0
			assert self.left.size >= 0 and self.right.size >= 0
			self.height = max(self.left.height, self.right.height) + 1
			self.size = self.left.size + self.right.size + 1
			assert self.height >= 0 and self.size >= 0
		
		
		def _get_balance(self):
			return self.right.height - self.left.height
		
		
		# For unit tests, invokable by the outer class.
		def check_structure(self, visitednodes):
			if self is AvlTreeList.Node.EMPTY_LEAF_NODE:
				return
			
			if self in visitednodes:
				raise AssertionError("AVL tree structure violated: Not a tree")
			visitednodes.add(self)
			self.left .check_structure(visitednodes)
			self.right.check_structure(visitednodes)
			
			if self.height != max(self.left.height, self.right.height) + 1:
				raise AssertionError("AVL tree structure violated: Incorrect cached height")
			if self.size != self.left.size + self.right.size + 1:
				raise AssertionError("AVL tree structure violated: Incorrect cached size")
			if abs(self._get_balance()) > 1:
				raise AssertionError("AVL tree structure violated: Height imbalance")
	
	
	
	# Note: An iterator is not fail-fast on concurrent modification.
	class Iter(object):
		
		def __init__(self, outer):
			self.stack = []
			node = outer.root
			while node is not AvlTreeList.Node.EMPTY_LEAF_NODE:
				self.stack.append(node)
				node = node.left
		
		
		def __next__(self):  # Python 3
			if len(self.stack) == 0:
				raise StopIteration
			else:
				node = self.stack.pop()
				result = node.value
				node = node.right
				while node is not AvlTreeList.Node.EMPTY_LEAF_NODE:
					self.stack.append(node)
					node = node.left
				return result
		
		next = __next__  # Python 2


# Static initializer. A bit of a hack, but more elegant than using None values as leaf nodes.
AvlTreeList.Node.EMPTY_LEAF_NODE = AvlTreeList.Node(None, True)
