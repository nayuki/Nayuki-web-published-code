/*
 * Hash library (compiled from TypeScript)
 *
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/hash-calculator-javascript
 */
"use strict";
var hashlib;
(function (hashlib) {
    hashlib.Crc32 = new class {
        getName() { return "CRC-32"; }
        getHashLength() { return 4; }
        newHasher() { return new Crc32Hasher(); }
    };
    class Crc32Hasher {
        constructor(state = -1) {
            this.state = state;
        }
        update(buf) {
            for (const b of new Uint8Array(buf)) {
                for (let i = 0; i < 8; i++) {
                    this.state ^= (b >> i) & 1;
                    this.state = (this.state >>> 1) ^ (-(this.state & 1) & 0xEDB88320);
                }
            }
        }
        getHashDestructively() {
            this.state = ~this.state;
            let b = new ArrayBuffer(4);
            new DataView(b).setInt32(0, this.state);
            return b;
        }
    }
})(hashlib || (hashlib = {}));
