/* 
 * sRGB transform (Java)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/srgb-transform-library
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */


/**
 * Applies the transfer function between sRGB values and linear intensities, and vice versa.
 * Floating-point values outside the range [0.0, 1.0] are clipped to these bounds.
 */
public final class SrgbTransform {
	
	/*---- sRGB values to linear intensities ----*/
	
	public static float srgbToLinear(float x) {
		if (x <= 0)
			return 0;
		else if (x >= 1)
			return 1;
		else if (x < 0.04045f)
			return x / 12.92f;
		else
			return (float)Math.pow((x + 0.055) / 1.055, 2.4);
	}
	
	
	public static double srgbToLinear(double x) {
		if (x <= 0)
			return 0;
		else if (x >= 1)
			return 1;
		else if (x < 0.04045)
			return x / 12.92;
		else
			return Math.pow((x + 0.055) / 1.055, 2.4);
	}
	
	
	public static float srgb8BitToLinearFloat(int x) {
		if ((x >>> 8) != 0)
			throw new IllegalArgumentException("Value out of 8-bit range");
		return SRGB_8BIT_TO_LINEAR_FLOAT[x];
	}
	
	
	public static double srgb8BitToLinearDouble(int x) {
		if ((x >>> 8) != 0)
			throw new IllegalArgumentException("Value out of 8-bit range");
		return SRGB_8BIT_TO_LINEAR_DOUBLE[x];
	}
	
	
	private static final float [] SRGB_8BIT_TO_LINEAR_FLOAT  = new float [1 << 8];
	private static final double[] SRGB_8BIT_TO_LINEAR_DOUBLE = new double[1 << 8];
	
	static {
		for (int i = 0; i < SRGB_8BIT_TO_LINEAR_FLOAT.length; i++)
			SRGB_8BIT_TO_LINEAR_FLOAT[i] = srgbToLinear((float)i / (SRGB_8BIT_TO_LINEAR_FLOAT.length - 1));
		for (int i = 0; i < SRGB_8BIT_TO_LINEAR_DOUBLE.length; i++)
			SRGB_8BIT_TO_LINEAR_DOUBLE[i] = srgbToLinear((double)i / (SRGB_8BIT_TO_LINEAR_DOUBLE.length - 1));
	}
	
	
	
	/*---- Linear intensities to sRGB values ----*/
	
	public static float linearToSrgb(float x) {
		if (x <= 0)
			return 0;
		else if (x >= 1)
			return 1;
		else if (x < 0.0031308f)
			return x * 12.92f;
		else
			return (float)(Math.pow(x, 1 / 2.4) * 1.055 - 0.055);
	}
	
	
	public static double linearToSrgb(double x) {
		if (x <= 0)
			return 0;
		else if (x >= 1)
			return 1;
		else if (x < 0.0031308)
			return x * 12.92;
		else
			return Math.pow(x, 1 / 2.4) * 1.055 - 0.055;
	}
	
	
	public static int linearToSrgb8Bit(double x) {
		if (x <= 0)
			return 0;
		double[] table = SRGB_8BIT_TO_LINEAR_DOUBLE;
		if (x >= 1)
			return table.length - 1;
		int y = 0;
		for (int i = table.length >>> 1; i != 0; i >>>= 1) {
			if (table[y | i] <= x)
				y |= i;
		}
		assert y != table.length - 1;
		if (table[y + 1] - x < x - table[y])
			y++;
		assert 0 <= y && y < table.length;
		return y;
	}
	
}
