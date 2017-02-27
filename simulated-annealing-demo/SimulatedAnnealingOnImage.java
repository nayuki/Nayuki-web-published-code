/* 
 * Simulated annealing on image demo (Java)
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/simulated-annealing-demo
 */

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Random;
import javax.imageio.ImageIO;


public final class SimulatedAnnealingOnImage {
	
	public static void main(String[] args) throws IOException {
		// Configurable parameters
		int WIDTH  = 256;
		int HEIGHT = 256;
		long NUM_ITERATIONS = 1_000_000_000L;
		double START_TEMPERATURE = 100.0;
		
		// Run the heavy computation
		int[] pixels = createAnnealedRandomImage(WIDTH, HEIGHT, NUM_ITERATIONS, START_TEMPERATURE, false, true);
		
		// Write output image
		BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
		image.setRGB(0, 0, WIDTH, HEIGHT, pixels, 0, WIDTH);
		String outputFilename = String.format("simulated-annealing-time%d-iters%d-starttemp%.1f.bmp",
			System.currentTimeMillis(), NUM_ITERATIONS, START_TEMPERATURE);
		ImageIO.write(image, "bmp", new File(outputFilename));
	}
	
	
	private static int[] createAnnealedRandomImage(final int width, final int height, final long numIterations,
			final double startTemperature, final boolean deterministic, final boolean printStatus) {
		
		// Create RNG and initial image of totally random pixel colors
		Random rand = deterministic ? new MersenneTwister(0) : reseedRandom();
		int[] pixels = new int[width * height];
		for (int i = 0; i < pixels.length; i++)
			pixels[i] = rand.nextInt() & 0xFFFFFF;  // 24-bit RGB only, no alpha
		
		// Calculate energy level
		int energy = 0;
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++) {
				if (x > 0)  // Horizontal pixel differences
					energy += pixelDiff(pixels[y * width + x], pixels[y * width + (x - 1)]);
				if (y > 0)  // Vertical pixel differences
					energy += pixelDiff(pixels[y * width + x], pixels[(y - 1) * width + x]);
			}
		}
		
		// Perform simulated annealing
		if (printStatus)
			System.err.println("    Done       Iterations      Energy  SwapDiff  Temperature  AcceptProb");
		for (long i = 0; i < numIterations; i++) {
			// Re-seed periodically for excellent random distribution on long sequences
			if (!deterministic && (i & 0xFFFFFFF) == 0)  // Once every 268 million iterations
				rand = reseedRandom();
			
			double t = (double)i / numIterations;  // Normalized time from 0.0 to 1.0
			double temperature = (1 - t) * startTemperature;  // Cooling schedule function
			
			boolean dir = rand.nextBoolean();
			int x0, y0, x1, y1;
			if (dir) {  // Horizontal swap with (x + 1, y)
				x0 = rand.nextInt(width - 1);
				y0 = rand.nextInt(height);
				x1 = x0 + 1;
				y1 = y0;
			} else {  // Vertical swap with (x, y + 1)
				x0 = rand.nextInt(width);
				y0 = rand.nextInt(height - 1);
				x1 = x0;
				y1 = y0 + 1;
			}
			int index0 = y0 * width + x0;
			int index1 = y1 * width + x1;
			int pix0 = pixels[index0];
			int pix1 = pixels[index1];
			int energyDiff = 0;
			
			// Subtract old local energies, then add new
			if (dir) {
				if (x0 > 0) {
					energyDiff -= pixelDiff(pix0, pixels[index0 - 1]);
					energyDiff += pixelDiff(pix1, pixels[index0 - 1]);
				}
				if (x1 + 1 < width) {
					energyDiff -= pixelDiff(pix1, pixels[index1 + 1]);
					energyDiff += pixelDiff(pix0, pixels[index1 + 1]);
				}
				if (y0 > 0) {
					energyDiff -= pixelDiff(pix0, pixels[index0 - width]);
					energyDiff += pixelDiff(pix1, pixels[index0 - width]);
					energyDiff -= pixelDiff(pix1, pixels[index1 - width]);
					energyDiff += pixelDiff(pix0, pixels[index1 - width]);
				}
				if (y0 + 1 < height) {
					energyDiff -= pixelDiff(pix0, pixels[index0 + width]);
					energyDiff += pixelDiff(pix1, pixels[index0 + width]);
					energyDiff -= pixelDiff(pix1, pixels[index1 + width]);
					energyDiff += pixelDiff(pix0, pixels[index1 + width]);
				}
			} else {
				if (y0 > 0) {
					energyDiff -= pixelDiff(pix0, pixels[index0 - width]);
					energyDiff += pixelDiff(pix1, pixels[index0 - width]);
				}
				if (y1 + 1 < height) {
					energyDiff -= pixelDiff(pix1, pixels[index1 + width]);
					energyDiff += pixelDiff(pix0, pixels[index1 + width]);
				}
				if (x0 > 0) {
					energyDiff -= pixelDiff(pix0, pixels[index0 - 1]);
					energyDiff += pixelDiff(pix1, pixels[index0 - 1]);
					energyDiff -= pixelDiff(pix1, pixels[index1 - 1]);
					energyDiff += pixelDiff(pix0, pixels[index1 - 1]);
				}
				if (x0 + 1 < width) {
					energyDiff -= pixelDiff(pix0, pixels[index0 + 1]);
					energyDiff += pixelDiff(pix1, pixels[index0 + 1]);
					energyDiff -= pixelDiff(pix1, pixels[index1 + 1]);
					energyDiff += pixelDiff(pix0, pixels[index1 + 1]);
				}
			}
			
			// Print a sample once every 17 million iterations
			if (printStatus && (i & 0xFFFFFF) == 0) {
				System.err.printf("%7.3f%%  %15d  %10d  %8d  %11.3f  %10.8f%n",
					t * 100, i, energy, energyDiff, temperature, Math.min(fast2Pow(-energyDiff / temperature), 1));
			}
			
			// Probabilistic conditional acceptance
			if (energyDiff < 0 || rand.nextDouble() < fast2Pow(-energyDiff / temperature)) {
				// Accept new image state
				pixels[index0] = pix1;
				pixels[index1] = pix0;
				energy += energyDiff;
			}  // Else discard the proposed change
		}
		return pixels;
	}
	
	
	// Computes an approximation to 2^x in a fast manner. On the input range
	// [-1020, 1020], the relative error is guaranteed to be less than 0.02%.
	private static double fast2Pow(double x) {
		if (x < -1022)  // Underflow
			return 0;
		if (x >= 1024)  // Overflow
			return Double.POSITIVE_INFINITY;
		double y = Math.floor(x);
		double z = x - y;  // In the range [0.0, 1.0)
		double u = Double.longBitsToDouble((long)((int)y + 1023) << 52);  // Equal to 2^floor(x)
		// Cubic polynomial, coefficients from numerical minimization in Wolfram Mathematica
		double v = ((0.07901988694851840505 * z + 0.22412622970387342355) * z + 0.69683883597650776993) * z + 0.99981190792895544660;
		return u * v;
	}
	
	
	private static int pixelDiff(int p0, int p1) {
		int r0 = p0 >>> 16, g0 = (p0 >>> 8) & 0xFF, b0 = p0 & 0xFF;
		int r1 = p1 >>> 16, g1 = (p1 >>> 8) & 0xFF, b1 = p1 & 0xFF;
		return Math.abs(r0 - r1) + Math.abs(g0 - g1) + Math.abs(b0 - b1);
	}
	
	
	private static Random reseedRandom() {
		Random temp = new SecureRandom();
		int[] seed = new int[624];
		for (int i = 0; i < seed.length; i++)
			seed[i] = temp.nextInt();
		return new MersenneTwister(seed);
	}
	
}



/*---- Mersenne Twister random number generator library ----*/

/*
 * The C code was ported to Java by Project Nayuki. The numerical output is identical.
 */

/* 
 * A C-program for MT19937, with initialization improved 2002/01/26.
 * Coded by Takuji Nishimura and Makoto Matsumoto.
 * 
 * Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 
 *   1. Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *
 *   2. Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *
 *   3. The names of its contributors may not be used to endorse or promote
 *      products derived from this software without specific prior written
 *      permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Any feedback is very welcome.
 * http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
 * email: m-mat@math.sci.hiroshima-u.ac.jp
 */
@SuppressWarnings("serial")
final class MersenneTwister extends Random {
	
	private int[] state;
	
	private int index;
	
	
	
	public MersenneTwister() {
		this(toInt32Array(new long[]{System.currentTimeMillis(), System.nanoTime()}));
	}
	
	
	public MersenneTwister(int seed) {
		setSeed(seed);
	}
	
	
	public MersenneTwister(long seed) {
		this(toInt32Array(new long[]{seed}));
	}
	
	
	public MersenneTwister(int[] seed) {
		setSeed(seed);
	}
	
	
	
	public int nextInt() {
		if (index == 624)
			nextState();
		int x = state[index];
		index++;
		
		// Tempering
		x ^= x >>> 11;
		x ^= (x <<  7) & 0x9D2C5680;
		x ^= (x << 15) & 0xEFC60000;
		return x ^ (x >>> 18);
	}
	
	
	protected int next(int bits) {
		return nextInt() >>> (32 - bits);
	}
	
	
	private void setSeed(int seed) {
		if (state == null)
			state = new int[624];
		for (index = 0; index < 624; index++) {
			state[index] = seed;
			seed = 1812433253 * (seed ^ (seed >>> 30)) + index + 1;
		}
	}
	
	
	private void setSeed(int[] seed) {
		setSeed(19650218);
		int i = 1;
		for (int j = 0, k = 0; k < Math.max(624, seed.length); k++) {
			state[i] = (state[i] ^ ((state[i - 1] ^ (state[i - 1] >>> 30)) * 1664525)) + seed[j] + j;
			i++;
			j++;
			if (i == 624) {
				state[0] = state[623];
				i = 1;
			}
			if (j >= seed.length)
				j = 0;
		}
		for (int k = 0; k < 623; k++) {
			state[i] = (state[i] ^ ((state[i - 1] ^ (state[i - 1] >>> 30)) * 1566083941)) - i;
			i++;
			if (i == 624) {
				state[0] = state[623];
				i = 1;
			}
		}
		state[0] = 0x80000000;
	}
	
	
	private void nextState() {
		int k = 0;
		for (; k < 227; k++) {
			int y = (state[k] & 0x80000000) | (state[k + 1] & 0x7FFFFFFF);
			state[k] = state[k + 397] ^ (y >>> 1) ^ ((y & 1) * 0x9908B0DF);
		}
		for (; k < 623; k++) {
			int y = (state[k] & 0x80000000) | (state[k + 1] & 0x7FFFFFFF);
			state[k] = state[k - 227] ^ (y >>> 1) ^ ((y & 1) * 0x9908B0DF);
		}
		int y = (state[623] & 0x80000000) | (state[0] & 0x7FFFFFFF);
		state[623] = state[396] ^ (y >>> 1) ^ ((y & 1) * 0x9908B0DF);
		index = 0;
	}
	
	
	private static int[] toInt32Array(long[] in) {
		int[] out = new int[in.length * 2];
		for (int i = 0; i < in.length; i++) {
			out[i * 2 + 0] = (int)(in[i] >>> 32);
			out[i * 2 + 1] = (int)(in[i] >>>  0);
		}
		return out;
	}
	
}
