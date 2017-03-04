# 
# Simple FLAC encoder (Python)
# 
# Copyright (c) 2017 Project Nayuki
# https://www.nayuki.io/page/simple-flac-implementation
# 
# (MIT License)
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

import sys
python3 = sys.version_info.major >= 3


def main(argv):
	if len(argv) != 3:
		sys.exit("Usage: python " + argv[0] + " InFile.wav OutFile.flac")
	with open(argv[1], "rb") as inp:
		with BitOutputStream(open(argv[2], "wb")) as out:
			encode_file(inp, out)


def encode_file(inp, out):
	# Read and parse WAV file headers
	def fail_if(cond, msg):
		if cond:
			raise ValueError(msg)
	fail_if(read_fully(inp, 4) != b"RIFF", "Invalid RIFF file header")
	read_little_int(inp, 4)
	fail_if(read_fully(inp, 4) != b"WAVE", "Invalid WAV file header")
	fail_if(read_fully(inp, 4) != b"fmt ", "Unrecognized WAV file chunk")
	fail_if(read_little_int(inp, 4) != 16, "Unsupported WAV file type")
	fail_if(read_little_int(inp, 2) != 0x0001, "Unsupported WAV file codec")
	numchannels = read_little_int(inp, 2)
	fail_if(not (1 <= numchannels <= 8), "Too many (or few) audio channels")
	samplerate = read_little_int(inp, 4)
	fail_if(not (1 <= samplerate < (1 << 20)), "Sample rate too large or invalid")
	read_little_int(inp, 4)
	read_little_int(inp, 2)
	sampledepth = read_little_int(inp, 2)
	fail_if(sampledepth not in (8,16,24,32), "Unsupported sample depth")
	fail_if(read_fully(inp, 4) != b"data", "Unrecognized WAV file chunk")
	sampledatalen = read_little_int(inp, 4)
	fail_if(sampledatalen <= 0 or sampledatalen % (numchannels * (sampledepth // 8)) != 0, "Invalid length of audio sample data")
	
	# Start writing FLAC file header and stream info metadata block
	out.write_int(32, 0x664C6143)
	out.write_int(1, 1)
	out.write_int(7, 0)
	out.write_int(24, 34)
	out.write_int(16, BLOCK_SIZE - 1)
	out.write_int(16, BLOCK_SIZE - 1)
	out.write_int(24, 0)
	out.write_int(24, 0)
	out.write_int(20, samplerate)
	out.write_int(3, numchannels - 1)
	out.write_int(5, sampledepth - 1)
	numsamples = sampledatalen // (numchannels * (sampledepth // 8))
	out.write_int(36, numsamples)
	for _ in range(16):
		out.write_int(8, 0)
	
	# Read raw samples and encode FLAC audio frames
	i = 0
	while numsamples > 0:
		blocksize = min(numsamples, BLOCK_SIZE)
		encode_frame(inp, i, numchannels, sampledepth, samplerate, blocksize, out)
		numsamples -= blocksize
		i += 1

BLOCK_SIZE = 4096


def read_fully(inp, n):
	result = inp.read(n)
	if len(result) < n:
		raise EOFError()
	return result


def read_little_int(inp, n):
	result = 0
	for (i, b) in enumerate(read_fully(inp, n)):
		result |= (b if python3 else ord(b)) << (i * 8)
	return result


def encode_frame(inp, frameindex, numchannels, sampledepth, samplerate, blocksize, out):
	bytespersample = sampledepth // 8
	samples = [[] for _ in range(numchannels)]
	for _ in range(blocksize):
		for chansamples in samples:
			val = read_little_int(inp, bytespersample)
			if sampledepth == 8:
				val -= 128
			else:
				val -= (val >> (sampledepth - 1)) << sampledepth
			chansamples.append(val)
	
	out.reset_crcs()
	out.write_int(14, 0x3FFE)
	out.write_int(1, 0)
	out.write_int(1, 0)
	out.write_int(4, 7)
	out.write_int(4, (14 if samplerate % 10 == 0 else 13))
	out.write_int(4, numchannels - 1)
	out.write_int(3, {8:1, 16:4, 24:6, 32:0}[sampledepth])
	out.write_int(1, 0)
	out.write_int(8, 0xFC | (frameindex >> 30))
	for i in range(24, -1, -6):
		out.write_int(8, 0x80 | ((frameindex >> i) & 0x3F))
	out.write_int(16, blocksize - 1)
	out.write_int(16, samplerate // (10 if samplerate % 10 == 0 else 1))
	out.write_int(8, out.crc8)
	
	for chansamples in samples:
		encode_subframe(chansamples, sampledepth, out)
	out.align_to_byte()
	out.write_int(16, out.crc16)


def encode_subframe(samples, sampledepth, out):
	out.write_int(1, 0)
	out.write_int(6, 1)  # Verbatim coding
	out.write_int(1, 0)
	for x in samples:
		out.write_int(sampledepth, x)



class BitOutputStream(object):
	
	def __init__(self, out):
		self.out = out
		self.bitbuffer = 0
		self.bitbufferlen = 0
		self.reset_crcs()
	
	
	def reset_crcs(self):
		self.crc8 = 0
		self.crc16 = 0
	
	
	def align_to_byte(self):
		self.write_int((-self.bitbufferlen) % 8, 0)
	
	
	def write_int(self, n, val):
		self.bitbuffer <<= n
		self.bitbuffer |= val & ((1 << n) - 1)
		self.bitbufferlen += n
		while self.bitbufferlen >= 8:
			self.bitbufferlen -= 8
			b = (self.bitbuffer >> self.bitbufferlen) & 0xFF
			self.out.write(bytes((b,)) if python3 else chr(b))
			self.crc8 = CRC8_TABLE[self.crc8 ^ b]
			self.crc16 = CRC16_TABLE[(self.crc16 >> 8) ^ b] ^ ((self.crc16 & 0xFF) << 8)
		self.bitbuffer &= (1 << self.bitbufferlen) - 1
	
	
	def close(self):
		self.out.close()
	
	
	def __enter__(self):
		return self
	
	
	def __exit__(self, type, value, traceback):
		self.close()


CRC8_TABLE = []
CRC16_TABLE = []
for i in range(256):
	temp8 = i
	temp16 = i << 8
	for _ in range(8):
		temp8 = (temp8 << 1) ^ ((temp8 >> 7) * 0x107)
		temp16 = (temp16 << 1) ^ ((temp16 >> 15) * 0x18005)
	CRC8_TABLE.append(temp8)
	CRC16_TABLE.append(temp16)



if __name__ == "__main__":
	main(sys.argv)
