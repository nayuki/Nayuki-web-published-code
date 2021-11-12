# 
# Windows timestamp accessor (Python)
# 
# Copyright (c) 2021 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/windows-timestamp-accessor-library
# 

from __future__ import annotations
import datetime, os, subprocess
from types import TracebackType
from typing import IO, List, Optional, Type


# Note: Ticks is the number of 100-nanosecond units since the epoch of
# midnight UTC on January 1st, Year 1 on the proleptic Gregorian calendar

class WindowsTimestampAccessor:
	
	# Initialization and disposal
	
	_EXECUTABLE_PATH: str = "WindowsTimestampAccessor.exe"  # Assumes it is in the current working directory
	
	process: subprocess.Popen
	query: IO[bytes]
	response: IO[bytes]
	
	def __init__(self) -> None:
		self.process = subprocess.Popen(WindowsTimestampAccessor._EXECUTABLE_PATH, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
		stdin  = self.process.stdin
		stdout = self.process.stdout
		assert stdin  is not None
		assert stdout is not None
		self.query = stdin
		self.response = stdout
	
	def close(self) -> None:
		self.query.close()
		self.response.close()
		proc = self.process
		proc.wait()
		if proc.returncode != 0:
			raise subprocess.CalledProcessError(proc.returncode, WindowsTimestampAccessor._EXECUTABLE_PATH, "")
	
	
	def __enter__(self) -> WindowsTimestampAccessor:
		return self
	
	def __exit__(self, type: Optional[Type[BaseException]], value: Optional[BaseException], traceback: Optional[TracebackType]) -> None:
		self.close()
	
	
	# Get-methods return the number of ticks as an int; path is of type str
	
	def get_creation_time(self, path: str) -> int:
		return self._get_some_time("Creation", path)
	
	def get_modification_time(self, path: str) -> int:
		return self._get_some_time("Modification", path)
	
	def get_access_time(self, path: str) -> int:
		return self._get_some_time("Access", path)
	
	def _get_some_time(self, type: str, path: str) -> int:
		self.query.write(f"Get{type}Time\t{os.path.abspath(path)}\n".encode("UTF-8"))
		self.query.flush()
		tokens: List[str] = self.response.readline().decode("UTF-8").rstrip("\r\n").split("\t")
		if len(tokens) != 2 or tokens[0] != "ok":
			raise Exception("Invalid data")
		return int(tokens[1])
	
	
	# Set-methods require the number of ticks to be an int; path is of type str
	
	def set_creation_time(self, path: str, ticks: int) -> None:
		self._set_some_time("Creation", path, ticks)
	
	def set_modification_time(self, path: str, ticks: int) -> None:
		self._set_some_time("Modification", path, ticks)
	
	def set_access_time(self, path: str, ticks: int) -> None:
		self._set_some_time("Access", path, ticks)
	
	def _set_some_time(self, type: str, path: str, ticks: int) -> None:
		self.query.write(f"Set{type}Time\t{os.path.abspath(path)}\t{ticks}\n".encode("UTF-8"))
		self.query.flush()
		line: str = self.response.readline().decode("UTF-8").rstrip("\r\n")
		if line != "ok":
			raise Exception("Invalid data")


# Takes an int. The returned datetime object will be naive, i.e. tzinfo=None.
def ticks_to_datetime(ticks: int) -> datetime.datetime:
	return datetime.datetime.utcfromtimestamp((ticks - _EPOCH) / 1e7)


# The given datetime object must be naive, i.e. tzinfo=None. Returns an int.
def datetime_to_ticks(dt: datetime.datetime) -> int:
	if dt.tzinfo is not None:
		raise ValueError("Naive datetime expected")
	delta: datetime.timedelta = dt - datetime.datetime.utcfromtimestamp(0)
	return ((delta.days * 86400 + delta.seconds) * 1000000 + delta.microseconds) * 10 + _EPOCH


# The instant 1970-01-01 00:00:00 UTC, expressed in ticks.
_EPOCH: int = 621355968000000000
