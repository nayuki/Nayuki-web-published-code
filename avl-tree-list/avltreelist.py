# 
# AVL tree list (Python)
# 
# Copyright (c) 2021 Project Nayuki. (MIT License)
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

from __future__ import annotations
from typing import cast, ClassVar, Generator, Generic, Iterable, List, Optional, Set, TypeVar


E = TypeVar("E")
T = TypeVar("T")

class AvlTreeList(Generic[E]):
	
	root: AvlTreeList.Node[E]
	size: int
	
	
	def __init__(self, lst: Optional[Iterable[E]] = None):
		self.clear()
		if lst is not None:
			self.extend(lst)
	
	
	def __len__(self) -> int:
		return self.root.size
	
	
	def __getitem__(self, index: int) -> E:
		if not (0 <= index < len(self)):
			raise IndexError()
		return self.root.get_node_at(index).value
	
	
	def __setitem__(self, index: int, val: E) -> None:
		if not (0 <= index < len(self)):
			raise IndexError()
		self.root.get_node_at(index).value = val
	
	
	def insert(self, index: int, val: E) -> None:
		if not (0 <= index <= len(self)):  # Different constraint than the other methods
			raise IndexError()
		self.root = self.root.insert_at(index, val)
	
	
	def append(self, val: E) -> None:
		self.insert(len(self), val)
	
	
	def extend(self, lst: Iterable[E]) -> None:
		for val in lst:
			self.append(val)
	
	
	def pop(self, index: Optional[int] = None) -> E:
		if index is None:
			index = len(self) - 1
		result: E = self[index]
		del self[index]
		return result
	
	
	def __delitem__(self, index: int) -> None:
		if not (0 <= index < len(self)):
			raise IndexError()
		self.root = self.root.remove_at(index)
	
	
	def clear(self) -> None:
		self.root = cast(AvlTreeList.Node[E], AvlTreeList.Node.EMPTY_LEAF)
	
	
	# Note: Not fail-fast on concurrent modification.
	def __iter__(self) -> Generator[E,None,None]:
		stack: List[AvlTreeList.Node[E]] = []
		node: AvlTreeList.Node[E] = self.root
		while True:
			while node is not cast(AvlTreeList.Node[E], AvlTreeList.Node.EMPTY_LEAF):
				stack.append(node)
				node = _non_none(node.left)
			if len(stack) == 0:
				break
			node = stack.pop()
			yield node.value
			node = _non_none(node.right)
	
	
	def __str__(self) -> str:
		return "[" + ", ".join(str(x) for x in self) + "]"
	
	
	# For unit tests
	def check_structure(self) -> None:
		self.root.check_structure(set())
	
	
	
	class Node(Generic[T]):
		
		EMPTY_LEAF: ClassVar[AvlTreeList.Node[object]]
		
		
		value: T
		height: int
		size: int
		left: Optional[AvlTreeList.Node[T]]
		right: Optional[AvlTreeList.Node[T]]
		
		
		def __init__(self, val: T, isleaf: bool = False):
			# The object stored at this node. Can be None.
			self.value = val
			
			if isleaf:  # For the singleton empty leaf node
				self.height = 0
				self.size   = 0
				self.left   = None
				self.right  = None
				
			else:  # Normal non-leaf nodes
				# The height of the tree rooted at this node. Empty nodes have height 0.
				# This node has height equal to max(left.height, right.height) + 1.
				self.height = 1
				
				# The number of non-empty nodes in the tree rooted at this node, including this node.
				# Empty nodes have size 0. This node has size equal to left.size + right.size + 1.
				self.size   = 1
				
				# The root node of the left subtree.
				self.left   = self._empty_leaf()
				
				# The root node of the right subtree.
				self.right  = self._empty_leaf()
		
		
		def get_node_at(self, index: int) -> AvlTreeList.Node[T]:
			assert 0 <= index < self.size  # Automatically implies self != EMPTY_LEAF, because EMPTY_LEAF.size == 0
			leftsize: int = _non_none(self.left).size
			if index < leftsize:
				return _non_none(self.left).get_node_at(index)
			elif index > leftsize:
				return _non_none(self.right).get_node_at(index - leftsize - 1)
			else:
				return self
		
		
		def insert_at(self, index: int, obj: T) -> AvlTreeList.Node[T]:
			assert 0 <= index <= self.size
			if self is self._empty_leaf():  # Automatically implies index == 0, because EMPTY_LEAF.size == 0
				return AvlTreeList.Node(obj)
			leftsize: int = _non_none(self.left).size
			if index <= leftsize:
				self.left = _non_none(self.left).insert_at(index, obj)
			else:
				self.right = _non_none(self.right).insert_at(index - leftsize - 1, obj)
			self._recalculate()
			return self._balance()
		
		
		def remove_at(self, index: int) -> AvlTreeList.Node[T]:
			assert 0 <= index < self.size  # Automatically implies self != EMPTY_LEAF, because EMPTY_LEAF.size == 0
			EMPTY: AvlTreeList.Node[T] = self._empty_leaf()
			leftsize: int = _non_none(self.left).size
			if index < leftsize:
				self.left = _non_none(self.left).remove_at(index)
			elif index > leftsize:
				self.right = _non_none(self.right).remove_at(index - leftsize - 1)
			elif self.left is EMPTY and self.right is EMPTY:
				return EMPTY
			elif self.left is not EMPTY and self.right is EMPTY:
				return _non_none(self.left)
			elif self.left is EMPTY and self.right is not EMPTY:
				return _non_none(self.right)
			else:
				# Find successor node. (Using the predecessor is valid too.)
				temp: AvlTreeList.Node[T] = _non_none(self.right)
				while temp.left is not self._empty_leaf():
					temp = _non_none(temp.left)
				self.value = temp.value  # Replace value by successor
				self.right = _non_none(self.right).remove_at(0)  # Remove successor node
			self._recalculate()
			return self._balance()
		
		
		def __str__(self) -> str:
			return f"AvlTreeNode(size={self.size}, height={self.height}, val={self.value})"
		
		
		# Balances the subtree rooted at this node and returns the new root.
		def _balance(self) -> AvlTreeList.Node[T]:
			bal: int = self._get_balance()
			assert abs(bal) <= 2
			result: AvlTreeList.Node[T] = self
			if bal == -2:
				assert abs(_non_none(self.left)._get_balance()) <= 1
				if _non_none(self.left)._get_balance() == +1:
					self.left = _non_none(self.left)._rotate_left()
				result = self._rotate_right()
			elif bal == +2:
				assert abs(_non_none(self.right)._get_balance()) <= 1
				if _non_none(self.right)._get_balance() == -1:
					self.right = _non_none(self.right)._rotate_right()
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
		def _rotate_left(self) -> AvlTreeList.Node[T]:
			if self.right is self._empty_leaf():
				raise ValueError()
			root: AvlTreeList.Node[T] = _non_none(self.right)
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
		def _rotate_right(self) -> AvlTreeList.Node[T]:
			if self.left is self._empty_leaf():
				raise ValueError()
			root: AvlTreeList.Node[T] = _non_none(self.left)
			self.left = root.right
			root.right = self
			self._recalculate()
			root._recalculate()
			return root
		
		
		# Needs to be called every time the left or right subtree is changed.
		# Assumes the left and right subtrees have the correct values computed already.
		def _recalculate(self) -> None:
			left: AvlTreeList.Node[T] = _non_none(self.left)
			right: AvlTreeList.Node[T] = _non_none(self.right)
			assert self is not self._empty_leaf()
			assert left.height >= 0 and right.height >= 0
			assert left.size >= 0 and right.size >= 0
			self.height = max(left.height, right.height) + 1
			self.size = left.size + right.size + 1
			assert self.height >= 0 and self.size >= 0
		
		
		def _get_balance(self) -> int:
			return _non_none(self.right).height - _non_none(self.left).height
		
		
		# For unit tests, invokable by the outer class.
		def check_structure(self, visitednodes: Set[AvlTreeList.Node[T]]) -> None:
			if self is self._empty_leaf():
				return
			
			if self in visitednodes:
				raise AssertionError("AVL tree structure violated: Not a tree")
			visitednodes.add(self)
			_non_none(self.left ).check_structure(visitednodes)
			_non_none(self.right).check_structure(visitednodes)
			
			if self.height != max(_non_none(self.left).height, _non_none(self.right).height) + 1:
				raise AssertionError("AVL tree structure violated: Incorrect cached height")
			if self.size != _non_none(self.left).size + _non_none(self.right).size + 1:
				raise AssertionError("AVL tree structure violated: Incorrect cached size")
			if abs(self._get_balance()) > 1:
				raise AssertionError("AVL tree structure violated: Height imbalance")
		
		
		def _empty_leaf(self) -> AvlTreeList.Node[T]:
			return cast(AvlTreeList.Node[T], AvlTreeList.Node.EMPTY_LEAF)


# Static initializer. A bit of a hack, but more elegant than using None values as leaf nodes.
AvlTreeList.Node.EMPTY_LEAF = AvlTreeList.Node(None, True)


def _non_none(val: Optional[AvlTreeList.Node[E]]) -> AvlTreeList.Node[E]:
	if val is None:
		raise ValueError()
	return val
