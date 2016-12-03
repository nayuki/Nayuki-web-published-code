# 
# Derive and smooth motion
# Reads a TSV file with motion vectors, performs analysis, and writes to standard output.
# 
# For Python 3+. Requires NumPy library.
# Usage: python derive-and-smooth-motion.py motion-displacements.tsv
# 
# Copyright (c) 2016 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/go-train-acceleration-analyzed-by-video
# 

import itertools, math, numpy, sys
if sys.version_info[ : 3] < (3, 0, 0):
    raise AssertionError("Requires Python 3+")



def main(args):
	# Configuration
	FRAMES_PER_SECOND = 20 / 1.001
	METERS_PER_PIXEL = 0.007452
	DISPLACEMENT_SMOOTHING = 1.5
	VELOCITY_SMOOTHING = 9.0
	ACCELERATION_SMOOTHING = 60.0
	
	
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
		print("{}\t{}\t{}\t{}".format(
			i, disp[i], vel[i] * 3.6, acc[i]))



def make_gaussian_kernel(sigma):
	assert isinstance(sigma, float)
	temp = []
	for i in itertools.count():
		val = i / sigma
		if val > 10.0:
			break
		temp.append(val)
	temp = numpy.array(temp[ : 0 : -1] + temp)
	return numpy.exp(-temp**2)



if __name__ == "__main__":
	main(sys.argv[1 : ])
