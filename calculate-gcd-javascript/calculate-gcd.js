/*
 * GCD calculator (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/calculate-gcd-javascript
 */
"use strict";
var app;
(function (app) {
    /*---- Entry points from HTML page ----*/
    let inputXElem = document.querySelector("#numberX");
    let inputYElem = document.querySelector("#numberY");
    function doCalculate() {
        let outputElem = document.querySelector("#output");
        const xStr = inputXElem.value;
        const yStr = inputYElem.value;
        if (xStr == "" || yStr == "") {
            outputElem.textContent = "";
            return;
        }
        let xInt;
        let yInt;
        try {
            xInt = new Uint(xStr);
            yInt = new Uint(yStr);
        }
        catch (e) {
            outputElem.textContent = "Not zero or positive integer";
            return;
        }
        try {
            outputElem.textContent = xInt.gcd(yInt).toString();
        }
        catch (e) {
            outputElem.textContent = "Assertion error";
        }
    }
    app.doCalculate = doCalculate;
    let numRandomClicked = 0;
    function doRandom() {
        numRandomClicked++;
        const limit = numRandomClicked / 10;
        const len = Math.floor(Math.random() * limit) + 1;
        function genRandom() {
            let result = "";
            for (let i = 0; i < len; i++)
                result += Math.floor(Math.random() * 10);
            return result.replace(/^0+(.)/g, "$1");
        }
        inputXElem.value = genRandom();
        inputYElem.value = genRandom();
        doCalculate();
    }
    app.doRandom = doRandom;
    /*---- Data structure and algorithms ----*/
    // An unsigned big integer represented in decimal (base 10).
    class Uint {
        constructor(val) {
            this.digits = []; // Little endian
            if (typeof val == "string") {
                if (!/^[0-9]+$/.test(val))
                    throw new RangeError("Invalid number string");
                for (const c of val)
                    this.digits.push(parseInt(c, 10));
                this.digits.reverse();
            }
            else if (Array.isArray(val)) {
                if (val.length == 0)
                    this.digits = [0];
                else
                    this.digits = val.slice();
            }
            else
                throw new TypeError("Invalid argument type");
            // Remove trailing zeros
            while (this.digits.length > 1 && this.digits[this.digits.length - 1] == 0)
                this.digits.pop();
            if (this.digits.length == 0)
                throw new Error("Assertion error");
        }
        isZero() {
            return this.digits.every(d => d == 0);
        }
        isEven() {
            return this.digits[0] % 2 == 0;
        }
        isLessThan(other) {
            let result = false;
            const a = this.digits;
            const b = other.digits;
            for (let i = 0; i < a.length || i < b.length; i++) {
                const x = i < a.length ? a[i] : 0;
                const y = i < b.length ? b[i] : 0;
                if (x < y)
                    result = true;
                if (x > y)
                    result = false;
            }
            return result;
        }
        subtract(other) {
            let newDigits = [];
            let borrow = 0;
            const a = this.digits;
            const b = other.digits;
            for (let i = 0; i < a.length || i < b.length; i++) {
                const x = i < a.length ? a[i] : 0;
                const y = i < b.length ? b[i] : 0;
                const diff = x - y - borrow;
                borrow = -Math.floor(diff / 10);
                newDigits.push(diff + borrow * 10);
            }
            if (borrow > 0)
                throw new RangeError("Negative result");
            return new Uint(newDigits);
        }
        // n must be in the range [0, 9].
        multiply(n) {
            let newDigits = [];
            let carry = 0;
            this.digits.forEach(digit => {
                const sum = digit * n + carry;
                newDigits.push(sum % 10);
                carry = Math.floor(sum / 10);
            });
            if (carry > 0)
                newDigits.push(carry);
            return new Uint(newDigits);
        }
        divide2Exact() {
            if (!this.isEven())
                throw new Error("Number is odd");
            const temp = this.multiply(5);
            let newDigits = temp.digits.slice();
            newDigits.shift();
            return new Uint(newDigits);
        }
        gcd(other) {
            let x = this;
            let y = other;
            let twos = 0;
            while (true) { // Binary GCD algorithm
                if (x.isLessThan(y))
                    [x, y] = [y, x];
                if (y.isZero())
                    break;
                if (x.isEven() && y.isEven()) {
                    x = x.divide2Exact();
                    y = y.divide2Exact();
                    twos++;
                }
                else if (x.isEven())
                    x = x.divide2Exact();
                else if (y.isEven())
                    y = y.divide2Exact();
                else
                    x = x.subtract(y).divide2Exact();
            }
            for (let i = 0; i < twos; i++)
                x = x.multiply(2);
            return x;
        }
        toString() {
            return this.digits.slice().reverse().map(d => d.toString()).join("");
        }
    }
})(app || (app = {}));
