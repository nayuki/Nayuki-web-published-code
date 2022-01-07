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
    var inputXElem = document.querySelector("#numberX");
    var inputYElem = document.querySelector("#numberY");
    function doCalculate() {
        var outputElem = document.querySelector("#output");
        var xStr = inputXElem.value;
        var yStr = inputYElem.value;
        if (xStr == "" || yStr == "") {
            outputElem.textContent = "";
            return;
        }
        var xInt;
        var yInt;
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
    var numRandomClicked = 0;
    function doRandom() {
        numRandomClicked++;
        var limit = numRandomClicked / 10;
        var len = Math.floor(Math.random() * limit) + 1;
        function genRandom() {
            var result = "";
            for (var i = 0; i < len; i++)
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
    var Uint = /** @class */ (function () {
        function Uint(val) {
            this.digits = []; // Little endian
            if (typeof val == "string") {
                if (!/^[0-9]+$/.test(val))
                    throw new RangeError("Invalid number string");
                for (var _i = 0, val_1 = val; _i < val_1.length; _i++) {
                    var c = val_1[_i];
                    this.digits.push(parseInt(c, 10));
                }
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
        Uint.prototype.isZero = function () {
            return this.digits.every(function (d) { return d == 0; });
        };
        Uint.prototype.isEven = function () {
            return this.digits[0] % 2 == 0;
        };
        Uint.prototype.isLessThan = function (other) {
            var result = false;
            var a = this.digits;
            var b = other.digits;
            for (var i = 0; i < a.length || i < b.length; i++) {
                var x = i < a.length ? a[i] : 0;
                var y = i < b.length ? b[i] : 0;
                if (x < y)
                    result = true;
                if (x > y)
                    result = false;
            }
            return result;
        };
        Uint.prototype.subtract = function (other) {
            var newDigits = [];
            var borrow = 0;
            var a = this.digits;
            var b = other.digits;
            for (var i = 0; i < a.length || i < b.length; i++) {
                var x = i < a.length ? a[i] : 0;
                var y = i < b.length ? b[i] : 0;
                var diff = x - y - borrow;
                borrow = -Math.floor(diff / 10);
                newDigits.push(diff + borrow * 10);
            }
            if (borrow > 0)
                throw new RangeError("Negative result");
            return new Uint(newDigits);
        };
        // n must be in the range [0, 9].
        Uint.prototype.multiply = function (n) {
            var newDigits = [];
            var carry = 0;
            this.digits.forEach(function (digit) {
                var sum = digit * n + carry;
                newDigits.push(sum % 10);
                carry = Math.floor(sum / 10);
            });
            if (carry > 0)
                newDigits.push(carry);
            return new Uint(newDigits);
        };
        Uint.prototype.divide2Exact = function () {
            if (!this.isEven())
                throw new Error("Number is odd");
            var temp = this.multiply(5);
            var newDigits = temp.digits.slice();
            newDigits.shift();
            return new Uint(newDigits);
        };
        Uint.prototype.gcd = function (other) {
            var _a;
            var x = this;
            var y = other;
            var twos = 0;
            while (true) { // Binary GCD algorithm
                if (x.isLessThan(y))
                    _a = [y, x], x = _a[0], y = _a[1];
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
            for (var i = 0; i < twos; i++)
                x = x.multiply(2);
            return x;
        };
        Uint.prototype.toString = function () {
            return this.digits.slice().reverse().map(function (d) { return d.toString(); }).join("");
        };
        return Uint;
    }());
})(app || (app = {}));
