/* 
 * Fast discrete cosine transform algorithms (C)
 * 
 * Copyright (c) 2017 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-discrete-cosine-transform-algorithms
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

#include <math.h>
#include "fast-dct-8.h"


static const double S[] = {
	0.353553390593273762200422,
	0.254897789552079584470970,
	0.270598050073098492199862,
	0.300672443467522640271861,
	0.353553390593273762200422,
	0.449988111568207852319255,
	0.653281482438188263928322,
	1.281457723870753089398043,
};

static const double A[] = {
	NAN,
	0.707106781186547524400844,
	0.541196100146196984399723,
	0.707106781186547524400844,
	1.306562964876376527856643,
	0.382683432365089771728460,
};


// DCT type II, scaled. Algorithm by Arai, Agui, Nakajima, 1988.
// See: https://web.stanford.edu/class/ee398a/handouts/lectures/07-TransformCoding.pdf#page=30
void FastDct8_transform(double vector[8]) {
	const double v0 = vector[0] + vector[7];
	const double v1 = vector[1] + vector[6];
	const double v2 = vector[2] + vector[5];
	const double v3 = vector[3] + vector[4];
	const double v4 = vector[3] - vector[4];
	const double v5 = vector[2] - vector[5];
	const double v6 = vector[1] - vector[6];
	const double v7 = vector[0] - vector[7];
	
	const double v8 = v0 + v3;
	const double v9 = v1 + v2;
	const double v10 = v1 - v2;
	const double v11 = v0 - v3;
	const double v12 = -v4 - v5;
	const double v13 = (v5 + v6) * A[3];
	const double v14 = v6 + v7;
	
	const double v15 = v8 + v9;
	const double v16 = v8 - v9;
	const double v17 = (v10 + v11) * A[1];
	const double v18 = (v12 + v14) * A[5];
	
	const double v19 = -v12 * A[2] - v18;
	const double v20 = v14 * A[4] - v18;
	
	const double v21 = v17 + v11;
	const double v22 = v11 - v17;
	const double v23 = v13 + v7;
	const double v24 = v7 - v13;
	
	const double v25 = v19 + v24;
	const double v26 = v23 + v20;
	const double v27 = v23 - v20;
	const double v28 = v24 - v19;
	
	vector[0] = S[0] * v15;
	vector[1] = S[1] * v26;
	vector[2] = S[2] * v21;
	vector[3] = S[3] * v28;
	vector[4] = S[4] * v16;
	vector[5] = S[5] * v25;
	vector[6] = S[6] * v22;
	vector[7] = S[7] * v27;
}


// DCT type III, scaled. A straightforward inverse of the forward algorithm.
void FastDct8_inverseTransform(double vector[8]) {
	const double v15 = vector[0] / S[0];
	const double v26 = vector[1] / S[1];
	const double v21 = vector[2] / S[2];
	const double v28 = vector[3] / S[3];
	const double v16 = vector[4] / S[4];
	const double v25 = vector[5] / S[5];
	const double v22 = vector[6] / S[6];
	const double v27 = vector[7] / S[7];
	
	const double v19 = (v25 - v28) / 2;
	const double v20 = (v26 - v27) / 2;
	const double v23 = (v26 + v27) / 2;
	const double v24 = (v25 + v28) / 2;
	
	const double v7  = (v23 + v24) / 2;
	const double v11 = (v21 + v22) / 2;
	const double v13 = (v23 - v24) / 2;
	const double v17 = (v21 - v22) / 2;
	
	const double v8 = (v15 + v16) / 2;
	const double v9 = (v15 - v16) / 2;
	
	const double v18 = (v19 - v20) * A[5];  // Different from original
	const double v12 = (v19 * A[4] - v18) / (A[2] * A[5] - A[2] * A[4] - A[4] * A[5]);
	const double v14 = (v18 - v20 * A[2]) / (A[2] * A[5] - A[2] * A[4] - A[4] * A[5]);
	
	const double v6 = v14 - v7;
	const double v5 = v13 / A[3] - v6;
	const double v4 = -v5 - v12;
	const double v10 = v17 / A[1] - v11;
	
	const double v0 = (v8 + v11) / 2;
	const double v1 = (v9 + v10) / 2;
	const double v2 = (v9 - v10) / 2;
	const double v3 = (v8 - v11) / 2;
	
	vector[0] = (v0 + v7) / 2;
	vector[1] = (v1 + v6) / 2;
	vector[2] = (v2 + v5) / 2;
	vector[3] = (v3 + v4) / 2;
	vector[4] = (v3 - v4) / 2;
	vector[5] = (v2 - v5) / 2;
	vector[6] = (v1 - v6) / 2;
	vector[7] = (v0 - v7) / 2;
}
