# 
# Knuth's -yllion number notation demo (Python)
# 
# Run main program with no arguments. Prints stuff to standard output.
# 
# Copyright (c) 2020 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/knuths-yllion-number-notation
# 

import codecs, itertools, random, sys


# ---- Main runnable demo ----

def main():
	if sys.version_info[0] >= 3:
		# Monkey-patch stdout to accept Unicode strings
		sys.stdout = codecs.getwriter("UTF-8")(sys.stdout.buffer)
	
	for i in itertools.count(4):
		# Choose a random positive number that is exactly 'bits' bits long
		bits = int(round(2 ** (i / 2.0)))
		n = random.randrange(1 << (bits - 1), 1 << bits)
		numdigits = len(str(n))  # Number of digits in base 10, i.e. floor(log10(n))+1
		if numdigits > 8192:
			break
		print("({} bits, {} digits) {}".format(n.bit_length(), numdigits, n))
		
		# Print the number in various notations
		if numdigits <= 69:
			print(ConventionalEnglishNotation.to_string_with_commas(n))
			print(ConventionalEnglishNotation.number_to_words(n))
		if numdigits <= 8192:
			print(YllionEnglishNotation.to_string_with_separators(n))
			print(YllionEnglishNotation.number_to_words(n))
			chinese = YllionChineseNotation.number_to_words(n)
			if sys.version_info[0] < 3:
				chinese = chinese.encode("UTF-8")
			print(chinese)
		print("")



# ---- Submodules for different number formats ----

# See https://en.wikipedia.org/wiki/English_numerals .
class ConventionalEnglishNotation(object):
	
	# For example: number_to_words(1234567) -> "one million two hundred thirty-four thousand five hundred sixty-seven".
	@staticmethod
	def number_to_words(n):
		# Simple cases
		if n < 0:
			return "negative " + ConventionalEnglishNotation.number_to_words(-n)
		elif n == 0:
			return "zero"
		
		# 1 <= n <= 999
		elif n < 1000:
			s = ""
			if n >= 100:
				s += ConventionalEnglishNotation._ONES[n // 100] + " hundred"
				if n % 100 != 0:
					s += " "
				n %= 100
			s += ConventionalEnglishNotation._TENS[n // 10]
			if n < 20:
				s += ConventionalEnglishNotation._ONES[n]
			elif n % 10 != 0:
				s += "-" + ConventionalEnglishNotation._ONES[n % 10]
			return s
		
		else:  # n >= 1000
			parts = []
			for illion in ConventionalEnglishNotation._ILLIONS:
				if n == 0:
					break
				rem = n % 1000
				if rem > 0:
					s0 = ConventionalEnglishNotation.number_to_words(rem)
					s1 = (" " + illion) if (illion is not None) else ""
					parts.append(s0 + s1)
				n //= 1000
			if n != 0:
				raise ValueError("Number too large")
			return " ".join(reversed(parts))
	
	
	# For example: to_string_with_commas(-123456789) -> "-123,456,798".
	@staticmethod
	def to_string_with_commas(n):
		if n < 0:
			return "-" + ConventionalEnglishNotation.to_string_with_commas(-n)
		else:
			s = str(n)
			for i in range(len(s) - 3, 0, -3):
				s = s[ : i] + "," + s[i : ]
			return s
	
	
	_ONES = [
		"", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
		"ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
	
	_TENS = [
		"", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
	
	_ILLIONS = [
		None, "thousand", "million", "billion", "trillion", "quadrillion",
		"quintillion", "sextillion", "septillion", "octillion", "nonillion",
		"decillion", "undecillion", "duodecillion", "tredecillion", "quattuordecillion",
		"quindecillion", "sexdecillion", "septendecillion", "octodecillion", "novemdecillion",
		"vigintillion"]



# Donald Knuth's system; see https://en.wikipedia.org/wiki/-yllion .
class YllionEnglishNotation(object):
	
	@staticmethod
	def number_to_words(n):
		if n < 0:
			return "negative " + YllionEnglishNotation.number_to_words(-n)
		elif n < 100:  # 0 <= n <= 99, borrow functionality from another class
			return ConventionalEnglishNotation.number_to_words(n)
		
		else:  # n >= 100
			temp = str(n)
			yllionslen = len(YllionEnglishNotation._YLLIONS)
			if len(temp) > (1 << yllionslen):
				raise ValueError("Number too large")
			for i in reversed(range(1, yllionslen)):
				negsplit = 1 << i
				if len(temp) > negsplit:
					high = int(temp[ : -negsplit])
					low  = int(temp[-negsplit : ])
					return ((YllionEnglishNotation.number_to_words(high) + " " + YllionEnglishNotation._YLLIONS[i]) if (high > 0) else "") \
						+ (" " if (high > 0 and low > 0) else "") \
						+ (YllionEnglishNotation.number_to_words(low) if low > 0 else "")
			raise AssertionError()
	
	
	# For example: to_string_with_separators(12345678901234567890) -> "1234:5678,9012;3456,7890".
	@staticmethod
	def to_string_with_separators(n):
		if n < 0:
			return "-" + YllionEnglishNotation.to_string_with_separators(-n)
		else:
			s = str(n)
			for (i, j) in zip(range(len(s) - 4, 0, -4), itertools.count(1)):
				temp = bin(j)
				k = len(temp) - len(temp.rstrip("0"))  # Number of trailing zeros in j
				k = min(len(YllionEnglishNotation._SEPARATORS) - 1, k)
				s = s[ : i] + YllionEnglishNotation._SEPARATORS[k] + s[i : ]
			return s
	
	
	_YLLIONS = [
		None, "hundred", "myriad", "myllion", "byllion", "tryllion", "quadryllion",
		"quintyllion", "sextyllion", "septyllion", "octyllion", "nonyllion", "decyllion"]
	
	_SEPARATORS = [",", ";", ":", "'"]



# Donald Knuth's system; see https://en.wikipedia.org/wiki/-yllion .
class YllionChineseNotation(object):
	
	@staticmethod
	def number_to_words(n):
		if n < 0:
			return u"\u8CA0" + YllionChineseNotation.number_to_words(-n)
		elif n == 0:
			return u"\u96F6"
		elif n < 100:
			return (((YllionChineseNotation._ONES[n // 10] if (n >= 20) else u"") + u"\u5341") if (n >= 10) else u"") \
				+ YllionChineseNotation._ONES[n % 10]
		else:
			temp = str(n)
			yllionslen = len(YllionChineseNotation._YLLIONS)
			if len(temp) > (1 << yllionslen):
				raise ValueError("Number too large")
			for i in reversed(range(1, yllionslen)):
				negsplit = 1 << i
				if len(temp) > negsplit:
					high = int(temp[ : -negsplit])
					low  = int(temp[-negsplit : ])
					return ((YllionChineseNotation.number_to_words(high) + YllionChineseNotation._YLLIONS[i]) if (high > 0) else u"") \
						+ (YllionChineseNotation.number_to_words(low) if (low > 0) else u"")
			raise AssertionError()
	
	
	_ONES = [u"", u"\u4E00", u"\u4E8C", u"\u4E09", u"\u56DB", u"\u4E94", u"\u516D", u"\u4E03", u"\u516B", u"\u4E5D"]
	
	_YLLIONS = [None, u"\u767E", u"\u842C", u"\u5104", u"\u5146", u"\u4EAC", u"\u5793", u"\u79ED", u"\u7A70", u"\u6E9D", u"\u6F97", u"\u6B63", u"\u8F09"]



# ---- Application launcher ----

if __name__ == "__main__":
	main()
