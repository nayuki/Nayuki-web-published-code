/* 
 * sRGB transform test (Java)
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import java.util.Random;
import org.junit.Test;


public final class SrgbTransformTest {
	
	private static Random rand = new Random();
	
	
	@Test public void testForwardInverse() {
		int trials = 1000000;
		for (int i = 0; i < trials; i++) {
			double xd = rand.nextDouble();
			float xf = (float)xd;
			double yd = SrgbTransform.srgbToLinear(xd);
			float yf = SrgbTransform.srgbToLinear(xf);
			double zd = SrgbTransform.linearToSrgb(xd);
			float zf = SrgbTransform.linearToSrgb(xf);
			assertEquals(xd, SrgbTransform.linearToSrgb(yd), DELTA);
			assertEquals(xf, SrgbTransform.linearToSrgb(yf), DELTA);
			assertEquals(xd, SrgbTransform.srgbToLinear(zd), DELTA);
			assertEquals(xf, SrgbTransform.srgbToLinear(zf), DELTA);
		}
	}
	
	
	@Test public void testMonotonicity() {
		int trials = 1000000;
		for (int i = 0; i < trials; i++) {
			double xd = rand.nextDouble() * 2 - 0.5;
			double yd = rand.nextDouble() * 2 - 0.5;
			if (yd < xd) {
				double temp = xd;
				xd = yd;
				yd = temp;
			}
			float xf = (float)xd;
			float yf = (float)yd;
			if (yd - xd > DELTA) {
				assertTrue(SrgbTransform.srgbToLinear(xd) <= SrgbTransform.srgbToLinear(yd));
				assertTrue(SrgbTransform.linearToSrgb(xd) <= SrgbTransform.linearToSrgb(yd));
				assertTrue(SrgbTransform.linearToSrgb8Bit(xd) <= SrgbTransform.linearToSrgb8Bit(yd));
			}
			if (yf - xf > DELTA) {
				assertTrue(SrgbTransform.srgbToLinear(xf) <= SrgbTransform.srgbToLinear(yf));
				assertTrue(SrgbTransform.linearToSrgb(xf) <= SrgbTransform.linearToSrgb(yf));
			}
		}
	}
	
	
	@Test public void test8Bit() {
		for (int i = 0; i < (1 << 8); i++) {
			assertTrue(SrgbTransform.linearToSrgb8Bit(SrgbTransform.srgb8BitToLinearDouble(i)) == i);
			assertTrue(SrgbTransform.linearToSrgb8Bit(SrgbTransform.srgb8BitToLinearFloat (i)) == i);
			assertTrue(Math.abs(SrgbTransform.linearToSrgb(SrgbTransform.srgb8BitToLinearDouble(i)) * 255 - i) < 1);
		}
	}
	
	
	
	private static final double DELTA = 1e-6;
	
}
