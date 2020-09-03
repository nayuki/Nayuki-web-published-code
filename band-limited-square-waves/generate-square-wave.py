# 
# Band-limited square waves (Python)
# 
# Copyright (c) 2020 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/band-limited-square-waves
# 

import math, pathlib, struct, sys
from typing import List


def main(args: List[str]) -> None:
	# Check number of command line arguments
	if len(args) not in (5, 6):
		sys.exit("""Usage: python generate-square-wave.py Frequency DutyCycle SampleRate Duration [BandLimited/Naive] Output.wav
Example: python generate-square-wave.py 440.0 0.5 48000 1.0 BandLimited Output.wav""")
	
	# Get all command line arguments
	frequency: float = float(args[0])
	dutycycle: float = float(args[1])
	samplerate: int = int(args[2])
	duration: float = float(args[3])
	mode: str
	outfilepath: str
	if len(args) == 5:
		mode = "BandLimited"
		outfilepath = args[4]
	elif len(args) == 6:
		mode = args[4]
		outfilepath = args[5]
	else:
		raise AssertionError()
	
	# Check value ranges
	if frequency <= 0:
		raise ValueError("Frequency must be positive")
	if not (0 <= dutycycle <= 1):
		raise ValueError("Duty cycle must be between 0 and 1")
	if samplerate <= 0:
		raise ValueError("Sample rate must be positive")
	if duration < 0:
		raise ValueError("Duration must be non-negative")
	if mode not in ("BandLimited", "Naive"):
		raise ValueError("Invalid mode specification")
	
	# Start writing file data
	numsamples: int = int(round(duration * samplerate))
	with pathlib.Path(outfilepath).open("wb") as fout:
		# Write WAV header
		fout.write(b"RIFF")
		fout.write(struct.pack("<I", 36 + numsamples * 4))
		fout.write(b"WAVE")
		fout.write(b"fmt ")
		fout.write(struct.pack("<IHHIIHH", 16, 0x0003, 1, samplerate, samplerate * 4, 4, 32))
		fout.write(b"data")
		fout.write(struct.pack("<I", numsamples * 4))
		
		scaler: float
		val: float
		
		if mode == "BandLimited":
			# Calculate harmonic amplitudes
			coefficients: List[float] = [dutycycle - 0.5]  # Start with DC coefficient
			numharmonics: int = int(samplerate // (frequency * 2))
			coefficients += [math.sin(i * dutycycle * math.pi) * 2 / (i * math.pi)
				for i in range(1, numharmonics + 1)]
			
			# Generate audio samples
			scaler = frequency * math.pi * 2 / samplerate
			for i in range(numsamples):
				temp: float = scaler * i
				val = sum(coef * math.cos(j * temp)
					for (j, coef) in enumerate(coefficients))
				fout.write(struct.pack("<f", val))
		
		elif mode == "Naive":
			scaler = frequency / samplerate
			shift: float = dutycycle / 2
			for i in range(numsamples):
				val = 0.5 if ((i * scaler + shift) % 1 < dutycycle) else -0.5
				fout.write(struct.pack("<f", val))
			
		else:
			raise AssertionError()


if __name__ == "__main__":
	main(sys.argv[1 : ])
