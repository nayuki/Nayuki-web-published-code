/* 
 * Fast discrete cosine transform algorithms (TypeScript)
 * 
 * Copyright (c) 2018 Project Nayuki. (MIT License)
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

"use strict";


namespace fastDct8 {
	
	// DCT type II, scaled. Algorithm by Arai, Agui, Nakajima, 1988.
	// See: https://web.stanford.edu/class/ee398a/handouts/lectures/07-TransformCoding.pdf#page=30
	export function transform(vector: Array<number>): void {
		const v0 = vector[0] + vector[7];
		const v1 = vector[1] + vector[6];
		const v2 = vector[2] + vector[5];
		const v3 = vector[3] + vector[4];
		const v4 = vector[3] - vector[4];
		const v5 = vector[2] - vector[5];
		const v6 = vector[1] - vector[6];
		const v7 = vector[0] - vector[7];
		
		const v8 = v0 + v3;
		const v9 = v1 + v2;
		const v10 = v1 - v2;
		const v11 = v0 - v3;
		const v12 = -v4 - v5;
		const v13 = (v5 + v6) * A[3];
		const v14 = v6 + v7;
		
		const v15 = v8 + v9;
		const v16 = v8 - v9;
		const v17 = (v10 + v11) * A[1];
		const v18 = (v12 + v14) * A[5];
		
		const v19 = -v12 * A[2] - v18;
		const v20 = v14 * A[4] - v18;
		
		const v21 = v17 + v11;
		const v22 = v11 - v17;
		const v23 = v13 + v7;
		const v24 = v7 - v13;
		
		const v25 = v19 + v24;
		const v26 = v23 + v20;
		const v27 = v23 - v20;
		const v28 = v24 - v19;
		
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
	export function inverseTransform(vector: Array<number>): void {
		const v15 = vector[0] / S[0];
		const v26 = vector[1] / S[1];
		const v21 = vector[2] / S[2];
		const v28 = vector[3] / S[3];
		const v16 = vector[4] / S[4];
		const v25 = vector[5] / S[5];
		const v22 = vector[6] / S[6];
		const v27 = vector[7] / S[7];
		
		const v19 = (v25 - v28) / 2;
		const v20 = (v26 - v27) / 2;
		const v23 = (v26 + v27) / 2;
		const v24 = (v25 + v28) / 2;
		
		const v7  = (v23 + v24) / 2;
		const v11 = (v21 + v22) / 2;
		const v13 = (v23 - v24) / 2;
		const v17 = (v21 - v22) / 2;
		
		const v8 = (v15 + v16) / 2;
		const v9 = (v15 - v16) / 2;
		
		const v18 = (v19 - v20) * A[5];  // Different from original
		const v12 = (v19 * A[4] - v18) / (A[2] * A[5] - A[2] * A[4] - A[4] * A[5]);
		const v14 = (v18 - v20 * A[2]) / (A[2] * A[5] - A[2] * A[4] - A[4] * A[5]);
		
		const v6 = v14 - v7;
		const v5 = v13 / A[3] - v6;
		const v4 = -v5 - v12;
		const v10 = v17 / A[1] - v11;
		
		const v0 = (v8 + v11) / 2;
		const v1 = (v9 + v10) / 2;
		const v2 = (v9 - v10) / 2;
		const v3 = (v8 - v11) / 2;
		
		vector[0] = (v0 + v7) / 2;
		vector[1] = (v1 + v6) / 2;
		vector[2] = (v2 + v5) / 2;
		vector[3] = (v3 + v4) / 2;
		vector[4] = (v3 - v4) / 2;
		vector[5] = (v2 - v5) / 2;
		vector[6] = (v1 - v6) / 2;
		vector[7] = (v0 - v7) / 2;
	}
	
	
	let S: Array<number> = [];
	let C: Array<number> = [];
	for (let i = 0; i < 8; i++) {
		C.push(Math.cos(Math.PI / 16 * i));
		S.push(1 / (4 * C[i]));
	}
	S[0] = 1 / (2 * Math.sqrt(2));
	
	let A: Array<number> = [NaN, C[4], C[2] - C[6], C[4], C[6] + C[2], C[6]];
	
}



namespace fastDctLee {
	
	// DCT type II, unscaled. Algorithm by Byeong Gi Lee, 1984.
	// See: http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.118.3056&rep=rep1&type=pdf#page=34
	export function transform(vector: Array<number>): void {
		const n: number = vector.length;
		if (n <= 0 && (n & (n - 1)) != 0)
			throw "Length must be power of 2";
		transformInternal(vector, 0, n, new Float64Array(n));
	}
	
	
	function transformInternal(vector: Array<number>|Float64Array, off: number, len: number, temp: Array<number>|Float64Array): void {
		if (len == 1)
			return;
		const halfLen: number = Math.floor(len / 2);
		for (let i = 0; i < halfLen; i++) {
			const x: number = vector[off + i];
			const y: number = vector[off + len - 1 - i];
			temp[off + i] = x + y;
			temp[off + i + halfLen] = (x - y) / (Math.cos((i + 0.5) * Math.PI / len) * 2);
		}
		transformInternal(temp, off, halfLen, vector);
		transformInternal(temp, off + halfLen, halfLen, vector);
		for (let i = 0; i < halfLen - 1; i++) {
			vector[off + i * 2 + 0] = temp[off + i];
			vector[off + i * 2 + 1] = temp[off + i + halfLen] + temp[off + i + halfLen + 1];
		}
		vector[off + len - 2] = temp[off + halfLen - 1];
		vector[off + len - 1] = temp[off + len - 1];
	}
	
	
	// DCT type III, unscaled. Algorithm by Byeong Gi Lee, 1984.
	// See: https://www.nayuki.io/res/fast-discrete-cosine-transform-algorithms/lee-new-algo-discrete-cosine-transform.pdf
	export function inverseTransform(vector: Array<number>): void {
		const n: number = vector.length;
		if (n <= 0 && (n & (n - 1)) != 0)
			throw "Length must be power of 2";
		vector[0] /= 2;
		inverseTransformInternal(vector, 0, n, new Float64Array(n));
	}
	
	
	function inverseTransformInternal(vector: Array<number>|Float64Array, off: number, len: number, temp: Array<number>|Float64Array): void {
		if (len == 1)
			return;
		const halfLen: number = Math.floor(len / 2);
		temp[off + 0] = vector[off + 0];
		temp[off + halfLen] = vector[off + 1];
		for (let i = 1; i < halfLen; i++) {
			temp[off + i] = vector[off + i * 2];
			temp[off + i + halfLen] = vector[off + i * 2 - 1] + vector[off + i * 2 + 1];
		}
		inverseTransformInternal(temp, off, halfLen, vector);
		inverseTransformInternal(temp, off + halfLen, halfLen, vector);
		for (let i = 0; i < halfLen; i++) {
			const x: number = temp[off + i];
			const y: number = temp[off + i + halfLen] / (Math.cos((i + 0.5) * Math.PI / len) * 2);
			vector[off + i] = x + y;
			vector[off + len - 1 - i] = x - y;
		}
	}
	
}



class fastDctFft {
	
	// DCT type II, unscaled.
	public static transform(vector: Array<number>): void {
		const len: number = vector.length;
		const halfLen: number = Math.floor(len / 2);
		let real = new Float64Array(len);
		for (let i = 0; i < halfLen; i++) {
			real[i] = vector[i * 2];
			real[len - 1 - i] = vector[i * 2 + 1];
		}
		if (len % 2 == 1)
			real[halfLen] = vector[len - 1];
		for (let i = 0; i < len; i++)
			vector[i] = 0;
		transform(real, vector);
		for (let i = 0; i < len; i++) {
			const temp: number = i * Math.PI / (len * 2);
			vector[i] = real[i] * Math.cos(temp) + vector[i] * Math.sin(temp);
		}
	}
	
	
	// DCT type III, unscaled.
	public static inverseTransform(vector: Array<number>): void {
		const len: number = vector.length;
		if (len > 0)
			vector[0] /= 2;
		let real = new Float64Array(len);
		for (let i = 0; i < len; i++) {
			const temp: number = i * Math.PI / (len * 2);
			real[i] = vector[i] * Math.cos(temp);
			vector[i] *= -Math.sin(temp);
		}
		transform(real, vector);
		
		const halfLen = Math.floor(len / 2);
		for (let i = 0; i < halfLen; i++) {
			vector[i * 2 + 0] = real[i];
			vector[i * 2 + 1] = real[len - 1 - i];
		}
		if (len % 2 == 1)
			vector[len - 1] = real[halfLen];
	}
	
}
