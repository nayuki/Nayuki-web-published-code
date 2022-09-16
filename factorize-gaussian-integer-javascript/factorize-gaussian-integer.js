/*
 * Factorize Gaussian integer (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/factorize-gaussian-integer-javascript
 */
"use strict";
var app;
(function (app) {
    /*
     * Handles the HTML input/output for factoring a Gaussian integer.
     */
    function doFactor() {
        let outElem = document.getElementById("factorization");
        while (outElem.firstChild !== null)
            outElem.removeChild(outElem.firstChild);
        const input = document.getElementById("number").value;
        if (/^\s*$/.test(input)) { // Blank input
            outElem.textContent = NBSP;
            return;
        }
        // Formatting helper function
        function appendGaussianInteger(n) {
            const s = n.toString();
            if (s.charAt(s.length - 1) != "i")
                outElem.append(s);
            else {
                let varElem = document.createElement("var");
                varElem.textContent = "i";
                outElem.append(s.substring(0, s.length - 1));
                outElem.append(varElem);
            }
        }
        try {
            const num = GaussianInteger.parseString(input);
            const factorization = num.factorize();
            appendGaussianInteger(num);
            outElem.append(" = ");
            factorization.forEach((factor, i) => {
                if (i > 0)
                    outElem.append(" ");
                outElem.append("(");
                appendGaussianInteger(factor);
                outElem.append(")");
            });
        }
        catch (e) {
            outElem.append(e.message);
        }
    }
    app.doFactor = doFactor;
    function doRandom() {
        function randInt() {
            return Math.floor(Math.random() * 2000) - 1000;
        }
        const type = Math.random();
        let str;
        if (type < 0.2)
            str = randInt().toString();
        else if (type < 0.3)
            str = randInt() + "i";
        else {
            const real = randInt();
            const imag = randInt();
            str = real + (imag >= 0 ? " + " : " - ") + Math.abs(imag) + "i";
        }
        document.getElementById("number").value = str;
        doFactor();
    }
    app.doRandom = doRandom;
    class GaussianInteger {
        constructor(real, imag) {
            this.real = real;
            this.imag = imag;
        }
        norm() {
            return this.real * this.real + this.imag * this.imag;
        }
        multiply(other) {
            return new GaussianInteger(this.real * other.real - this.imag * other.imag, this.real * other.imag + this.imag * other.real);
        }
        isDivisibleBy(re, im) {
            const divisorNorm = re * re + im * im;
            return (this.real * re + this.imag * im) % divisorNorm == 0 &&
                (-this.real * im + this.imag * re) % divisorNorm == 0;
        }
        divide(other) {
            if (!this.isDivisibleBy(other.real, other.imag))
                throw new RangeError("Cannot divide");
            return new GaussianInteger((this.real * other.real + this.imag * other.imag) / other.norm(), (-this.real * other.imag + this.imag * other.real) / other.norm());
        }
        factorize() {
            if (this.norm() <= 1) // 0, 1, -1, i, -i
                return [this];
            let result = [];
            let temp = this;
            let check = new GaussianInteger(1, 0);
            while (temp.norm() > 1) {
                const factor = temp.findPrimeFactor();
                result.push(factor);
                temp = temp.divide(factor);
                check = check.multiply(factor);
            }
            check = check.multiply(temp);
            if (temp.norm() != 1 || check.real != this.real || check.imag != this.imag)
                throw new Error("Assertion error");
            if (temp.real != 1) // -1, i, -i
                result.push(temp);
            result.sort((x, y) => {
                if (x.norm() < y.norm())
                    return -1;
                else if (x.norm() > y.norm())
                    return +1;
                else if (x.real > y.real)
                    return -1;
                else if (x.real < y.real)
                    return +1;
                else
                    return 0;
            });
            return result;
        }
        findPrimeFactor() {
            const norm = this.norm();
            if (norm % 2 == 0)
                return new GaussianInteger(1, 1);
            for (let i = 3, end = Math.floor(Math.sqrt(norm)); i <= end; i += 2) { // Find factors of norm
                if (norm % i == 0) {
                    if (i % 4 == 3)
                        return new GaussianInteger(i, 0);
                    else {
                        for (let re = Math.floor(Math.sqrt(i)); re > 0; re--) {
                            const im = Math.round(Math.sqrt(i - re * re));
                            if (re * re + im * im == i && this.isDivisibleBy(re, im))
                                return new GaussianInteger(re, im);
                        }
                    }
                }
            }
            // This number itself is prime. Rotate so that the argument is in [0, pi/2)
            let temp = this;
            while (temp.real < 0 || temp.imag < 0)
                temp = temp.multiply(new GaussianInteger(0, 1));
            return temp;
        }
        toString() {
            if (this.real == 0 && this.imag == 0)
                return "0";
            else {
                let result = "";
                if (this.real != 0)
                    result += this.real > 0 ? this.real : MINUS + (-this.real);
                if (this.imag != 0) {
                    if (result == "")
                        result += this.imag > 0 ? "" : MINUS;
                    else
                        result += this.imag > 0 ? " + " : ` ${MINUS} `;
                    result += (Math.abs(this.imag) != 1 ? Math.abs(this.imag) : "") + "i";
                }
                return result;
            }
        }
        static parseString(str) {
            if (/\d\s+\d/.test(str)) // Spaces are not allowed between digits
                throw new RangeError("Invalid number");
            str = str.replace(/\s+/g, ""); // Remove all whitespace
            str = str.replace(/\u2212/g, "-");
            str = str.replace(/j/g, "i");
            function checkedParseInt(s) {
                const n = parseInt(s, 10);
                if (Math.abs(n) >= 67108864)
                    throw new RangeError("Number is too large");
                return n;
            }
            // Match one of the syntax cases
            let real, imag;
            let mat;
            if ((mat = /^([+-]?\d+)$/.exec(str)) !== null) { // e.g. 1, +0, -2
                real = checkedParseInt(mat[1]);
                imag = 0;
            }
            else if ((mat = /^([+-]?)(\d*)i$/.exec(str)) !== null) { // e.g. i, 4i, -3i
                real = 0;
                imag = checkedParseInt(mat[1] + (mat[2] != "" ? mat[2] : "1"));
            }
            else if ((mat = /^([+-]?\d+)([+-])(\d*)i$/.exec(str)) !== null) { // e.g. 1+2i, -3-4i, +5+i
                real = checkedParseInt(mat[1]);
                imag = checkedParseInt(mat[2] + (mat[3] != "" ? mat[3] : "1"));
            }
            else if ((mat = /^([+-]?)(\d*)i([+-]\d+)$/.exec(str)) !== null) { // e.g. 2i+1, -4i-3, +i+5
                real = checkedParseInt(mat[3]);
                imag = checkedParseInt(mat[1] + (mat[2] != "" ? mat[2] : "1"));
            }
            else
                throw new RangeError("Invalid number");
            return new GaussianInteger(real, imag);
        }
    }
    const MINUS = "\u2212";
    const NBSP = "\u00A0";
})(app || (app = {}));
