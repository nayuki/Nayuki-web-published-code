/* 
 * Hash library
 * 
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/hash-calculator-javascript
 */


namespace hashlib {
	
	type byte = number;
	type int = number;
	
	
	export interface HashFunction {
		
		getName(): string;
		
		getHashLength(): int;
		
		newHasher(): Hasher;
		
	}
	
	
	export interface Hasher {
		
		update(b: ArrayBuffer): void;
		
		getHashDestructively(): ArrayBuffer;
		
	}
	
	
	
	export const Crc32: HashFunction = new class {
		public getName() { return "CRC-32"; }
		public getHashLength() { return 4; }
		public newHasher() { return new Crc32Hasher(); }
	};
	
	
	class Crc32Hasher implements Hasher {
		public constructor(
			private state: int = -1) {}
		
		public update(buf: ArrayBuffer) {
			for (const b of new Uint8Array(buf)) {
				for (let i = 0; i < 8; i++) {
					this.state ^= (b >> i) & 1;
					this.state = (this.state >>> 1) ^ (-(this.state & 1) & 0xEDB88320);
				}
			}
		}
		
		public getHashDestructively() {
			this.state = ~this.state;
			let b = new ArrayBuffer(4);
			new DataView(b).setInt32(0, this.state);
			return b;
		}
	}
	
}
