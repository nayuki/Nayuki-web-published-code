# 
# Binomial heap (Python)
# 
# Copyright (c) 2021 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/binomial-heap
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
from typing import Generic, Optional, Protocol, TypeVar


E = TypeVar("E", bound="_Comparable")
T = TypeVar("T", bound="_Comparable")

class _Comparable(Protocol):
	def __lt__(self: E, other: E) -> bool: ...
	def __le__(self: E, other: E) -> bool: ...
	def __gt__(self: E, other: E) -> bool: ...
	def __ge__(self: E, other: E) -> bool: ...


class BinomialHeap(Generic[E]):
	
	head: BinomialHeap.Node[E]
	
	
	def __init__(self) -> None:
		self.head = BinomialHeap.Node()  # Dummy node
	
	
	def empty(self) -> bool:
		return self.head.next is None
	
	
	def __len__(self) -> int:
		result: int = 0
		node: Optional[BinomialHeap.Node[E]] = self.head.next
		while node is not None:
			result |= 1 << node.rank
			node = node.next
		return result
	
	
	def clear(self) -> None:
		self.head.next = None
	
	
	def enqueue(self, val: E) -> None:
		self._merge(BinomialHeap.Node(val))
	
	
	def peek(self) -> E:
		if self.head.next is None:
			raise Exception("Empty heap")
		result: Optional[E] = None
		node: Optional[BinomialHeap.Node[E]] = self.head.next
		while node is not None:
			if result is None or _non_none(node.value) < result:
				result = node.value
			node = node.next
		if result is None:
			raise AssertionError()
		return result
	
	
	def dequeue(self) -> E:
		if self.head.next is None:
			raise Exception("Empty heap")
		min: Optional[E] = None
		nodebeforemin: Optional[BinomialHeap.Node[E]] = None
		prevnode: BinomialHeap.Node[E] = self.head
		while True:
			node: Optional[BinomialHeap.Node[E]] = prevnode.next
			if node is None:
				break
			if min is None or _non_none(node.value) < min:
				min = node.value
				nodebeforemin = prevnode
			prevnode = node
		if (min is None) or (nodebeforemin is None):
			raise AssertionError()
		
		minnode: BinomialHeap.Node[E] = _non_none(nodebeforemin.next)
		nodebeforemin.next = minnode.next
		minnode.next = None
		self._merge(minnode.remove_root())
		return min
	
	
	# Moves all the values in the given heap into this heap
	def merge(self, other: BinomialHeap[E]) -> None:
		if other is self:
			raise ValueError()
		self._merge(other.head.next)
		other.head.next = None
	
	
	def _merge(self, other: Optional[BinomialHeap.Node[E]]) -> None:
		assert self.head.rank == -1
		assert other is None or other.rank >= 0
		this: Optional[BinomialHeap.Node[E]] = self.head.next
		self.head.next = None
		prevtail: Optional[BinomialHeap.Node[E]] = None
		tail: BinomialHeap.Node[E] = self.head
		
		while this is not None or other is not None:
			node: BinomialHeap.Node[E]
			if other is None or (this is not None and this.rank <= other.rank):
				node = _non_none(this)
				this = node.next
			else:
				node = other
				other = other.next
			node.next = None
			
			assert tail.next is None
			if tail.rank < node.rank:
				prevtail = tail
				tail.next = node
				tail = node
			elif tail.rank == node.rank + 1:
				assert prevtail is not None
				node.next = tail
				prevtail.next = node
				prevtail = node
			elif tail.rank == node.rank:
				# Merge nodes
				if _non_none(tail.value) <= _non_none(node.value):
					node.next = tail.down
					tail.down = node
					tail.rank += 1
				else:
					assert prevtail is not None
					tail.next = node.down
					node.down = tail
					node.rank += 1
					tail = node
					prevtail.next = node
			else:
				raise AssertionError()
	
	
	# For unit tests
	def check_structure(self) -> None:
		head: BinomialHeap.Node[E] = self.head
		if head.value is not None or head.rank != -1:
			raise AssertionError("Head must be dummy node")
		# Check chain of nodes and their children
		head.check_structure(True, None)
	
	
	
	# ---- Helper class: Binomial heap node ----
	
	class Node(Generic[T]):
		
		value: Optional[T]
		rank: int
		down: Optional[BinomialHeap.Node[T]]
		next: Optional[BinomialHeap.Node[T]]
		
		
		def __init__(self, val: Optional[T] = None):
			self.value = val
			if val is None:  # Dummy sentinel node at head of list
				self.rank = -1
			else:  # Regular node
				self.rank = 0
			self.down = None
			self.next = None
		
		
		def remove_root(self) -> Optional[BinomialHeap.Node[T]]:
			assert self.next is None
			result: Optional[BinomialHeap.Node[T]] = None
			node: Optional[BinomialHeap.Node[T]] = self.down
			while node is not None:  # Reverse the order of nodes from descending rank to ascending rank
				next: Optional[BinomialHeap.Node[T]] = node.next
				node.next = result
				result = node
				node = next
			return result
		
		
		# For unit tests
		def check_structure(self, ismain: bool, lowerbound: Optional[T]) -> None:
			# Basic checks
			if (self.rank < 0) != (self.value is None):
				raise AssertionError("Invalid node rank or value")
			if ismain:
				if lowerbound is not None:
					raise AssertionError("Invalid arguments")
			else:
				if lowerbound is None:
					raise AssertionError("Invalid arguments")
				if _non_none(self.value) < lowerbound:
					raise AssertionError("Min-heap property violated")
			
			# Check children and non-main chains
			if self.rank > 0:
				if self.down is None or self.down.rank != self.rank - 1:
					raise AssertionError("Down node absent or has invalid rank")
				self.down.check_structure(False, self.value)
				if not ismain:
					if self.next is None or self.next.rank != self.rank - 1:
						raise AssertionError("Next node absent or has invalid rank")
					self.next.check_structure(False, lowerbound)
			elif self.down is not None:
				raise AssertionError("Down node must be absent")
			
			# Check main chain
			if ismain and self.next is not None:
				if self.next.rank <= self.rank:
					raise AssertionError("Next node has invalid rank")
				self.next.check_structure(True, None)


U = TypeVar("U")

def _non_none(val: Optional[U]) -> U:
	if val is None:
		raise ValueError()
	return val
