/*
 * Time-based One-Time Password tools (compiled from TypeScript)
 *
 * Copyright (c) 2025 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/time-based-one-time-password-tools
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
var app;
(function (app) {
    function initialize() {
        // Self-check
        try {
            for (const func of totp.TEST_SUITE)
                func();
        }
        catch (e) {
            alert("Self-check failed: " + e.message);
            return;
        }
        for (let elem of document.querySelectorAll("article table#app input")) {
            if (!(elem instanceof HTMLInputElement))
                throw new Error("Assertion error");
            switch (elem.type) {
                case "checkbox":
                    elem.onchange = update;
                    break;
                case "text":
                case "number":
                    elem.oninput = update;
                    break;
            }
        }
        update();
    }
    setTimeout(initialize);
    function getInput(id) {
        return queryElem("#" + id, HTMLInputElement);
    }
    function update() {
        if (getInput("current-time").checked)
            getInput("timestamp").value = Math.floor(Date.now() / 1000).toString();
        let outStr;
        let copyButton = queryHtml("#copy");
        try {
            outStr = totp.calcTotp(totp.decodeBase32(getInput("secret-key").value), parseInt(getInput("epoch").value, 10), parseInt(getInput("time-step").value, 10), parseInt(getInput("timestamp").value, 10), parseInt(getInput("code-length").value, 10));
            copyButton.style.removeProperty("visibility");
        }
        catch (e) {
            outStr = e.message;
            copyButton.style.visibility = "hidden";
        }
        let outputElem = queryHtml("#totp-code");
        if (outputElem.textContent != outStr)
            outputElem.textContent = outStr;
        setTimeout(update, 1000 - Date.now() % 1000);
    }
})(app || (app = {}));
var totp;
(function (totp) {
    // Time-based One-Time Password algorithm (RFC 6238)
    function calcTotp(secretKey, epoch = 0, timeStep = 30, timestamp = null, codeLen = 6, hashFunc = calcSha1Hash, blockSize = 64) {
        if (timestamp === null)
            timestamp = Math.floor(Date.now() / 1000);
        // Calculate counter and HOTP
        let timeCounter = Math.floor((timestamp - epoch) / timeStep);
        let counter = [];
        for (let i = 0; i < 8; i++, timeCounter = Math.floor(timeCounter / 256))
            counter.unshift(timeCounter & 0xFF);
        return calcHotp(secretKey, counter, codeLen, hashFunc, blockSize);
    }
    totp.calcTotp = calcTotp;
    // HMAC-based One-Time Password algorithm (RFC 4226)
    function calcHotp(secretKey, counter, codeLen = 6, hashFunc = calcSha1Hash, blockSize = 64) {
        // Check argument, calculate HMAC
        if (!(1 <= codeLen && codeLen <= 9))
            throw new RangeError("Invalid number of digits");
        const hash = calcHmac(secretKey, counter, hashFunc, blockSize);
        // Dynamically truncate the hash value
        const offset = hash[hash.length - 1] % 16;
        let val = 0;
        for (let i = 0; i < 4; i++)
            val |= hash[offset + i] << ((3 - i) * 8);
        val &= 0x7FFFFFFF;
        // Extract base-10 digits
        let tenPow = 1;
        for (let i = 0; i < codeLen; i++)
            tenPow *= 10;
        val %= tenPow;
        // Format base-10 digits
        let s = val.toString();
        while (s.length < codeLen)
            s = "0" + s;
        return s;
    }
    totp.calcHotp = calcHotp;
    function calcHmac(key, message, hashFunc, blockSize) {
        if (blockSize < 1)
            throw new RangeError("Invalid block size");
        if (key.length > blockSize)
            key = hashFunc(key);
        let newKey = key.slice();
        while (newKey.length < blockSize)
            newKey.push(0x00);
        let innerMsg = newKey.map(b => b ^ 0x36).concat(message);
        const innerHash = hashFunc(innerMsg);
        let outerMsg = newKey.map(b => b ^ 0x5C).concat(innerHash);
        return hashFunc(outerMsg);
    }
    totp.calcHmac = calcHmac;
    function calcSha1Hash(message) {
        let msg = message.concat([0x80]);
        const end = msg.length;
        for (let i = 0, bitLen = message.length * 8; i < 8; i++, bitLen >>>= 8)
            msg.splice(end, 0, bitLen & 0xFF);
        while (msg.length % 64 != 0)
            msg.splice(end, 0, 0x00);
        function rotateLeft32(val, shift) {
            return (val << shift) | (val >>> (32 - shift));
        }
        let state = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
        for (let i = 0; i < msg.length;) {
            let [a, b, c, d, e] = state;
            let schedule = [];
            for (let j = 0; j < 80; j++) {
                const sch = j < 16 ?
                    msg.slice(i, i + 4).reduce((x, y) => ((x << 8) | y)) :
                    rotateLeft32(schedule[j - 3] ^ schedule[j - 8] ^ schedule[j - 14] ^ schedule[j - 16], 1);
                if (j < 16)
                    i += 4;
                schedule.push(sch);
                const temp = [
                    ((b & c) | (~b & d)) + 0x5A827999,
                    (b ^ c ^ d) + 0x6ED9EBA1,
                    ((b & c) ^ (b & d) ^ (c & d)) + 0x8F1BBCDC,
                    (b ^ c ^ d) + 0xCA62C1D6,
                ][Math.floor(j / 20)];
                [a, b, c, d, e] = [(rotateLeft32(a, 5) + temp + e + sch) >>> 0, a, rotateLeft32(b, 30), c, d];
            }
            [a, b, c, d, e].forEach((x, i) => state[i] = (state[i] + x) >>> 0);
        }
        let result = [];
        for (const val of state) {
            for (let i = 3; i >= 0; i--)
                result.push((val >>> (i * 8)) & 0xFF);
        }
        return result;
    }
    totp.calcSha1Hash = calcSha1Hash;
    function decodeBase32(str) {
        const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        let result = [];
        let bits = 0;
        let bitsLen = 0;
        for (const c of str) {
            if (c == " ")
                continue;
            const i = ALPHABET.indexOf(c.toUpperCase());
            if (i == -1)
                throw new RangeError("Invalid Base32 string");
            bits = (bits << 5) | i;
            bitsLen += 5;
            if (bitsLen >= 8) {
                bitsLen -= 8;
                result.push(bits >>> bitsLen);
                bits &= (1 << bitsLen) - 1;
            }
        }
        return result;
    }
    totp.decodeBase32 = decodeBase32;
    totp.TEST_SUITE = [
        function testHotp() {
            const CASES = [
                [0, "284755224"],
                [1, "094287082"],
                [2, "137359152"],
                [3, "726969429"],
                [4, "640338314"],
                [5, "868254676"],
                [6, "918287922"],
                [7, "082162583"],
                [8, "673399871"],
                [9, "645520489"],
            ];
            const SECRET_KEY = [0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30];
            for (let [counter, expect] of CASES) {
                let counterBytes = [];
                for (let i = 0; i < 8; i++, counter = Math.floor(counter / 256))
                    counterBytes.unshift(counter & 0xFF);
                const actual = calcHotp(SECRET_KEY, counterBytes, 9);
                if (actual != expect)
                    throw new Error("Value mismatch");
            }
        },
        function testTotp() {
            const CASES = [
                [59, "94287082"],
                [1111111109, "07081804"],
                [1111111111, "14050471"],
                [1234567890, "89005924"],
                [2000000000, "69279037"],
                [20000000000, "65353130"],
            ];
            const SECRET_KEY = [0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30];
            for (const [timestamp, expect] of CASES) {
                const actual = calcTotp(SECRET_KEY, 0, 30, timestamp, 8);
                if (actual != expect)
                    throw new Error("Value mismatch");
            }
        },
    ];
})(totp || (totp = {}));
