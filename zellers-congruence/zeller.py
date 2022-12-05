# 
# Zeller's congruence (Python)
# by Project Nayuki, 2022. Public domain.
# https://www.nayuki.io/page/zellers-congruence
# 

import random, sys, unittest
from typing import List, Tuple


# ---- Zeller's congruence function ----

def day_of_week(y: int, m: int, d: int) -> int:
	m -= 3
	y += m // 12
	m %= 12
	temp: int = y + y // 4 - y // 100 + y // 400
	return (temp + (m * 13 + 12) // 5 + d) % 7



# ---- Test suite and naive helper functions ----

class ZellerTest(unittest.TestCase):
	
	def test_simple(self) -> None:
		self.assertEqual(5, day_of_week(1999, 12, 31))
		self.assertEqual(6, day_of_week(2000,  1,  1))
		self.assertEqual(2, day_of_week(2000,  2, 29))
		self.assertEqual(3, day_of_week(2000,  3,  1))
		self.assertEqual(4, day_of_week(2001,  3,  1))
		self.assertEqual(5, day_of_week(2002,  3,  1))
		self.assertEqual(6, day_of_week(2003,  3,  1))
		self.assertEqual(1, day_of_week(2004,  3,  1))
	
	
	def test_ascending(self) -> None:
		y: int = 1600
		m: int = 1
		d: int = 1
		dow: int = 6
		while y < 2400:
			self.assertEqual(dow, day_of_week(y, m, d))
			dow = (dow + 1) % 7
			y, m, d = ZellerTest._next_date(y, m, d)
	
	
	def test_descending(self) -> None:
		y: int = 1600
		m: int = 1
		d: int = 1
		dow: int = 6
		while y > 800:
			self.assertEqual(dow, day_of_week(y, m, d))
			dow = (dow - 1) % 7
			y, m, d = ZellerTest._previous_date(y, m, d)
	
	
	def test_vs_naive_randomly(self) -> None:
		TRIALS: int = 100
		for _ in range(TRIALS):
			y: int = random.randint(1600, 2400)
			m: int = random.randint(1, 12)
			d: int = random.randint(1, ZellerTest._month_length(y, m))
			actual: int = day_of_week(y, m, d)
			expect: int = ZellerTest._day_of_week_naive(y, m, d)
			self.assertEqual(expect, actual)
	
	
	@staticmethod
	def _day_of_week_naive(y: int, m: int, d: int) -> int:
		if not (1 <= m <= 12):
			raise ValueError()
		if not (1 <= d <= ZellerTest._month_length(y, m)):
			raise ValueError()
		
		ymd: Tuple[int,int,int] = (1600, 1, 1)
		dow: int = 6
		while ymd < (y, m, d):
			ymd = ZellerTest._next_date(*ymd)
			dow = (dow + 1) % 7
		while ymd > (y, m, d):
			ymd = ZellerTest._previous_date(*ymd)
			dow = (dow - 1) % 7
		return dow
	
	
	@staticmethod
	def _next_date(y: int, m: int, d: int) -> Tuple[int,int,int]:
		if not (1 <= m <= 12):
			raise ValueError()
		if not (1 <= d <= ZellerTest._month_length(y, m)):
			raise ValueError()
		
		if d < ZellerTest._month_length(y, m):
			return (y, m, d + 1)
		elif m < 12:
			return (y, m + 1, 1)
		else:
			return (y + 1, 1, 1)
	
	
	@staticmethod
	def _previous_date(y: int, m: int, d: int) -> Tuple[int,int,int]:
		if not (1 <= m <= 12):
			raise ValueError()
		if not (1 <= d <= ZellerTest._month_length(y, m)):
			raise ValueError()
		
		if d > 1:
			return (y, m, d - 1)
		elif m > 1:
			return (y, m - 1, ZellerTest._month_length(y, m - 1))
		else:
			return (y - 1, 12, 31)
	
	
	@staticmethod
	def _month_length(y: int, m: int) -> int:
		if m != 2:
			return ZellerTest._MONTH_LENGTHS[m]
		else:
			return 29 if ZellerTest._is_leap_year(y) else 28
	
	_MONTH_LENGTHS: List[int] = [-1, 31, -1, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
	
	
	@staticmethod
	def _is_leap_year(y: int) -> bool:
		return (y % 4 == 0) and ((y % 100 != 0) or (y % 400 == 0))



if __name__ == "__main__":
	unittest.main()
