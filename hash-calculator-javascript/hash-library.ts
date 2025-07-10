/* 
 * Hash library
 * 
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/hash-calculator-javascript
 */


namespace hashlib {
	
	/*---- Common ----*/
	
	type byte = number;
	type int = number;
	
	
	export interface HashFunction {
		
		getName(): string;
		
		getHashLength(): int;
		
		newHasher(): Hasher;
		
	}
	
	
	export interface Hasher {
		
		update(buf: ArrayBuffer): void;
		
		getHashDestructively(): ArrayBuffer;
		
	}
	
	
	class BlockHasher implements Hasher {
		
		private block: Uint8Array;
		private blockFilled: int = 0;
		private totalLength: bigint = 0n;
		
		
		public constructor(blockLength: int, private core: BlockHasherCore) {
			if (blockLength <= 0)
				throw new RangeError("Non-positive block length");
			this.block = new Uint8Array(blockLength);
		}
		
		
		public update(buf: ArrayBuffer): void {
			const b = new Uint8Array(buf);
			const blockLen: int = this.block.length;
			this.totalLength += BigInt(b.length);
			let off: int = 0;
			if (this.blockFilled > 0) {
				const n: int = Math.min(blockLen - this.blockFilled, b.length);
				this.block.set(b.subarray(0, n), this.blockFilled);
				this.blockFilled += n;
				if (this.blockFilled < blockLen)
					return;
				this.core.compressBlocks(this.block);
				off += n;
			}
			if (b.length - off >= blockLen) {
				const end = off + Math.floor((b.length - off) / blockLen) * blockLen;
				this.core.compressBlocks(b.subarray(off, end));
				off = end;
			}
			this.block.set(b.subarray(off));
			this.blockFilled = b.length - off;
		}
		
		
		public getHashDestructively(): ArrayBuffer {
			return this.core.getHashDestructively(this, this.totalLength);
		}
		
	}
	
	
	interface BlockHasherCore {
		
		compressBlocks(msg: Uint8Array): void;
		
		getHashDestructively(bh: BlockHasher, totalLength: bigint): ArrayBuffer;
		
	}
	
	
	
	/*---- CRC-32 ----*/
	
	export const Crc32: HashFunction = new class {
		public getName() { return "CRC-32"; }
		public getHashLength() { return 4; }
		public newHasher() { return new Crc32Hasher(); }
	};
	
	
	class Crc32Hasher implements Hasher {
		public constructor(
			private state: int = -1) {}
		
		public update(buf: ArrayBuffer) {
			const TABLE: Uint32Array = Crc32Hasher.TABLE;
			let state: int = this.state;
			for (const b of new Uint8Array(buf))
				state = (state >>> 8) ^ TABLE[(state ^ b) & 0xFF];
			this.state = state;
		}
		
		public getHashDestructively() {
			this.state = ~this.state;
			let b = new ArrayBuffer(4);
			new DataView(b).setInt32(0, this.state);
			return b;
		}
		
		static TABLE = new Uint32Array(256);
		static {
			for (let i = 0; i < Crc32Hasher.TABLE.length; i++) {
				let temp: int = i;
				for (let j = 0; j < 8; j++)
					temp = (temp >>> 1) ^ ((temp & 1) * 0xEDB88320);
				Crc32Hasher.TABLE[i] = temp;
			}
		}
	}
	
	
	
	/*---- SHA-1 ----*/
	
	export const Sha1: HashFunction = new class {
		public getName() { return "SHA-1"; }
		public getHashLength() { return 20; }
		public newHasher() { return new BlockHasher(64, new Sha1Core()); }
	};
	
	
	class Sha1Core implements BlockHasherCore {
		
		private state = new Uint32Array([0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0]);
		
		compressBlocks(msg: Uint8Array): void {
			let schedule = new Uint32Array(80);
			const view = new DataView(msg.buffer, msg.byteOffset, msg.byteLength);
			for (let i = 0; i < msg.length; ) {
				for (let j = 0; j < 16; j++, i += 4)
					schedule[j] = view.getUint32(i);
				for (let j = 16; j < schedule.length; j++) {
					const temp: int = schedule[j - 3] ^ schedule[j - 8] ^ schedule[j - 14] ^ schedule[j - 16];
					schedule[j] = temp << 1 | temp >>> 31;
				}
				let [a, b, c, d, e] = this.state;
				for (let j = 0; j < schedule.length; j++) {
					let f: int;
					if (j < 20)
						f = (((b & c) | (~b & d)) + 0x5A827999) | 0;
					else if (j < 40)
						f = ((b ^ c ^ d) + 0x6ED9EBA1) | 0;
					else if (j < 60)
						f = (((b & c) ^ (b & d) ^ (c & d)) + 0x8F1BBCDC) | 0;
					else if (j < 80)
						f = ((b ^ c ^ d) + 0xCA62C1D6) | 0;
					else
						throw new RangeError("Unreachable");
					let temp: int = ((a << 5 | a >>> 27) + f) | 0;
					temp = (temp + e) | 0;
					temp = (temp + schedule[j]) | 0;
					e = d;
					d = c;
					c = b << 30 | b >>> 2;
					b = a;
					a = temp;
				}
				this.state[0] = (this.state[0] + a) | 0;
				this.state[1] = (this.state[1] + b) | 0;
				this.state[2] = (this.state[2] + c) | 0;
				this.state[3] = (this.state[3] + d) | 0;
				this.state[4] = (this.state[4] + e) | 0;
			}
		}
		
		getHashDestructively(bh: BlockHasher, totalLength: bigint): ArrayBuffer {
			let trailer = new Uint8Array(72 - Number((totalLength + 8n) % 64n));
			trailer[0] = 0x80;
			for (let i = 0; i < 8; i++)
				trailer[trailer.length - 1 - i] = Number(totalLength << 3n >> BigInt(i * 8));
			bh.update(trailer);
			let result = new ArrayBuffer(this.state.length * 4);
			let view = new DataView(result);
			this.state.forEach((x, i) => view.setUint32(i * 4, x));
			return result;
		}
		
	}
	
	
	
	/*---- SHA-256 ----*/
	
	export const Sha256: HashFunction = new class {
		public getName() { return "SHA-256"; }
		public getHashLength() { return 32; }
		public newHasher() { return new BlockHasher(64, new Sha256Core()); }
	};
	
	
	class Sha256Core implements BlockHasherCore {
		
		private state = new Uint32Array([
			0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
			0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19]);
		
		compressBlocks(msg: Uint8Array): void {
			let schedule = new Uint32Array(64);
			const view = new DataView(msg.buffer, msg.byteOffset, msg.byteLength);
			for (let i = 0; i < msg.length; ) {
				for (let j = 0; j < 16; j++, i += 4)
					schedule[j] = view.getUint32(i);
				for (let j = 16; j < schedule.length; j++) {
					let temp: int = (schedule[j - 16] + schedule[j - 7]) | 0;
					const x: int = schedule[j - 15];
					temp = (temp + ((x << 25 | x >>>  7) ^ (x << 14 | x >>> 18) ^ (x >>>  3))) | 0;
					const y: int = schedule[j - 2];
					temp = (temp + ((y << 15 | y >>> 17) ^ (y << 13 | y >>> 19) ^ (y >>> 10))) | 0;
					schedule[j] = temp;
				}
				let [a, b, c, d, e, f, g, h] = this.state;
				for (let j = 0; j < schedule.length; j++) {
					let t1: int = (h + ((e << 26 | e >>> 6) ^ (e << 21 | e >>> 11) ^ (e << 7 | e >>> 25))) | 0;
					t1 = (t1 + ((e & f) ^ (~e & g))) | 0;
					t1 = (t1 + Sha256Core.K[j]) | 0;
					t1 = (t1 + schedule[j]) | 0;
					const t2: int = (((a << 30 | a >>> 2) ^ (a << 19 | a >>> 13) ^ (a << 10 | a >>> 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
					h = g;
					g = f;
					f = e;
					e = (d + t1) | 0;
					d = c;
					c = b;
					b = a;
					a = (t1 + t2) | 0;
				}
				this.state[0] = (this.state[0] + a) | 0;
				this.state[1] = (this.state[1] + b) | 0;
				this.state[2] = (this.state[2] + c) | 0;
				this.state[3] = (this.state[3] + d) | 0;
				this.state[4] = (this.state[4] + e) | 0;
				this.state[5] = (this.state[5] + f) | 0;
				this.state[6] = (this.state[6] + g) | 0;
				this.state[7] = (this.state[7] + h) | 0;
			}
		}
		
		getHashDestructively(bh: BlockHasher, totalLength: bigint): ArrayBuffer {
			let trailer = new Uint8Array(72 - Number((totalLength + 8n) % 64n));
			trailer[0] = 0x80;
			for (let i = 0; i < 8; i++)
				trailer[trailer.length - 1 - i] = Number(totalLength << 3n >> BigInt(i * 8));
			bh.update(trailer);
			let result = new ArrayBuffer(this.state.length * 4);
			let view = new DataView(result);
			this.state.forEach((x, i) => view.setUint32(i * 4, x));
			return result;
		}
		
		static K = new Uint32Array([
			0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
			0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
			0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
			0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
			0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
			0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
			0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
			0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
			0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
			0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
			0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
			0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
			0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
			0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
			0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
			0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
		]);
		
	}
	
}
