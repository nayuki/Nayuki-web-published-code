# 
# Binomial heap (Python)
# 
# Copyright (c) 2017 Project Nayuki. (MIT License)
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


class BinomialHeap(object):
	
	def __init__(self):
		self.head = BinomialHeap.Node()  # Dummy node
	
	
	def empty(self):
		return self.head.next is None
	
	
	def __len__(self):
		result = 0
		node = self.head.next
		while node is not None:
			result |= 1 << node.rank
			node = node.next
		return result
	
	
	def clear(self):
		self.head.next = None
	
	
	def enqueue(self, val):
		self._merge(BinomialHeap.Node(val))
	
	
	def peek(self):
		if self.head.next is None:
			raise Exception("Empty heap")
		result = None
		node = self.head.next
		while node is not None:
			if result is None or node.value < result:
				result = node.value
			node = node.next
		return result
	
	
	def dequeue(self):
		if self.head.next is None:
			raise Exception("Empty heap")
		min = None
		nodebeforemin = None
		prevnode = self.head
		while True:
			node = prevnode.next
			if node is None:
				break
			if min is None or node.value < min:
				min = node.value
				nodebeforemin = prevnode
			prevnode = node
		assert min is not None and nodebeforemin is not None
		
		minnode = nodebeforemin.next
		nodebeforemin.next = minnode.next
		minnode.next = None
		self._merge(minnode.remove_root())
		return min
	
	
	# Moves all the values in the given heap into this heap
	def merge(self, other):
		if other is self:
			raise ValueError()
		self._merge(other.head.next)
		other.head.next = None
	
	
	def _merge(self, other):
		assert self.head.rank == -1
		assert other is None or other.rank >= 0
		this = self.head.next
		self.head.next = None
		prevtail = None
		tail = self.head
		
		while this is not None or other is not None:
			if other is None or (this is not None and this.rank <= other.rank):
				node = this
				this = this.next
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
				if tail.value <= node.value:
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
	def check_structure(self):
		head = self.head
		if head.value is not None or head.rank != -1:
			raise AssertionError("Head must be dummy node")
		# Check chain of nodes and their children
		head.check_structure(True, None)
	
	
	
	# ---- Helper class: Binomial heap node ----
	
	class Node(object):
		
		def __init__(self, val=None):
			self.value = val
			if val is None:  # Dummy sentinel node at head of list
				self.rank = -1
			else:  # Regular node
				self.rank = 0
			self.down = None
			self.next = None
		
		
		def remove_root(self):
			assert self.next is None
			result = None
			node = self.down
			while node is not None:  # Reverse the order of nodes from descending rank to ascending rank
				next = node.next
				node.next = result
				result = node
				node = next
			return result
		
		
		# For unit tests
		def check_structure(self, ismain, lowerbound):
			# Basic checks
			if (self.rank < 0) ^ (self.value is None):
				raise AssertionError("Invalid node rank or value")
			if ismain ^ (lowerbound is None):
				raise AssertionError("Invalid arguments")
			if not ismain and self.value < lowerbound:
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
