# -*- coding: UTF-8 -*-
# 
# Windows timestamp accessor demo (Python)
# 
# Copyright (c) 2020 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/windows-timestamp-accessor-library
# 

import datetime, os
import wintimestamp


# 
# This program performs the following actions:
# 0. Print the creation timestamp and modification timestamp of the current working directory.
# 1. Create a file named "Hello Python Timestamp.txt" with:
#   - Creation time     = 2000-01-01 00:00:00 UTC
#   - Modification time = 2005-05-05 05:05:05 UTC
# 2. Create a file named 你好パイソン.txt with:
#   - Creation time     = 2014-09-21 01:23:45 UTC
#   - Modification time = 2014-09-21 12:34:56.789000 UTC
# 
def main():
	with wintimestamp.WindowsTimestampAccessor() as wt:
		# Action 0
		path = "."
		print(os.path.abspath(path))
		ticks = wt.get_creation_time(path)
		print("{}    {}".format(ticks, wintimestamp.ticks_to_datetime(ticks)))
		ticks = wt.get_modification_time(path)
		print("{}    {}".format(ticks, wintimestamp.ticks_to_datetime(ticks)))
		
		# Action 1
		path = "Hello Python Timestamp.txt"
		if os.path.isfile(path):
			if os.path.getsize(path) > 0:
				raise Exception("File already exists")
		else:
			open(path, "w").close()  # Create zero-length file
		wt.set_creation_time    (path, 630822816000000000)
		wt.set_modification_time(path, 632508663050000000)
		
		# Action 2
		path = u"\u4f60\u597d\u30d1\u30a4\u30bd\u30f3.txt"
		if os.path.isfile(path):
			if os.path.getsize(path) > 0:
				raise Exception("File already exists")
		else:
			open(path, "w").close()  # Create zero-length file
		wt.set_creation_time    (path, wintimestamp.datetime_to_ticks(datetime.datetime(2014, 9, 21,  1, 23, 45,      0)))
		wt.set_modification_time(path, wintimestamp.datetime_to_ticks(datetime.datetime(2014, 9, 21, 12, 34, 56, 789000)))


if __name__ == "__main__":
	main()
