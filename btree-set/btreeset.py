# 
# B-tree set (Python)
# 
# Copyright (c) 2018 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/btree-set
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

import numbers


class BTreeSet(object):
	
	# The degree is the minimum number of children each non-root internal node must have.
	def __init__(self, deg, coll=None):
		if not isinstance(deg, numbers.Integral):
			raise TypeError()
		if deg < 2:
			raise ValueError("Degree must be at least 2")
		self.minkeys = deg - 1      # At least 1
		self.maxkeys = deg * 2 - 1  # At least 3, odd number
		
		self.clear()
		if coll is not None:
			for obj in coll:
				self.add(obj)
	
	
	def __len__(self):
		return self.size
	
	
	def clear(self):
		self.root = BTreeSet.Node(self.maxkeys, True)
		self.size = 0
	
	
	def __contains__(self, obj):
		# Walk down the tree
		node = self.root
		while True:
			found, index = node.search(obj)
			if found:
				return True
			elif node.is_leaf():
				return False
			else:  # Internal node
				node = node.children[index]
	
	
	def add(self, obj):
		# Special preprocessing to split root node
		root = self.root
		if len(root.keys) == self.maxkeys:
			right, middlekey = root.split()
			left = root
			self.root = BTreeSet.Node(self.maxkeys, False)  # Increment tree height
			root = self.root
			root.keys.append(middlekey)
			root.children.append(left)
			root.children.append(right)
		
		# Walk down the tree
		node = root
		while True:
			# Search for index in current node
			assert len(node.keys) < self.maxkeys
			assert node is root or len(node.keys) >= self.minkeys
			found, index = node.search(obj)
			if found:
				return  # Key already exists in tree
			
			if node.is_leaf():  # Simple insertion into leaf
				node.keys.insert(index, obj)
				self.size += 1
				return  # Successfully added
			else:  # Handle internal node
				child = node.children[index]
				if len(child.keys) == self.maxkeys:  # Split child node
					right, middlekey = child.split()
					node.children.insert(index + 1, right)
					node.keys.insert(index, middlekey)
					if obj == middlekey:
						return False  # Key already exists in tree
					elif obj > middlekey:
						child = right
				node = child
	
	
	def remove(self, obj):
		if not self._remove(obj):
			raise KeyError(str(obj))
	
	def discard(self, obj):
		self._remove(obj)
	
	
	def _remove(self, obj):
		# Walk down the tree
		root = self.root
		found, index = root.search(obj)
		node = root
		while True:
			assert len(node.keys) <= self.maxkeys
			assert node is root or len(node.keys) > self.minkeys
			if node.is_leaf():
				if found:  # Simple removal from leaf
					node.remove_key(index)
					self.size -= 1
					return True
				else:
					return False
				
			else:  # Internal node
				if found:  # Key is stored at current node
					left, right = node.children[index : index + 2]
					if len(left.keys) > self.minkeys:  # Replace key with predecessor
						node.keys[index] = left.remove_max()
						self.size -= 1
						return True
					elif len(right.keys) > self.minkeys:
						node.keys[index] = right.remove_min()
						self.size -= 1
						return True
					elif len(left.keys) == self.minkeys and len(right.keys) == self.minkeys:
						# Merge key and right node into left node, then recurse
						if not left.is_leaf():
							left.children.extend(right.children)
						left.keys.append(node.remove_key_and_child(index, index + 1))
						left.keys.extend(right.keys)
						if node is root and len(root.keys) == 0:
							self.root = root.children[0]  # Decrement tree height
							root = self.root
						node = left
						index = self.minkeys  # Index known due to merging; no need to search
					else:
						raise AssertionError("Impossible condition")
				else:  # Key might be found in some child
					child = node.ensure_child_remove(index)
					if node is root and len(root.keys) == 0:
						self.root = root.children[0]  # Decrement tree height
						root = self.root
					node = child
					found, index = node.search(obj)
	
	
	# Note: Not fail-fast on concurrent modification.
	def __iter__(self):
		if self.size == 0:
			return
		
		# Initialization
		nodestack  = []
		indexstack = []
		node = self.root
		while True:
			nodestack.append(node)
			indexstack.append(0)
			if node.is_leaf():
				break
			node = node.children[0]
		
		# Generate elements
		while len(nodestack) > 0:
			node = nodestack.pop()
			index = indexstack.pop()
			if node.is_leaf():
				assert index == 0
				for obj in node.keys:
					yield obj
			else:
				yield node.keys[index]
				index += 1
				if index < len(node.keys):
					nodestack.append(node)
					indexstack.append(index)
				node = node.children[index]
				while True:
					nodestack.append(node)
					indexstack.append(0)
					if node.is_leaf():
						break
					node = node.children[0]
	
	
	# For unit tests
	def check_structure(self):
		# Check size and root node properties
		size = self.size
		root = self.root
		if size < 0 or not isinstance(root, BTreeSet.Node) or (size > self.maxkeys and root.is_leaf()) \
				or (size <= self.minkeys * 2 and (not root.is_leaf() or len(root.keys) != size)):
			raise AssertionError("Invalid size or root type")
		
		# Calculate height by descending into one branch
		height = 0
		node = root
		while not node.is_leaf():
			height += 1
			node = node.children[0]
		
		# Check all nodes and total size
		if root.check_structure(True, height, None, None) != size:
			raise AssertionError("Size mismatch")
	
	
	
	# ---- Helper classes ----
	
	class Node(object):
		
		# Note: Once created, a node's structure never changes between a leaf and internal node.
		def __init__(self, maxkeys, leaf):
			assert maxkeys >= 3 and maxkeys % 2 == 1
			self.maxkeys = maxkeys
			self.keys = []  # Length is in [0, maxkeys] for root node, [minkeys, maxkeys] for all other nodes
			self.children = None if leaf else []  # If internal node, then length always equals len(keys)+1
		
		
		def is_leaf(self):
			return self.children is None
		
		
		# Searches this node's keys list and returns (True, i) if obj equals keys[i],
		# otherwise returns (False, i) if children[i] should be explored. For simplicity,
		# the implementation uses linear search. It's possible to replace it with binary search for speed.
		def search(self, obj):
			keys = self.keys
			i = 0
			while i < len(keys):
				if obj == keys[i]:
					return (True, i)  # Key found
				elif obj > keys[i]:
					i += 1
				else:
					break
			return (False, i)  # Not found, caller should recurse on child
		
		
		# Removes and returns the minimum key among the whole subtree rooted at this node.
		def remove_min(self):
			minkeys = len(self.keys) // 2
			node = self
			while not node.is_leaf():
				assert len(node.keys) > minkeys
				node = node.ensure_child_remove(0)
			assert len(node.keys) > minkeys
			return node.remove_key(0)
		
		
		# Removes and returns the maximum key among the whole subtree rooted at this node.
		def remove_max(self):
			minkeys = len(self.keys) // 2
			node = self
			while not node.is_leaf():
				assert len(node.keys) > minkeys
				node = node.ensure_child_remove(len(node.children) - 1)
			assert len(node.keys) > minkeys
			return node.remove_key(len(node.keys) - 1)
		
		
		# Removes and returns this node's key at the given index.
		def remove_key(self, index):
			if index < 0 or index >= len(self.keys):
				raise IndexError()
			return self.keys.pop(index)
		
		
		# Removes and returns this node's key at the given index,
		# and also removes the child at the given index.
		def remove_key_and_child(self, keyindex, childindex):
			if keyindex < 0 or keyindex >= len(self.keys):
				raise IndexError()
			if self.is_leaf():
				if childindex is not None:
					raise ValueError()
			else:
				if childindex < 0 or childindex >= len(self.children):
					raise IndexError()
				del self.children[childindex]
			return self.remove_key(keyindex)
		
		
		# Moves the right half of keys and children to a new node, returning the pair of values
		# (new node, promoted key). The left half of data is still retained in this node.
		def split(self):
			if len(self.keys) != self.maxkeys:
				raise RuntimeError("Can only split full node")
			minkeys = self.maxkeys // 2
			rightnode = BTreeSet.Node(self.maxkeys, self.is_leaf())
			middlekey = self.keys[minkeys]
			rightnode.keys.extend(self.keys[minkeys + 1 : ])
			del self.keys[minkeys : ]
			if not self.is_leaf():
				rightnode.children.extend(self.children[minkeys + 1 : ])
				del self.children[minkeys + 1 : ]
			return (rightnode, middlekey)
		
		
		# Performs modifications to ensure that this node's child at the given index has at least
		# minKeys+1 keys in preparation for a single removal. The child may gain a key and subchild
		# from its sibling, or it may be merged with a sibling, or nothing needs to be done.
		# A reference to the appropriate child is returned, which is helpful if the old child no longer exists.
		def ensure_child_remove(self, index):
			# Preliminaries
			assert not self.is_leaf()
			minkeys = self.maxkeys // 2
			child = self.children[index]
			if len(child.keys) > minkeys:  # Already satisfies the condition
				return child
			assert len(child.keys) == minkeys
			
			# Get siblings
			left  = self.children[index - 1] if index >= 1 else None
			right = self.children[index + 1] if index < len(self.keys) else None
			internal = not child.is_leaf()
			assert left is not None or right is not None  # At least one sibling exists because degree >= 2
			assert left  is None or left .is_leaf() != internal  # Sibling must be same type (internal/leaf) as child
			assert right is None or right.is_leaf() != internal  # Sibling must be same type (internal/leaf) as child
			
			if left is not None and len(left.keys) > minkeys:  # Steal rightmost item from left sibling
				if internal:
					child.children.insert(0, left.children.pop(-1))
				child.keys.insert(0, self.keys[index - 1])
				self.keys[index - 1] = left.remove_key(len(left.keys) - 1)
				return child
			elif right is not None and len(right.keys) > minkeys:  # Steal leftmost item from right sibling
				if internal:
					child.children.append(right.children.pop(0))
				child.keys.append(self.keys[index])
				self.keys[index] = right.remove_key(0)
				return child
			elif left is not None:  # Merge child into left sibling
				assert len(left.keys) == minkeys
				if internal:
					left.children.extend(child.children)
				left.keys.append(self.remove_key_and_child(index - 1, index))
				left.keys.extend(child.keys)
				return left  # This is the only case where the return value is different
			elif right is not None:  # Merge right sibling into child
				assert len(right.keys) == minkeys
				if internal:
					child.children.extend(right.children)
				child.keys.append(self.remove_key_and_child(index, index + 1))
				child.keys.extend(right.keys)
				return child
			else:
				raise AssertionError("Impossible condition")
		
		
		# Checks the structure recursively and returns the total number of keys in the subtree rooted at this node. For unit tests
		def check_structure(self, isroot, leafdepth, min, max):
			# Check basic fields
			keys = self.keys
			if not isroot and not (self.maxkeys // 2 <= len(keys) <= self.maxkeys):
				raise AssertionError("Invalid number of keys")
			if self.is_leaf() != (leafdepth == 0):
				raise AssertionError("Incorrect leaf/internal node type")
			
			# Check ordering of keys
			tempkeys = [min] + keys + [max]
			for i in range(len(tempkeys) - 1):
				x = tempkeys[i]
				y = tempkeys[i + 1]
				if x is not None and y is not None and y <= x:
					raise AssertionError("Invalid key ordering")
			
			# Count keys in this subtree
			count = len(keys)
			if not self.is_leaf():
				if len(self.children) != len(keys) + 1:
					raise AssertionError("Invalid number of children")
				for (i, child) in enumerate(self.children):
					# Check children pointers and recurse
					if not isinstance(child, BTreeSet.Node):
						raise TypeError()
					count += child.check_structure(False, leafdepth - 1, tempkeys[i], tempkeys[i + 1])
			return count
