/*
 * 1D barcode generator (compiled from TypeScript)
 *
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/1d-barcode-generator-javascript
 */
"use strict";
/*---- User interface logic ----*/
var app;
(function (app) {
    // Sets event handler on form inputs.
    function initialize() {
        var formElem = document.querySelector("article form");
        formElem.onsubmit = function () {
            doGenerate();
            return false;
        };
        var textElems = formElem.querySelectorAll("input[type=text], input[type=number]");
        for (var _i = 0, textElems_1 = textElems; _i < textElems_1.length; _i++) {
            var elem = textElems_1[_i];
            elem.oninput = doGenerate;
        }
        var radioElems = formElem.querySelectorAll("#barcode-type-container input");
        for (var _a = 0, radioElems_1 = radioElems; _a < radioElems_1.length; _a++) {
            var elem = radioElems_1[_a];
            elem.onchange = doGenerate;
        }
        doGenerate();
    }
    setTimeout(initialize);
    // The one and only entry point, called by event handlers of HTML elements.
    function doGenerate() {
        try {
            // Get canvas and graphics
            var canvas = document.querySelector("article form canvas");
            if (!(canvas instanceof HTMLCanvasElement))
                throw new Error("Assertion error");
            var graphics = canvas.getContext("2d");
            if (!(graphics instanceof CanvasRenderingContext2D))
                throw new Error("Assertion error");
            graphics.clearRect(0, 0, canvas.width, canvas.height);
            // Select barcode generator function based on radio buttons
            var radioElem = document.querySelector("#barcode-type-container input:checked");
            var func = barcodegen[radioElem.id];
            if (func === undefined)
                throw new Error("Assertion error");
            // Try to generate barcode
            var barcode = func(getInput("text").value).bars; // 0s and 1s
            // Dimensions of canvas and new image
            var scale_1 = parseInt(getInput("bar-width").value, 10);
            var padding_1 = parseInt(getInput("padding").value, 10); // Number of pixels on each of the four sides
            var width_1 = canvas.width = barcode.length * scale_1 + padding_1 * 2;
            var height_1 = canvas.height = parseInt(getInput("bar-height").value) + padding_1 * 2;
            // Create image and fill with opaque white color
            var image = graphics.createImageData(width_1, height_1);
            var pixels_1 = image.data; // An array of bytes in RGBA format
            for (var i = 0; i < pixels_1.length; i++)
                pixels_1[i] = 0xFF;
            // Draw barcode onto image and canvas
            barcode.forEach(function (barcolor, i) {
                for (var y = padding_1; y < height_1 - padding_1; y++) {
                    for (var x = padding_1 + i * scale_1, dx = 0; dx < scale_1; dx++) {
                        var k = ((y * width_1) + x + dx) * 4;
                        pixels_1[k + 0] = pixels_1[k + 1] = pixels_1[k + 2] = barcolor * 255; // Red, green, blue channels
                    }
                }
            });
            graphics.putImageData(image, 0, 0);
            getElem("feedback").textContent = "OK";
        }
        catch (e) {
            getElem("feedback").textContent = "Error: " + e.message;
        }
    }
    /*-- Utility functions --*/
    function getElem(id) {
        var result = document.getElementById(id);
        if (result instanceof HTMLElement)
            return result;
        throw new Error("Assertion error");
    }
    function getInput(id) {
        var result = getElem(id);
        if (result instanceof HTMLInputElement)
            return result;
        throw new Error("Assertion error");
    }
})(app || (app = {}));
/*---- Barcode generator functions ----*/
// In the barcodegen module, each exported function takes a text string and returns
// an array of 0s and 1s. By convention, 0 means black and 1 means white.
var barcodegen;
(function (barcodegen) {
    function code128(s) {
        // Encode into a sequence of numbers
        var encoded = [104]; // Start code B
        for (var i = 0; i < s.length; i++) {
            var c = s.charCodeAt(i);
            if (c < 32)
                encoded.push(98, c + 64); // 98 is Shift A
            else if (c < 128)
                encoded.push(c - 32);
            else
                throw new RangeError("Text must only contain ASCII characters");
        }
        // Append checksum number
        var checksum = encoded[0];
        encoded.forEach(function (x, i) {
            return checksum = (checksum + x * i) % 103;
        });
        encoded.push(checksum);
        // Build barcode
        var TABLE = [
            "010011001", "011001001", "011001100", "110110011", "110111001", "111011001", "110011011", "110011101", "111001101", "011011011",
            "011011101", "011101101", "100110001", "110010001", "110011000", "100011001", "110001001", "110001100", "011000110", "011010001",
            "011011000", "010001101", "011000101", "001001000", "001011001", "001101001", "001101100", "001001101", "001100101", "001100110",
            "010010011", "010011100", "011100100", "101110011", "111010011", "111011100", "100111011", "111001011", "111001110", "010111011",
            "011101011", "011101110", "100100011", "100111000", "111001000", "100010011", "100011100", "111000100", "001000100", "010111000",
            "011101000", "010001011", "010001110", "010001000", "001010011", "001011100", "001110100", "001001011", "001001110", "001110010",
            "001000010", "011011110", "000111010", "101100111", "101111001", "110100111", "110111100", "111101001", "111101100", "100110111",
            "100111101", "110010111", "110011110", "111100101", "111100110", "011110110", "011010111", "000100010", "011110101", "111000010",
            "101100001", "110100001", "110110000", "100001101", "110000101", "110000110", "000101101", "000110101", "000110110", "010010000",
            "010000100", "000100100", "101000011", "101110000", "111010000", "100001011", "100001110", "000101011", "000101110", "100010000",
            "100001000", "001010000", "000101000", "010111101", "010110111", "010110001",
        ];
        var result = new Barcode();
        encoded.forEach(function (x) {
            return result.appendDigits("0" + TABLE[x] + "1");
        });
        result.appendDigits("0011100010100"); // Stop code
        return result;
    }
    barcodegen.code128 = code128;
    function code93(s) {
        // Escape the string
        var t = "";
        for (var i = 0; i < s.length; i++) {
            var c = s.charCodeAt(i);
            if (c >= 128)
                throw new RangeError("Text must only contain ASCII characters");
            else if (c == 32 || c == 45 || c == 46 || 48 <= c && c <= 57 || 65 <= c && c <= 90)
                t += String.fromCharCode(c);
            else if (c == 0)
                t += "bU";
            else if (c == 64)
                t += "bV";
            else if (c == 96)
                t += "bW";
            else if (c == 127)
                t += "bT";
            else if (c <= 26)
                t += "a" + String.fromCharCode(c - 1 + 65);
            else if (c <= 31)
                t += "b" + String.fromCharCode(c - 27 + 65);
            else if (c <= 58)
                t += "c" + String.fromCharCode(c - 33 + 65);
            else if (c <= 63)
                t += "b" + String.fromCharCode(c - 54 + 65);
            else if (c <= 95)
                t += "b" + String.fromCharCode(c - 81 + 65);
            else if (c <= 122)
                t += "d" + String.fromCharCode(c - 97 + 65);
            else if (c <= 126)
                t += "b" + String.fromCharCode(c - 108 + 65);
            else
                throw new Error("Assertion error");
        }
        s = t; // s is reduced into the 47-symbol 'alphabet' defined below
        // Add 2 checksum symbols
        var ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%abcd*"; // The 5 characters abcd* are special
        [20, 15].forEach(function (mod) {
            var checksum = 0;
            for (var i = 0; i < s.length; i++) {
                var code = ALPHABET.indexOf(s.charAt(s.length - 1 - i));
                var weight = i % mod + 1;
                checksum = (checksum + code * weight) % 47;
            }
            s += ALPHABET.charAt(checksum);
        });
        s = "*" + s + "*"; // Start and end
        // Build barcode
        var TABLE = [
            "1110101", "1011011", "1011101", "1011110", "1101011", "1101101", "1101110", "1010111", "1110110", "1111010",
            "0101011", "0101101", "0101110", "0110101", "0110110", "0111010", "1001011", "1001101", "1001110", "1100101",
            "1110010", "1010011", "1011001", "1011100", "1101001", "1110100", "0100101", "0100110", "0101001", "0101100",
            "0110100", "0110010", "1001001", "1001100", "1100100", "1100010", "1101000", "0010101", "0010110", "0011010",
            "1001000", "1000100", "0101000", "1101100", "0010010", "0010100", "1100110", "1010000",
        ];
        var result = new Barcode();
        for (var _i = 0, s_1 = s; _i < s_1.length; _i++) {
            var c = s_1[_i];
            result.appendDigits("0" + TABLE[ALPHABET.indexOf(c)] + "1");
        }
        result.appendDigits("0"); // Final black bar
        return result;
    }
    barcodegen.code93 = code93;
    function code39(s) {
        if (!/^[0-9A-Z. +\/$%-]*$/.test(s))
            throw new RangeError("Text must only contain allowed characters");
        // Parameters. The spec recommends that 2.0 <= WIDE/NARROW <= 3.0
        var NARROW = 2, WIDE = 5;
        var TABLE = {
            "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn", "4": "nnnwwnnnw", "5": "wnnwwnnnn",
            "6": "nnwwwnnnn", "7": "nnnwnnwnw", "8": "wnnwnnwnn", "9": "nnwwnnwnn", "0": "nnnwwnwnn",
            "A": "wnnnnwnnw", "B": "nnwnnwnnw", "C": "wnwnnwnnn", "D": "nnnnwwnnw", "E": "wnnnwwnnn",
            "F": "nnwnwwnnn", "G": "nnnnnwwnw", "H": "wnnnnwwnn", "I": "nnwnnwwnn", "J": "nnnnwwwnn",
            "K": "wnnnnnnww", "L": "nnwnnnnww", "M": "wnwnnnnwn", "N": "nnnnwnnww", "O": "wnnnwnnwn",
            "P": "nnwnwnnwn", "Q": "nnnnnnwww", "R": "wnnnnnwwn", "S": "nnwnnnwwn", "T": "nnnnwnwwn",
            "U": "wwnnnnnnw", "V": "nwwnnnnnw", "W": "wwwnnnnnn", "X": "nwnnwnnnw", "Y": "wwnnwnnnn",
            "Z": "nwwnwnnnn", "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", "*": "nwnnwnwnn",
            "+": "nwnnnwnwn", "/": "nwnwnnnwn", "$": "nwnwnwnnn", "%": "nnnwnwnwn",
        };
        var result = new Barcode();
        for (var _i = 0, _a = "*" + s + "*"; _i < _a.length; _i++) {
            var c = _a[_i];
            result.appendNarrowWide(TABLE[c] + "n", NARROW, WIDE);
        }
        return result;
    }
    barcodegen.code39 = code39;
    function interleaved2Of5(s) {
        if (!/^(\d\d)*$/.test(s))
            throw new RangeError("Text must be all digits and even length");
        // Parameters. The spec recommends that 2.0 <= WIDE/NARROW <= 3.0
        var NARROW = 2, WIDE = 5;
        var TABLE = [
            "nnwwn", "wnnnw", "nwnnw", "wwnnn", "nnwnw",
            "wnwnn", "nwwnn", "nnnww", "wnnwn", "nwnwn"
        ];
        // Encode symbol pairs and interleave bars
        var encoded; // String of n/w characters
        encoded = "nnnn"; // Start
        for (var i = 0; i < s.length; i += 2) {
            var a = TABLE[parseInt(s.charAt(i + 0), 10)];
            var b = TABLE[parseInt(s.charAt(i + 1), 10)];
            for (var j = 0; j < 5; j++)
                encoded += a.charAt(j) + b.charAt(j);
        }
        encoded += "wnn"; // Stop
        var result = new Barcode();
        result.appendNarrowWide(encoded, NARROW, WIDE);
        return result;
    }
    barcodegen.interleaved2Of5 = interleaved2Of5;
    function codabar(s) {
        if (!/^[0-9$$\/:.+-]*$/.test(s))
            throw new RangeError("Text must only contain allowed characters");
        // Parameters. The spec recommends that 2.25 <= WIDE/NARROW <= 3.0
        var NARROW = 2, WIDE = 5;
        // Build barcode
        var TABLE = {
            "0": "nnnnnww", "1": "nnnnwwn", "2": "nnnwnnw", "3": "wwnnnnn",
            "4": "nnwnnwn", "5": "wnnnnwn", "6": "nwnnnnw", "7": "nwnnwnn",
            "8": "nwwnnnn", "9": "wnnwnnn", "-": "nnnwwnn", "$": "nnwwnnn",
            ".": "wnwnwnn", "/": "wnwnnnw", ":": "wnnnwnw", "+": "nnwnwnw",
            "A": "nnwwnwn", "B": "nwnwnnw", "C": "nnnwnww", "D": "nnnwwwn",
        };
        s = "A" + s + "A"; // Start and stop symbols (can be A/B/C/D)
        var result = new Barcode();
        for (var _i = 0, s_2 = s; _i < s_2.length; _i++) {
            var c = s_2[_i];
            result.appendNarrowWide(TABLE[c] + "n", NARROW, WIDE);
        }
        return result;
    }
    barcodegen.codabar = codabar;
    function upcARaw(s) {
        if (!/^\d{12}$/.test(s))
            throw new RangeError("Text must be 12 digits long");
        var TABLE = [
            "1110010", "1100110", "1101100", "1000010", "1011100",
            "1001110", "1010000", "1000100", "1001000", "1110100"
        ];
        var result = new Barcode();
        result.appendDigits("010"); // Start
        for (var i = 0; i < s.length; i++) {
            if (i == s.length / 2)
                result.appendDigits("10101"); // Middle
            var code = TABLE[parseInt(s.charAt(i), 10)];
            result.appendDigits(code, i >= s.length / 2); // Invert right half
        }
        result.appendDigits("010"); // End
        return result;
    }
    barcodegen.upcARaw = upcARaw;
    function upcACheck(s) {
        return upcARaw(addCheckDigit(11, s));
    }
    barcodegen.upcACheck = upcACheck;
    function ean13Raw(s) {
        if (!/^\d{13}$/.test(s))
            throw new RangeError("Text must be 13 digits long");
        var TABLE0 = [
            "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
            "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"
        ];
        var TABLE1 = [
            "11001", "10011", "10110", "00001", "01110",
            "00111", "01000", "00010", "00100", "11010"
        ];
        var result = new Barcode();
        result.appendDigits("010"); // Start
        var leftCtrl = TABLE0[parseInt(s.charAt(0), 10)]; // Leading digit
        for (var i = 1; i < s.length; i++) {
            if (i == 7) // Center
                result.appendDigits("10101");
            var code = "1" + TABLE1[parseInt(s.charAt(i), 10)] + "0";
            var invert = !(i < 7 && leftCtrl.charAt(i - 1) == "L");
            if (i < 7 && leftCtrl.charAt(i - 1) == "G") {
                invert = true;
                var newCode = "";
                for (var _i = 0, code_1 = code; _i < code_1.length; _i++) {
                    var c = code_1[_i];
                    newCode = c + newCode;
                }
                code = newCode;
            }
            result.appendDigits(code, invert);
        }
        result.appendDigits("010"); // End
        return result;
    }
    barcodegen.ean13Raw = ean13Raw;
    function ean13Check(s) {
        return ean13Raw(addCheckDigit(12, s));
    }
    barcodegen.ean13Check = ean13Check;
    function ean8Raw(s) {
        if (!/^\d{8}$/.test(s))
            throw new RangeError("Text must be 8 digits long");
        var TABLE = [
            "11001", "10011", "10110", "00001", "01110",
            "00111", "01000", "00010", "00100", "11010"
        ];
        var result = new Barcode();
        result.appendDigits("010"); // Start
        for (var i = 0; i < s.length; i++) {
            if (i == s.length / 2) // Center
                result.appendDigits("10101");
            var code = "1" + TABLE[parseInt(s.charAt(i), 10)] + "0";
            result.appendDigits(code, i >= s.length / 2); // Invert right half
        }
        result.appendDigits("010"); // End
        return result;
    }
    barcodegen.ean8Raw = ean8Raw;
    function ean8Check(s) {
        return ean8Raw(addCheckDigit(7, s));
    }
    barcodegen.ean8Check = ean8Check;
    /*-- Shared utility function and class --*/
    // e.g. addCheckDigit(7, "3216548") -> "32165487".
    function addCheckDigit(len, s) {
        if (!/^\d*$/.test(s) || s.length != len)
            throw new RangeError("Text must be " + len + " digits long");
        var sum = 0;
        var weight = len % 2 == 0 ? 1 : 3; // Ensure last digit has weight 3
        for (var _i = 0, s_3 = s; _i < s_3.length; _i++) {
            var c = s_3[_i];
            sum += parseInt(c, 10) * weight;
            weight = 4 - weight; // Alternate between 1 and 3
        }
        return s + (10 - sum % 10) % 10;
    }
    // Simply an array of 0s and 1s.
    var Barcode = /** @class */ (function () {
        function Barcode() {
            this.bars = [];
        }
        // Appends the given string of 0s and 1s to this array.
        Barcode.prototype.appendDigits = function (s, invert) {
            if (invert === void 0) { invert = false; }
            for (var _i = 0, s_4 = s; _i < s_4.length; _i++) {
                var c = s_4[_i];
                this.bars.push(parseInt(c, 10) ^ (invert ? 1 : 0));
            }
        };
        // Appends alternating repeats of 0s and 1s according to the given values.
        Barcode.prototype.appendNarrowWide = function (s, narrow, wide) {
            var color = 0;
            for (var _i = 0, s_5 = s; _i < s_5.length; _i++) {
                var c = s_5[_i];
                var rep = c == "n" ? narrow : wide;
                for (var i = 0; i < rep; i++)
                    this.bars.push(color);
                color ^= 1;
            }
        };
        return Barcode;
    }());
    barcodegen.Barcode = Barcode;
})(barcodegen || (barcodegen = {}));
