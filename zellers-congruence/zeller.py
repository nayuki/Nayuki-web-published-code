# 
# Zeller's congruence (Python)
# by Project Nayuki, 2022. Public domain.
# https://www.nayuki.io/page/zellers-congruence
# 

import random, sys, unittest
from typing import List, Tuple


# ---- Zeller's congruence function ----

def day_of_week(y: int, m: int, d: int) -> int:
	"""Returns the day-of-week dow for the given date
	(y, m, d) on the proleptic Gregorian calendar.
	Values of dow are 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
	Strict values of m are 1 = January, ..., 12 = December.
	Strict values of d start from 1.
	The handling of months and days-of-month is lenient."""
	m -= 3
	y += m // 12
	m %= 12
	temp: int = y + y // 4 - y // 100 + y // 400
	return (temp + (m * 13 + 12) // 5 + d) % 7



# ---- Test suite ----

class _ZellerTest(unittest.TestCase):
	
	def test_simple(self) -> None:
		CASES: List[Tuple[int,int,int,int]] = [
			(-679,  9,  8, 1),
			(-657,  2,  6, 3),
			(-629,  5, 14, 2),
			(-567,  8, 25, 0),
			(-526,  7, 24, 5),
			(-316, 11, 18, 6),
			(-270,  7, 17, 1),
			(-212,  1, 25, 5),
			(-212, 11,  2, 0),
			(- 43,  7, 20, 6),
			(1619, 10, 16, 3),
			(1620, 11, 30, 1),
			(1631,  9,  3, 3),
			(1637,  2, 18, 3),
			(1653,  5, 25, 0),
			(1735,  1,  7, 5),
			(1753,  8, 28, 2),
			(1804,  6, 30, 6),
			(1810, 10,  3, 3),
			(1835,  3,  2, 1),
			(1844,  8, 14, 3),
			(1844, 12, 16, 1),
			(1899,  5, 23, 2),
			(1912, 12, 10, 2),
			(1915,  8,  2, 1),
			(1938,  6, 18, 6),
			(1945,  6,  7, 4),
			(1965,  4, 28, 3),
			(1998,  6, 18, 4),
			(1999, 12, 31, 5),
			(2000,  1,  1, 6),
			(2000,  2,  1, 2),
			(2000,  2, 29, 2),
			(2000,  3,  1, 3),
			(2001,  3,  1, 4),
			(2002,  3,  1, 5),
			(2003,  3,  1, 6),
			(2004,  3,  1, 1),
			(2071,  6, 13, 6),
			(2094,  1, 20, 3),
			(2124,  7, 26, 3),
			(2196, 10, 12, 3),
			(2213,  5,  5, 3),
			(2216,  3, 15, 5),
			(2225,  8, 26, 5),
			(2268,  9,  2, 3),
			(2306,  7, 25, 3),
			(2336,  6, 20, 6),
			(2348,  7, 16, 5),
		]
		for (y, m, d, dow) in CASES:
			self.assertEqual(dow, day_of_week(y, m, d))
	
	
	def test_ascending(self) -> None:
		y: int = 1600
		m: int = 1
		d: int = 1
		dow: int = 6
		while y < 2400:
			self.assertEqual(dow, day_of_week(y, m, d))
			y, m, d = ZellerTest._next_date(y, m, d)
			dow = (dow + 1) % 7
	
	
	def test_descending(self) -> None:
		y: int = 1600
		m: int = 1
		d: int = 1
		dow: int = 6
		while y > 800:
			self.assertEqual(dow, day_of_week(y, m, d))
			y, m, d = ZellerTest._previous_date(y, m, d)
			dow = (dow - 1) % 7
	
	
	def test_vs_naive_randomly(self) -> None:
		TRIALS: int = 100
		for _ in range(TRIALS):
			y: int = random.randint(1600, 2400)
			m: int = random.randint(1, 12)
			d: int = random.randint(1, ZellerTest._month_length(y, m))
			actual: int = day_of_week(y, m, d)
			expect: int = ZellerTest._day_of_week_naive(y, m, d)
			self.assertEqual(expect, actual)
	
	
	def test_lenient_randomly(self) -> None:
		TRIALS: int = 100_000
		for _ in range(TRIALS):
			y: int = random.randint(2000, 2400)
			m: int = random.randint(1, 12)
			d: int = random.randint(1, ZellerTest._month_length(y, m))
			dow: int = day_of_week(y, m, d)
			
			temp: int = random.randint(-5000, 5000)
			y += temp
			m -= temp * 12
			d += random.randint(-500, 500) * 7
			self.assertEqual(dow, day_of_week(y, m, d))
	
	
	# ---- Helper functions ----
	
	@staticmethod
	def _day_of_week_naive(y: int, m: int, d: int) -> int:
		if not (1 <= m <= 12):
			raise ValueError("Invalid month")
		if not (1 <= d <= ZellerTest._month_length(y, m)):
			raise ValueError("Invalid day-of-month")
		
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
			raise ValueError("Invalid month")
		if not (1 <= d <= ZellerTest._month_length(y, m)):
			raise ValueError("Invalid day-of-month")
		
		if d < ZellerTest._month_length(y, m):
			return (y, m, d + 1)
		elif m < 12:
			return (y, m + 1, 1)
		else:
			return (y + 1, 1, 1)
	
	
	@staticmethod
	def _previous_date(y: int, m: int, d: int) -> Tuple[int,int,int]:
		if not (1 <= m <= 12):
			raise ValueError("Invalid month")
		if not (1 <= d <= ZellerTest._month_length(y, m)):
			raise ValueError("Invalid day-of-month")
		
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
