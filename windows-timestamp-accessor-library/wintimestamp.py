# 
# Windows timestamp accessor (Python)
# 
# Copyright (c) 2020 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/windows-timestamp-accessor-library
# 

import datetime, os, subprocess


# Note: Ticks is the number of 100-nanosecond units since the epoch of
# midnight UTC on January 1st, Year 1 on the proleptic Gregorian calendar

class WindowsTimestampAccessor(object):
	
	# Initialization and disposal
	
	_EXECUTABLE_PATH = "WindowsTimestampAccessor.exe"  # Assumes it is in the current working directory
	
	def __init__(self):
		self.process = subprocess.Popen(WindowsTimestampAccessor._EXECUTABLE_PATH, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
		self.query = self.process.stdin
		self.response = self.process.stdout
	
	def close(self):
		self.query.close()
		self.response.close()
		proc = self.process
		proc.wait()
		if proc.returncode != 0:
			raise subprocess.CalledProcessError(proc.returncode, WindowsTimestampAccessor._EXECUTABLE_PATH, "")
	
	
	def __enter__(self):
		return self
	
	def __exit__(self, type, value, traceback):
		self.close()
	
	
	# Get-methods return the number of ticks as an int; path can be of type str or unicode
	
	def get_creation_time(self, path):
		return self._get_some_time("Creation", path)
	
	def get_modification_time(self, path):
		return self._get_some_time("Modification", path)
	
	def get_access_time(self, path):
		return self._get_some_time("Access", path)
	
	def _get_some_time(self, type, path):
		self.query.write(u"Get{}Time\t{}\n".format(type, os.path.abspath(path)).encode("UTF-8"))
		self.query.flush()
		tokens = self.response.readline().decode("UTF-8").rstrip("\r\n").split("\t")
		if len(tokens) != 2 or tokens[0] != "ok":
			raise Exception("Invalid data")
		return int(tokens[1])
	
	
	# Set-methods require the number of ticks to be an int; path can be of type str or unicode
	
	def set_creation_time(self, path, ticks):
		self._set_some_time("Creation", path, ticks)
	
	def set_modification_time(self, path, ticks):
		self._set_some_time("Modification", path, ticks)
	
	def set_access_time(self, path, ticks):
		self._set_some_time("Access", path, ticks)
	
	def _set_some_time(self, type, path, ticks):
		self.query.write(u"Set{}Time\t{}\t{}\n".format(type, os.path.abspath(path), ticks).encode("UTF-8"))
		self.query.flush()
		line = self.response.readline().decode("UTF-8").rstrip("\r\n")
		if line != "ok":
			raise Exception("Invalid data")


# Takes an int. The returned datetime object will be naive, i.e. tzinfo=None.
def ticks_to_datetime(ticks):
	return datetime.datetime.utcfromtimestamp((ticks - _EPOCH) / 1e7)


# The given datetime object must be naive, i.e. tzinfo=None. Returns an int.
def datetime_to_ticks(dt):
	if dt.tzinfo is not None:
		raise ValueError("Naive datetime expected")
	delta = dt - datetime.datetime.utcfromtimestamp(0)
	return ((delta.days * 86400 + delta.seconds) * 1000000 + delta.microseconds) * 10 + _EPOCH


# The instant 1970-01-01 00:00:00 UTC, expressed in ticks.
_EPOCH = 621355968000000000
