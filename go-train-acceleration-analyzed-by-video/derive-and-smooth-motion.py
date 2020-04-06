# 
# Derive and smooth motion
# 
# Reads a TSV file with motion vectors, performs analysis, and writes to standard output.
# Requires NumPy library.
# 
# Copyright (c) 2020 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/go-train-acceleration-analyzed-by-video
# 

import math, numpy, sys


# Configuration
FRAMES_PER_SECOND = 20 / 1.001
METERS_PER_PIXEL = 0.007452
DISPLACEMENT_SMOOTHING = 1.5
VELOCITY_SMOOTHING = 9.0
ACCELERATION_SMOOTHING = 60.0


def main(args):
	if len(args) != 1:
		sys.exit("Usage: python derive-and-smooth-motion.py motion-displacements.tsv")
	
	# Read TSV file data into ndarray
	data = []
	with open(args[0], "rt", encoding="UTF-8", newline=None) as fin:
		for (i, line) in enumerate(fin):
			line = line.rstrip("\n")
			parts = line.split("\t")
			if len(parts) != 4:
				raise ValueError("Expected 4 columns")
			if i > 0:
				data.append(tuple(float(part) for part in parts))
	data = numpy.array(data, dtype=numpy.float64)
	
	
	# Calculate displacement, naive velocity, naive acceleration
	displacement = data[:, 3] * METERS_PER_PIXEL
	velocity = (displacement - numpy.concatenate(([0], displacement[ : -1]))) * FRAMES_PER_SECOND
	acceleration = (numpy.concatenate((velocity[1 : ], [velocity[-1]])) - velocity) * FRAMES_PER_SECOND
	
	# Perform Gaussian smoothing on displacement
	disp = numpy.zeros((displacement.size * 3,), dtype=numpy.float64)
	disp[ : : 3] = displacement  # Pad to 60 Hz
	weights = numpy.zeros(disp.shape, dtype=numpy.float64)
	weights[ : : 3] = 1
	kernel = make_gaussian_kernel(DISPLACEMENT_SMOOTHING)
	disp = numpy.convolve(disp, kernel, mode="same")
	weights = numpy.convolve(weights, kernel, mode="same")
	disp /= weights
	
	# Perform Gaussian smoothing on velocity
	vel = numpy.zeros((velocity.size * 3,), dtype=numpy.float64)
	vel[ : : 3] = velocity  # Pad to 60 Hz
	weights = numpy.zeros(vel.shape, dtype=numpy.float64)
	weights[ : : 3] = 1
	kernel = make_gaussian_kernel(VELOCITY_SMOOTHING)
	vel = numpy.convolve(vel, kernel, mode="same")
	weights = numpy.convolve(weights, kernel, mode="same")
	vel /= weights
	
	# Perform Gaussian smoothing on acceleration
	acc = numpy.zeros((acceleration.size * 3,), dtype=numpy.float64)
	acc[ : : 3] = acceleration  # Pad to 60 Hz
	weights = numpy.zeros(acc.shape, dtype=numpy.float64)
	weights[ : : 3] = 1
	kernel = make_gaussian_kernel(ACCELERATION_SMOOTHING)
	acc = numpy.convolve(acc, kernel, mode="same")
	weights = numpy.convolve(weights, kernel, mode="same")
	acc /= weights
	
	
	# Print results
	HEADER = ("Frame", "Displacement (m)", "Velocity (km/h)", "Acceleration (m/s^2)")
	print("\t".join(HEADER))
	for i in range(disp.size):
		print(f"{i}\t{disp[i]}\t{vel[i] * 3.6}\t{acc[i]}")



# Returns a new 1D ndarray containing an appropriately truncated unnormalized
# Gaussian kernel with the given standard deviation. Pure function.
def make_gaussian_kernel(sigma):
	assert isinstance(sigma, float) and sigma > 0
	n = math.floor(10 * sigma)  # Truncation limit
	return numpy.exp(-(numpy.arange(-n, n + 1) / sigma)**2)


if __name__ == "__main__":
	main(sys.argv[1 : ])
