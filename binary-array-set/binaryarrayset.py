# 
# Binary array set (Python)
# 
# Copyright (c) 2021 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/binary-array-set
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

import abc
from typing import Generator, Generic, Iterable, List, Optional, Protocol, TypeVar


E = TypeVar("E", bound="_Comparable")

class _Comparable(Protocol):
	def __lt__(self: E, other: E) -> bool: ...
	def __le__(self: E, other: E) -> bool: ...
	def __gt__(self: E, other: E) -> bool: ...
	def __ge__(self: E, other: E) -> bool: ...


class BinaryArraySet(Generic[E]):
	
	values: List[Optional[List[E]]]
	length: int
	
	
	# Runs in O(n * (log n)^2) time
	def __init__(self, coll: Optional[Iterable[E]] = None):
		self.clear()
		if coll is not None:
			for val in coll:
				self.add(val)
	
	
	# Runs in O(1) time
	def __len__(self) -> int:
		return self.length
	
	
	# Runs in O(1) time
	def clear(self) -> None:
		# For each i, self.values[i] is either None or an ascending list of length 2^i
		self.values = []
		self.length = 0
	
	
	# Note: Not fail-fast on concurrent modification
	def __iter__(self) -> Generator[E,None,None]:
		for vals in self.values:
			if vals is not None:
				yield from vals
	
	
	# Runs in O((log n)^2) time
	def __contains__(self, val: E) -> bool:
		for vals in self.values:
			if vals is not None:
				# Binary search
				start: int = 0
				end: int = len(vals)
				while start < end:
					mid: int = (start + end) // 2
					midval: E = vals[mid]
					if val < midval:
						end = mid
					elif val > midval:
						start = mid + 1
					elif val == midval:
						return True
					else:
						raise AssertionError()
		return False
	
	
	# Runs in average-case O((log n)^2) time, worst-case O(n) time
	def add(self, val: E) -> None:
		# Checking for duplicates is expensive
		if val not in self:
			self.add_unique(val)
	
	
	# Runs in amortized O(1) time, worst-case O(n) time
	def add_unique(self, val: E) -> None:
		toput: Optional[List[E]] = [val]
		for (i, vals) in enumerate(self.values):
			assert (toput is not None) and (len(toput) == 1 << i)
			if vals is None:
				self.values[i] = toput
				toput = None
				break
			else:
				# Merge two sorted arrays
				assert len(vals) == 1 << i
				next: List[E] = []
				j: int = 0
				k: int = 0
				while j < len(vals) and k < len(toput):
					if vals[j] < toput[k]:
						next.append(vals[j])
						j += 1
					else:
						next.append(toput[k])
						k += 1
				next.extend(vals [j : ])
				next.extend(toput[k : ])
				assert len(next) == 2 << i
				toput = next
				self.values[i] = None
		if toput is not None:
			self.values.append(toput)
		self.length += 1
	
	
	# For unit tests
	def check_structure(self) -> None:
		if self.length < 0:
			raise AssertionError()
		
		sum: int = 0
		for (i, vals) in enumerate(self.values):
			if vals is not None:
				if len(vals) != 1 << i:
					raise AssertionError()
				sum += len(vals)
				for j in range(1, len(vals)):
					if vals[j - 1] >= vals[j]:
						raise AssertionError()
		if sum != self.length:
			raise AssertionError()
